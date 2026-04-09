const prisma = require('../config/prisma');
const { enviarEmail, templateAgendamento, templateReagendamento, templateEntregue, templateLembrete } = require('../config/email');

const includeCompleto = {
  usuario: { select: { id: true, nome: true, funcao: true, unidade: true } },
  equipamento: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true } },
  tecnico: { select: { id: true, nome: true } },
};

const listar = async (req, res) => {
  try {
    const { ativa, usuarioId, equipamentoId, statusEntrega } = req.query;
    const empresaId = req.usuario.empresaId;
    const projetoId = req.headers['x-projeto-id'] ? parseInt(req.headers['x-projeto-id']) : null;

    const vinculacoes = await prisma.vinculacao.findMany({
      where: {
        ...(ativa !== undefined && { ativa: ativa === 'true' }),
        ...(usuarioId && { usuarioId: parseInt(usuarioId) }),
        ...(equipamentoId && { equipamentoId: parseInt(equipamentoId) }),
        ...(statusEntrega && { statusEntrega }),
        ...(projetoId && { equipamento: { projetoId } }),
        usuario: { empresaId },
      },
      include: includeCompleto,
      orderBy: { dataInicio: 'desc' },
    });

    res.json(vinculacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar atribuições' });
  }
};

const criar = async (req, res) => {
  try {
    const {
      usuarioId, equipamentoId, observacao,
      numeroChamado, tecnicoId, tipoOperacao,
      softwaresDe, softwaresPara, dataAgendamento,
    } = req.body;

    if (!tecnicoId) {
      return res.status(400).json({ error: 'Técnico responsável é obrigatório' });
    }

    const atribuicaoAtiva = await prisma.vinculacao.findFirst({
      where: { equipamentoId: parseInt(equipamentoId), ativa: true },
    });
    if (atribuicaoAtiva) {
      return res.status(400).json({ error: 'Equipamento já está atribuído a outro colaborador' });
    }

    const vinculacao = await prisma.vinculacao.create({
      data: {
        usuarioId: parseInt(usuarioId),
        equipamentoId: parseInt(equipamentoId),
        tecnicoId: parseInt(tecnicoId),
        observacao,
        numeroChamado,
        tipoOperacao: tipoOperacao || 'Máquina nova e usuário novo',
        softwaresDe,
        softwaresPara,
        dataAgendamento: dataAgendamento ? new Date(dataAgendamento) : null,
        statusEntrega: 'PENDENTE',
      },
      include: includeCompleto,
    });

    await prisma.equipamento.update({
      where: { id: parseInt(equipamentoId) },
      data: { status: 'EM_USO' },
    });

    await prisma.historico.create({
      data: {
        equipamentoId: parseInt(equipamentoId),
        usuarioId: parseInt(usuarioId),
        acao: 'ATRIBUIDO',
        descricao: `Equipamento atribuído ao usuário ${vinculacao.usuario.nome}. Tipo: ${tipoOperacao || 'Máquina nova / Usuário novo'}. Técnico: ${vinculacao.tecnico?.nome || ''}`,
      },
    });

    // Envia e-mail de confirmação se colaborador tiver e-mail e houver data agendada
    if (vinculacao.usuario?.email && dataAgendamento) {
      const eq = vinculacao.equipamento;
      const dataFormatada = new Date(dataAgendamento).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      enviarEmail({
        para: vinculacao.usuario.email,
        assunto: 'Tech Refresh - Entrega de equipamento agendada',
        html: templateAgendamento({
          colaborador: vinculacao.usuario.nome,
          equipamento: `${eq?.marca || ''} ${eq?.modelo || ''}`.trim() || 'Equipamento',
          data: dataFormatada,
          tecnico: vinculacao.tecnico?.nome,
        }),
      }).catch(err => console.error('[EMAIL] Erro ao enviar:', err.message));
    }

    res.status(201).json(vinculacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar atribuição' });
  }
};

const encerrar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { observacao, checklistDevolucao } = req.body;

    if (!checklistDevolucao) {
      return res.status(400).json({ error: 'Checklist de devolução é obrigatório para encerrar a atribuição' });
    }

    const vinculacao = await prisma.vinculacao.findUnique({
      where: { id },
      include: { usuario: true, equipamento: true },
    });
    if (!vinculacao) return res.status(404).json({ error: 'Atribuição não encontrada' });

    const checklistStr = typeof checklistDevolucao === 'string'
      ? checklistDevolucao
      : JSON.stringify(checklistDevolucao);

    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: {
        ativa: false,
        dataFim: new Date(),
        checklistDevolucao: checklistStr,
        ...(observacao && { observacao }),
        ...(vinculacao.statusEntrega === 'PENDENTE' && { statusEntrega: 'ENTREGUE' }),
      },
    });

    await prisma.equipamento.update({
      where: { id: vinculacao.equipamentoId },
      data: { status: 'DISPONIVEL' },
    });

    const checklist = typeof checklistDevolucao === 'string'
      ? JSON.parse(checklistDevolucao)
      : checklistDevolucao;

    const temProblema = checklist.estadoFisico === 'com_danos_visiveis' || checklist.funcionamento === 'com_problemas';
    const acaoHistorico = temProblema ? 'DEVOLUCAO_COM_PROBLEMA' : 'DEVOLUCAO_OK';

    await prisma.historico.create({
      data: {
        equipamentoId: vinculacao.equipamentoId,
        usuarioId: vinculacao.usuarioId,
        acao: acaoHistorico,
        descricao: `Equipamento devolvido pelo usuário ${vinculacao.usuario.nome}${observacao ? `. Obs: ${observacao}` : ''}. Estado: ${checklist.estadoFisico || '—'}. Funcionamento: ${checklist.funcionamento || '—'}`,
        dataFim: new Date(),
      },
    });

    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao encerrar atribuição' });
  }
};

const reagendar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { dataAgendamento, motivo } = req.body;

    if (!dataAgendamento) {
      return res.status(400).json({ error: 'Nova data de agendamento é obrigatória' });
    }

    const vinculacao = await prisma.vinculacao.findUnique({ where: { id } });
    if (!vinculacao) return res.status(404).json({ error: 'Atribuição não encontrada' });

    // Registrar histórico de reagendamento
    const reagendamentosAnteriores = vinculacao.reagendamentos
      ? JSON.parse(vinculacao.reagendamentos)
      : [];

    reagendamentosAnteriores.push({
      dataAnterior: vinculacao.dataAgendamento,
      novaData: dataAgendamento,
      motivo: motivo || '',
      registradoEm: new Date().toISOString(),
    });

    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: {
        dataAgendamento: new Date(dataAgendamento),
        reagendamentos: JSON.stringify(reagendamentosAnteriores),
      },
      include: includeCompleto,
    });

    // Envia e-mail de reagendamento se colaborador tiver e-mail
    if (atualizada.usuario?.email) {
      const eq = atualizada.equipamento;
      const novaDataFormatada = new Date(dataAgendamento).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      enviarEmail({
        para: atualizada.usuario.email,
        assunto: 'Tech Refresh - Entrega reagendada',
        html: templateReagendamento({
          colaborador: atualizada.usuario.nome,
          equipamento: `${eq?.marca || ''} ${eq?.modelo || ''}`.trim() || 'Equipamento',
          novaData: novaDataFormatada,
          motivo,
          tecnico: atualizada.tecnico?.nome,
        }),
      }).catch(err => console.error('[EMAIL] Erro ao enviar:', err.message));
    }

    res.json(atualizada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao reagendar' });
  }
};

const marcarNaoCompareceu = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: { statusEntrega: 'NAO_COMPARECEU' },
      include: includeCompleto,
    });
    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};

const marcarEntregue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { assinatura } = req.body;
    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: {
        statusEntrega: 'ENTREGUE',
        dataFim: new Date(),
        ...(assinatura && { assinatura }),
      },
      include: includeCompleto,
    });

    // Email de confirmação de entrega
    if (atualizada.usuario?.email) {
      const eq = atualizada.equipamento;
      enviarEmail({
        para: atualizada.usuario.email,
        assunto: 'Tech Refresh - Equipamento entregue',
        html: templateEntregue({
          colaborador: atualizada.usuario.nome,
          equipamento: `${eq?.marca || ''} ${eq?.modelo || ''}`.trim() || 'Equipamento',
          tecnico: atualizada.tecnico?.nome,
        }),
      }).catch(err => console.error('[EMAIL] Erro ao enviar:', err.message));
    }

    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar como entregue' });
  }
};

const atualizarTecnico = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { tecnicoId } = req.body;
    if (!tecnicoId) return res.status(400).json({ error: 'Técnico é obrigatório' });
    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: { tecnicoId: parseInt(tecnicoId) },
      include: includeCompleto,
    });
    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar técnico' });
  }
};

const transferir = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { usuarioDestinoId } = req.body;

    if (!usuarioDestinoId) return res.status(400).json({ error: 'Colaborador de destino é obrigatório' });

    // Busca atribuição ativa
    const vinculacaoAtiva = await prisma.vinculacao.findFirst({
      where: { id, ativa: true },
      include: { usuario: true, equipamento: true, tecnico: true },
    });
    if (!vinculacaoAtiva) return res.status(400).json({ error: 'Equipamento não possui atribuição ativa para transferir' });

    // Valida colaborador de destino
    const destino = await prisma.usuario.findFirst({ where: { id: parseInt(usuarioDestinoId), ativo: true } });
    if (!destino) return res.status(400).json({ error: 'Colaborador de destino não encontrado ou inativo' });

    // Verifica se destino já tem equipamento
    const atribuicaoDestino = await prisma.vinculacao.findFirst({ where: { usuarioId: destino.id, ativa: true } });
    if (atribuicaoDestino) return res.status(400).json({ error: 'Colaborador de destino já possui equipamento atribuído' });

    const novaVinculacao = await prisma.$transaction(async (tx) => {
      // Encerra atribuição atual
      await tx.vinculacao.update({ where: { id }, data: { ativa: false, dataFim: new Date() } });

      // Cria nova atribuição
      const nova = await tx.vinculacao.create({
        data: {
          usuarioId: destino.id,
          equipamentoId: vinculacaoAtiva.equipamentoId,
          tecnicoId: req.usuario.id,
          tipoOperacao: vinculacaoAtiva.tipoOperacao,
          statusEntrega: 'PENDENTE',
        },
        include: includeCompleto,
      });

      // Registra histórico
      await tx.historico.create({
        data: {
          equipamentoId: vinculacaoAtiva.equipamentoId,
          usuarioId: req.usuario.id,
          acao: 'TRANSFERIDO',
          descricao: `Equipamento transferido de ${vinculacaoAtiva.usuario.nome} para ${destino.nome}. Técnico: ${req.usuario.nome || req.usuario.email}`,
        },
      });

      return nova;
    });

    res.json(novaVinculacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar transferência' });
  }
};

module.exports = { listar, criar, encerrar, reagendar, marcarNaoCompareceu, marcarEntregue, atualizarTecnico, transferir };
