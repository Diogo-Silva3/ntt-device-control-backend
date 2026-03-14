const prisma = require('../config/prisma');
const QRCode = require('qrcode');

const PROCESSO_STEPS = ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega', 'Entregue ao Usuário', 'Em Uso', 'Em Manutenção', 'Baixado'];

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
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      empresaId,
      // Esconde descartados por padrão, a menos que filtro explícito
      ...(status ? { status } : { status: { not: 'DESCARTADO' } }),
      ...(statusProcesso && { statusProcesso }),
      ...(unidadeId && { unidadeId: parseInt(unidadeId) }),
      ...(tipo && { tipo: { contains: tipo } }),
      ...(marca && { marca: { contains: marca } }),
      ...(busca && {
        OR: [
          { marca: { contains: busca } },
          { modelo: { contains: busca } },
          { serialNumber: { contains: busca } },
          { tipo: { contains: busca } },
          { patrimonio: { contains: busca } },
          { unidade: { nome: { contains: busca } } },
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

    const qrData = JSON.stringify({ id: equipamento.id, serial: serialNumber, empresa: empresaId });
    const qrCode = await QRCode.toDataURL(qrData);
    const atualizado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { qrCode },
      include: { unidade: true },
    });

    res.status(201).json(atualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { tipo, marca, modelo, serialNumber, patrimonio, status, statusProcesso, unidadeId, observacao, tecnicoId, dataEntrega, comentarioEtapa } = req.body;
    const id = parseInt(req.params.id);

    // Se mudou statusProcesso, registra no histórico de etapas
    if (statusProcesso !== undefined) {
      const atual = await prisma.equipamento.findUnique({ where: { id }, select: { statusProcesso: true, checklistPreparacao: true } });
      if (atual && atual.statusProcesso !== statusProcesso) {
        // Salva histórico da etapa no checklistPreparacao como log de etapas
        let etapasLog = [];
        try { etapasLog = atual.checklistPreparacao ? JSON.parse(atual.checklistPreparacao) : []; } catch { etapasLog = []; }
        if (!Array.isArray(etapasLog)) etapasLog = [];
        etapasLog.push({
          etapa: statusProcesso,
          de: atual.statusProcesso,
          para: statusProcesso,
          tecnicoId: req.usuario.id,
          tecnicoNome: req.usuario.nome || req.usuario.email,
          comentario: comentarioEtapa || null,
          data: new Date().toISOString(),
        });
        await prisma.equipamento.update({ where: { id }, data: { checklistPreparacao: JSON.stringify(etapasLog) } });

        // Registra no histórico geral
        await prisma.historico.create({
          data: {
            equipamentoId: id,
            usuarioId: req.usuario.id,
            acao: 'ETAPA_AVANCADA',
            descricao: `Etapa avançada: ${atual.statusProcesso} → ${statusProcesso}${comentarioEtapa ? ` | ${comentarioEtapa}` : ''}`,
          },
        });
      }
    }

    const equipamento = await prisma.equipamento.update({
      where: { id },
      data: {
        tipo, marca, modelo, serialNumber, patrimonio, status, observacao,
        ...(statusProcesso !== undefined && { statusProcesso }),
        ...(dataEntrega !== undefined && { dataEntrega: dataEntrega ? new Date(dataEntrega) : null }),
        unidadeId: unidadeId !== undefined ? (unidadeId ? parseInt(unidadeId) : null) : undefined,
        tecnicoId: tecnicoId !== undefined ? (tecnicoId ? parseInt(tecnicoId) : null) : undefined,
      },
      include: { unidade: true, tecnico: { select: { id: true, nome: true } } },
    });

    res.json(equipamento);
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
      data.statusProcesso = 'Em Uso';
      data.status = 'EM_USO';
    }

    // Se checklist de preparação: calcular progresso e atualizar statusProcesso
    if (tipo === 'preparacao' && itens) {
      const vals = Object.values(itens);
      const done = vals.filter(v => v).length;
      const total = vals.length;
      if (done === 0) data.statusProcesso = 'Novo';
      else if (done < Math.ceil(total / 2)) data.statusProcesso = 'Imagem Instalada';
      else if (done < total) data.statusProcesso = 'Softwares Instalados';
      else data.statusProcesso = 'Asset Registrado';
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

module.exports = { listar, buscarPorId, criar, atualizar, atualizarChecklist, atualizarAgendamento, deletar, qrcode };
