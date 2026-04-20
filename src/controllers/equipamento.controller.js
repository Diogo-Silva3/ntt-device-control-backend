const prisma = require('../config/prisma');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { registrarLog } = require('./auditoria.controller');

const calcularStatusGarantia = (dataGarantia) => {
  if (!dataGarantia) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataGarantia);
  vencimento.setHours(0, 0, 0, 0);
  const trintaDias = new Date(hoje);
  trintaDias.setDate(trintaDias.getDate() + 30);
  if (vencimento < hoje) return 'GARANTIA_VENCIDA';
  if (vencimento <= trintaDias) return 'GARANTIA_VENCENDO';
  return null;
};

const PROCESSO_STEPS = ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega', 'Entregue ao Usuário', 'Em Uso', 'Em Manutenção', 'Baixado'];

const CHECKLIST_PREPARACAO = ['imagem', 'drivers', 'office', 'antivirus', 'vpn', 'monitoramento', 'rede', 'login'];

/**
 * Dado um statusProcesso, retorna o status físico correto.
 * Garante que status e statusProcesso nunca fiquem dessincronizados.
 */
const statusParaProcesso = (statusProcesso) => {
  if (!statusProcesso) return undefined;
  if (['Entregue ao Usuário', 'Em Uso'].includes(statusProcesso)) return 'EM_USO';
  if (['Baixado'].includes(statusProcesso)) return 'DESCARTADO';
  if (['Em Manutenção'].includes(statusProcesso)) return 'MANUTENCAO';
  // Novo, Imagem Instalada, Softwares Instalados, Asset Registrado, Agendado para Entrega
  return 'DISPONIVEL';
};

const includeBase = {
  unidade: true,
  tecnico: { select: { id: true, nome: true } },
  vinculacoes: {
    where: { ativa: true },
    include: { usuario: { select: { id: true, nome: true, funcao: true } } },
  },
};

const listar = async (req, res) => {
  try {
    const { busca, status, statusProcesso, unidadeId, tipo, marca, page = 1, limit = 50 } = req.query;
    const empresaId = req.usuario.empresaId;
    const projetoId = req.headers['x-projeto-id'] ? parseInt(req.headers['x-projeto-id']) : null;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      empresaId,
      ...(projetoId && { projetoId }),
      // Esconde descartados por padrão, a menos que filtro explícito
      ...(status ? { status } : { status: { not: 'DESCARTADO' } }),
      ...(statusProcesso && {
        statusProcesso: statusProcesso === 'Imagem Instalada'
          ? { in: ['Imagem Instalada', 'Softwares Instalados'] }
          : statusProcesso === 'Entregue ao Usuário'
            ? { in: ['Entregue ao Usuário', 'Em Uso'] }
            : statusProcesso
      }),
      ...(unidadeId && { unidadeId: parseInt(unidadeId) }),
      ...(tipo && { tipo: { contains: tipo } }),
      ...(marca && { marca: { contains: marca } }),
      ...(busca && {
        OR: [
          { marca: { contains: busca, mode: 'insensitive' } },
          { modelo: { contains: busca, mode: 'insensitive' } },
          { serialNumber: { contains: busca, mode: 'insensitive' } },
          { tipo: { contains: busca, mode: 'insensitive' } },
          { patrimonio: { contains: busca, mode: 'insensitive' } },
          { unidade: { nome: { contains: busca, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, equipamentos] = await Promise.all([
      prisma.equipamento.count({ where }),
      prisma.equipamento.findMany({
        where,
        include: includeBase,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
    ]);

    const data = equipamentos.map(eq => ({
      ...eq,
      checklistPreparacao: eq.checklistPreparacao ? JSON.parse(eq.checklistPreparacao) : null,
      checklistEntrega: eq.checklistEntrega ? JSON.parse(eq.checklistEntrega) : null,
    }));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar equipamentos' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const equipamento = await prisma.equipamento.findFirst({
      where: { id: parseInt(req.params.id), empresaId: req.usuario.empresaId },
      include: {
        unidade: true,
        tecnico: { select: { id: true, nome: true } },
        vinculacoes: {
          include: { usuario: { select: { id: true, nome: true, funcao: true, email: true } } },
          orderBy: { dataInicio: 'desc' },
        },
        historicos: {
          include: { usuario: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!equipamento) return res.status(404).json({ error: 'Equipamento não encontrado' });

    // Parse JSON fields
    const result = {
      ...equipamento,
      checklistPreparacao: equipamento.checklistPreparacao ? JSON.parse(equipamento.checklistPreparacao) : null,
      checklistEntrega: equipamento.checklistEntrega ? JSON.parse(equipamento.checklistEntrega) : null,
      historicoEtapas: equipamento.historicoEtapas ? JSON.parse(equipamento.historicoEtapas) : [],
      agendamento: equipamento.agendamento ? JSON.parse(equipamento.agendamento) : null,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar equipamento' });
  }
};

const criar = async (req, res) => {
  try {
    const { tipo, marca, modelo, serialNumber, patrimonio, status, statusProcesso, unidadeId, observacao, tecnicoId } = req.body;
    const empresaId = req.usuario.empresaId;

    const equipamento = await prisma.equipamento.create({
      data: {
        tipo, marca, modelo, serialNumber, patrimonio,
        status: status || 'DISPONIVEL',
        statusProcesso: statusProcesso || 'Novo',
        unidadeId: unidadeId ? parseInt(unidadeId) : null,
        tecnicoId: tecnicoId ? parseInt(tecnicoId) : null,
        empresaId,
        observacao,
      },
      include: { unidade: true },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://nttdevicecontrol.web.app'
    const qrData = `${frontendUrl}/equipamentos/${equipamento.id}`
    const qrCode = await QRCode.toDataURL(qrData)
    const atualizado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { qrCode },
      include: { unidade: true },
    });

    res.status(201).json(atualizado);

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'EQUIPAMENTO_CRIADO',
      detalhes: `Equipamento criado: ${tipo} ${marca} ${modelo} — S/N: ${serialNumber || '—'}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { tipo, marca, modelo, serialNumber, patrimonio, status, statusProcesso, unidadeId, observacao, tecnicoId, dataEntrega, dataGarantia, comentarioEtapa, agendamento } = req.body;
    const id = parseInt(req.params.id);

    // Busca estado atual para comparar mudanças relevantes
    const anterior = await prisma.equipamento.findUnique({
      where: { id },
      select: { statusProcesso: true, historicoEtapas: true, tecnicoId: true, tecnico: { select: { nome: true } } },
    });

    // Se mudou statusProcesso, registra no histórico de etapas
    if (statusProcesso !== undefined && anterior && anterior.statusProcesso !== statusProcesso) {
      let etapasLog = [];
      try { etapasLog = anterior.historicoEtapas ? JSON.parse(anterior.historicoEtapas) : []; } catch { etapasLog = []; }
      if (!Array.isArray(etapasLog)) etapasLog = [];
      etapasLog.push({
        etapa: statusProcesso,
        de: anterior.statusProcesso,
        para: statusProcesso,
        tecnicoId: req.usuario.id,
        tecnicoNome: req.usuario.nome || req.usuario.email,
        comentario: comentarioEtapa || null,
        data: new Date().toISOString(),
      });
      await prisma.equipamento.update({ where: { id }, data: { historicoEtapas: JSON.stringify(etapasLog) } });

      await prisma.historico.create({
        data: {
          equipamentoId: id,
          usuarioId: req.usuario.id,
          acao: 'ETAPA_AVANCADA',
          descricao: `Etapa avançada: ${anterior.statusProcesso} → ${statusProcesso}${comentarioEtapa ? ` | ${comentarioEtapa}` : ''}`,
        },
      });
    }

    // Se mudou unidadeId, registra HistoricoLocalizacao dentro de uma transação
    let equipamento;
    if (unidadeId !== undefined) {
      const novaUnidadeId = unidadeId ? parseInt(unidadeId) : null;
      const atual = await prisma.equipamento.findUnique({ where: { id }, select: { unidadeId: true } });
      const unidadeAnteriorId = atual ? atual.unidadeId : null;
      const unidadeMudou = unidadeAnteriorId !== novaUnidadeId;

      [equipamento] = await prisma.$transaction(async (tx) => {
        const eq = await tx.equipamento.update({
          where: { id },
          data: {
            tipo, marca, modelo, serialNumber, patrimonio, status, observacao,
            ...(statusProcesso !== undefined && { statusProcesso }),
            // Sincroniza status físico com statusProcesso automaticamente
            ...(statusProcesso !== undefined && !status && { status: statusParaProcesso(statusProcesso) }),
            ...(dataEntrega !== undefined && { dataEntrega: dataEntrega ? new Date(dataEntrega) : null }),
            ...(dataGarantia !== undefined && { dataGarantia: dataGarantia ? new Date(dataGarantia) : null }),
            ...(agendamento && { agendamento: JSON.stringify(agendamento), ...(agendamento.data && { dataEntrega: new Date(agendamento.data) }) }),
            unidadeId: novaUnidadeId,
            tecnicoId: tecnicoId !== undefined ? (tecnicoId ? parseInt(tecnicoId) : null) : undefined,
          },
          include: { unidade: true, tecnico: { select: { id: true, nome: true } } },
        });

        if (unidadeMudou) {
          await tx.historicoLocalizacao.create({
            data: {
              equipamentoId: id,
              unidadeAnteriorId,
              unidadeNovaId: novaUnidadeId,
              tecnicoId: req.usuario.id,
            },
          });
        }

        return [eq];
      });
    } else {
      equipamento = await prisma.equipamento.update({
        where: { id },
        data: {
          tipo, marca, modelo, serialNumber, patrimonio, status, observacao,
          ...(statusProcesso !== undefined && { statusProcesso }),
          // Sincroniza status físico com statusProcesso automaticamente
          ...(statusProcesso !== undefined && !status && { status: statusParaProcesso(statusProcesso) }),
          ...(dataEntrega !== undefined && { dataEntrega: dataEntrega ? new Date(dataEntrega) : null }),
          ...(dataGarantia !== undefined && { dataGarantia: dataGarantia ? new Date(dataGarantia) : null }),
          ...(agendamento && { agendamento: JSON.stringify(agendamento), ...(agendamento.data && { dataEntrega: new Date(agendamento.data) }) }),
          tecnicoId: tecnicoId !== undefined ? (tecnicoId ? parseInt(tecnicoId) : null) : undefined,
        },
        include: { unidade: true, tecnico: { select: { id: true, nome: true } } },
      });
    }

    res.json({
      ...equipamento,
      agendamento: equipamento.agendamento ? JSON.parse(equipamento.agendamento) : null,
      checklistPreparacao: equipamento.checklistPreparacao ? JSON.parse(equipamento.checklistPreparacao) : null,
      checklistEntrega: equipamento.checklistEntrega ? JSON.parse(equipamento.checklistEntrega) : null,
      historicoEtapas: equipamento.historicoEtapas ? JSON.parse(equipamento.historicoEtapas) : [],
    });

    // Monta detalhes ricos: menciona técnico se foi designado/alterado
    const novoTecnicoId = tecnicoId !== undefined ? (tecnicoId ? parseInt(tecnicoId) : null) : undefined;
    let detalhesLog = `Equipamento #${id} atualizado por ${req.usuario.nome || req.usuario.email}`;
    if (statusProcesso && anterior?.statusProcesso !== statusProcesso) {
      detalhesLog += ` — etapa: ${anterior?.statusProcesso} → ${statusProcesso}`;
    }
    if (novoTecnicoId !== undefined && novoTecnicoId !== anterior?.tecnicoId) {
      const novoTecnico = novoTecnicoId
        ? await prisma.usuario.findUnique({ where: { id: novoTecnicoId }, select: { nome: true } })
        : null;
      const nomeAnterior = anterior?.tecnico?.nome || '—';
      const nomeNovo = novoTecnico?.nome || '—';
      detalhesLog += ` — técnico: ${nomeAnterior} → ${nomeNovo}`;
    }
    if (agendamento && agendamento.data) {
      detalhesLog += ` — agendamento: ${agendamento.data}`;
    }

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'EQUIPAMENTO_EDITADO',
      detalhes: detalhesLog,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
};

const atualizarChecklist = async (req, res) => {
  try {
    const { tipo, itens } = req.body; // tipo: 'preparacao' | 'entrega'
    const id = parseInt(req.params.id);

    const field = tipo === 'entrega' ? 'checklistEntrega' : 'checklistPreparacao';
    const data = { [field]: JSON.stringify(itens) };

    // Se checklist de entrega completo, muda status para Em Uso
    if (tipo === 'entrega' && itens && Object.values(itens).every(v => v === true)) {
      data.statusProcesso = 'Entregue ao Usuário';
      data.status = 'EM_USO';
      // Marca checklist de preparação como completo também
      const prepCompleto = Object.fromEntries(CHECKLIST_PREPARACAO.map(i => [i, true]));
      data.checklistPreparacao = JSON.stringify(prepCompleto);
    }

    // Se checklist de preparação: calcular progresso e atualizar statusProcesso
    if (tipo === 'preparacao' && itens) {
      // Tablet: checklist tem só { app, instalado }
      if (itens.instalado !== undefined && itens.app) {
        data.statusProcesso = itens.instalado ? 'Asset Registrado' : 'Novo'
      } else {
        const done = Object.values(itens).filter(v => v).length;
        const total = CHECKLIST_PREPARACAO.length; // 8

        if (done === 0) {
          data.statusProcesso = 'Novo';
        } else if (itens['imagem'] && done === 1) {
          data.statusProcesso = 'Imagem Instalada';
        } else if (itens['imagem'] && done < total) {
          data.statusProcesso = 'Softwares Instalados';
        } else if (done === total) {
          data.statusProcesso = 'Asset Registrado';
        } else if (!itens['imagem'] && done > 0) {
          data.statusProcesso = 'Imagem Instalada';
        }
      }
    }

    // Sincroniza status físico com statusProcesso (evita dessincronização)
    if (data.statusProcesso && !data.status) {
      data.status = statusParaProcesso(data.statusProcesso);
    }

    const equipamento = await prisma.equipamento.update({
      where: { id },
      data,
      include: { unidade: true, tecnico: { select: { id: true, nome: true } } },
    });

    res.json({
      ...equipamento,
      checklistPreparacao: equipamento.checklistPreparacao ? JSON.parse(equipamento.checklistPreparacao) : null,
      checklistEntrega: equipamento.checklistEntrega ? JSON.parse(equipamento.checklistEntrega) : null,
      agendamento: equipamento.agendamento ? JSON.parse(equipamento.agendamento) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar checklist' });
  }
};

const atualizarAgendamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const agendamento = req.body;

    const equipamento = await prisma.equipamento.update({
      where: { id },
      data: {
        agendamento: JSON.stringify(agendamento),
        statusProcesso: 'Agendado para Entrega',
        ...(agendamento.data && { dataEntrega: new Date(agendamento.data) }),
      },
      include: { unidade: true, tecnico: { select: { id: true, nome: true } } },
    });

    res.json({
      ...equipamento,
      agendamento: equipamento.agendamento ? JSON.parse(equipamento.agendamento) : null,
    });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'AGENDAMENTO_CRIADO',
      detalhes: `Agendamento criado para equipamento #${id}${agendamento.data ? ` — data: ${agendamento.data}` : ''}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar agendamento' });
  }
};

const deletar = async (req, res) => {
  try {
    await prisma.equipamento.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'DESCARTADO', statusProcesso: 'Baixado' },
    });
    res.json({ message: 'Equipamento marcado como descartado' });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'EQUIPAMENTO_DESCARTADO',
      detalhes: `Equipamento #${req.params.id} marcado como descartado`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
};

const qrcode = async (req, res) => {
  try {
    const equipamento = await prisma.equipamento.findFirst({
      where: { id: parseInt(req.params.id), empresaId: req.usuario.empresaId },
    });
    if (!equipamento) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json({ qrCode: equipamento.qrCode });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar QR Code' });
  }
};

const regenerarQrCodes = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId
    const frontendUrl = process.env.FRONTEND_URL || 'https://nttdevicecontrol.web.app'
    const equipamentos = await prisma.equipamento.findMany({ where: { empresaId }, select: { id: true } })
    let count = 0
    for (const eq of equipamentos) {
      const qrCode = await QRCode.toDataURL(`${frontendUrl}/equipamentos/${eq.id}`)
      await prisma.equipamento.update({ where: { id: eq.id }, data: { qrCode } })
      count++
    }
    res.json({ message: `${count} QR Codes regenerados com sucesso` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao regenerar QR Codes' })
  }
}

const uploadFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada' });
    const id = parseInt(req.params.id);
    const fotoUrl = `/uploads/fotos/${req.file.filename}`;

    // Remove foto antiga se existir
    const eq = await prisma.equipamento.findUnique({ where: { id }, select: { foto: true } });
    if (eq?.foto) {
      const oldPath = path.join(__dirname, '../../', eq.foto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const atualizado = await prisma.equipamento.update({
      where: { id },
      data: { foto: fotoUrl },
    });
    res.json({ foto: atualizado.foto });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
};

const alertasGarantia = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() + 30);
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        empresaId,
        dataGarantia: { not: null, lte: trintaDias },
      },
      include: { unidade: { select: { nome: true } } },
      orderBy: { dataGarantia: 'asc' },
    });
    const resultado = equipamentos.map(eq => ({
      ...eq,
      statusGarantia: calcularStatusGarantia(eq.dataGarantia),
    })).filter(eq => eq.statusGarantia !== null);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alertas de garantia' });
  }
};

const historicoLocalizacao = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const eq = await prisma.equipamento.findFirst({ where: { id, empresaId: req.usuario.empresaId } })
    if (!eq) return res.status(404).json({ error: 'Equipamento não encontrado' })
    const historico = await prisma.historicoLocalizacao.findMany({
      where: { equipamentoId: id },
      include: {
        unidadeAnterior: { select: { nome: true } },
        unidadeNova: { select: { nome: true } },
        tecnico: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(historico)
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico de localização' })
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, atualizarChecklist, atualizarAgendamento, deletar, qrcode, regenerarQrCodes, uploadFoto, alertasGarantia, historicoLocalizacao };
