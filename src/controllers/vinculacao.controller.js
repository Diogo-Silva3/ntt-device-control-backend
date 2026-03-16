const prisma = require('../config/prisma');

const includeCompleto = {
  usuario: { select: { id: true, nome: true, funcao: true, unidade: true } },
  equipamento: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true } },
  tecnico: { select: { id: true, nome: true } },
};

const listar = async (req, res) => {
  try {
    const { ativa, usuarioId, equipamentoId } = req.query;
    const empresaId = req.usuario.empresaId;

    const vinculacoes = await prisma.vinculacao.findMany({
      where: {
        ...(ativa !== undefined && { ativa: ativa === 'true' }),
        ...(usuarioId && { usuarioId: parseInt(usuarioId) }),
        ...(equipamentoId && { equipamentoId: parseInt(equipamentoId) }),
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
      return res.status(400).json({ error: 'Equipamento já está atribuído a outro usuário' });
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

    res.status(201).json(vinculacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar atribuição' });
  }
};

const encerrar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const vinculacao = await prisma.vinculacao.findUnique({
      where: { id },
      include: { usuario: true, equipamento: true },
    });
    if (!vinculacao) return res.status(404).json({ error: 'Atribuição não encontrada' });

    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: { ativa: false, dataFim: new Date() },
    });

    await prisma.equipamento.update({
      where: { id: vinculacao.equipamentoId },
      data: { status: 'DISPONIVEL' },
    });

    await prisma.historico.create({
      data: {
        equipamentoId: vinculacao.equipamentoId,
        usuarioId: vinculacao.usuarioId,
        acao: 'DESATRIBUIDO',
        descricao: `Equipamento desatribuído do usuário ${vinculacao.usuario.nome}`,
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
    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: { statusEntrega: 'ENTREGUE' },
      include: includeCompleto,
    });
    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar como entregue' });
  }
};

module.exports = { listar, criar, encerrar, reagendar, marcarNaoCompareceu, marcarEntregue };
