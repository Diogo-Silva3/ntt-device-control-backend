const prisma = require('../config/prisma');

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
      include: {
        usuario: { select: { id: true, nome: true, funcao: true, unidade: true } },
        equipamento: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true } },
      },
      orderBy: { dataInicio: 'desc' },
    });

    res.json(vinculacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar vinculações' });
  }
};

const criar = async (req, res) => {
  try {
    const { usuarioId, equipamentoId, observacao } = req.body;

    // Verificar se equipamento já está vinculado
    const vinculacaoAtiva = await prisma.vinculacao.findFirst({
      where: { equipamentoId: parseInt(equipamentoId), ativa: true },
    });

    if (vinculacaoAtiva) {
      return res.status(400).json({ error: 'Equipamento já está vinculado a outro usuário' });
    }

    // Criar vinculação
    const vinculacao = await prisma.vinculacao.create({
      data: {
        usuarioId: parseInt(usuarioId),
        equipamentoId: parseInt(equipamentoId),
        observacao,
      },
      include: {
        usuario: { select: { id: true, nome: true, funcao: true } },
        equipamento: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true } },
      },
    });

    // Atualizar status do equipamento
    await prisma.equipamento.update({
      where: { id: parseInt(equipamentoId) },
      data: { status: 'EM_USO' },
    });

    // Registrar no histórico
    await prisma.historico.create({
      data: {
        equipamentoId: parseInt(equipamentoId),
        usuarioId: parseInt(usuarioId),
        acao: 'VINCULADO',
        descricao: `Equipamento vinculado ao usuário ${vinculacao.usuario.nome}`,
      },
    });

    res.status(201).json(vinculacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar vinculação' });
  }
};

const encerrar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const vinculacao = await prisma.vinculacao.findUnique({
      where: { id },
      include: { usuario: true, equipamento: true },
    });

    if (!vinculacao) return res.status(404).json({ error: 'Vinculação não encontrada' });

    // Encerrar vinculação
    const atualizada = await prisma.vinculacao.update({
      where: { id },
      data: { ativa: false, dataFim: new Date() },
    });

    // Atualizar status do equipamento
    await prisma.equipamento.update({
      where: { id: vinculacao.equipamentoId },
      data: { status: 'DISPONIVEL' },
    });

    // Registrar no histórico
    await prisma.historico.create({
      data: {
        equipamentoId: vinculacao.equipamentoId,
        usuarioId: vinculacao.usuarioId,
        acao: 'DESVINCULADO',
        descricao: `Equipamento desvinculado do usuário ${vinculacao.usuario.nome}`,
        dataFim: new Date(),
      },
    });

    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao encerrar vinculação' });
  }
};

module.exports = { listar, criar, encerrar };
