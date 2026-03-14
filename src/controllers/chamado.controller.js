const prisma = require('../config/prisma');

const listar = async (req, res) => {
  try {
    const { status, equipamentoId } = req.query;
    const chamados = await prisma.chamado.findMany({
      where: {
        ...(status && { status }),
        ...(equipamentoId && { equipamentoId: parseInt(equipamentoId) }),
      },
      include: {
        equipamento: { select: { id: true, marca: true, modelo: true, serialNumber: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(chamados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar chamados' });
  }
};

const criar = async (req, res) => {
  try {
    const { titulo, descricao, prioridade, equipamentoId, usuarioId } = req.body;
    const chamado = await prisma.chamado.create({
      data: {
        titulo, descricao, prioridade: prioridade || 'MEDIA',
        equipamentoId: equipamentoId ? parseInt(equipamentoId) : null,
        usuarioId: usuarioId ? parseInt(usuarioId) : null,
      },
      include: {
        equipamento: { select: { id: true, marca: true, modelo: true } },
        usuario: { select: { id: true, nome: true } },
      },
    });
    res.status(201).json(chamado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar chamado' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { status, descricao } = req.body;
    const chamado = await prisma.chamado.update({
      where: { id: parseInt(req.params.id) },
      data: { status, descricao },
    });
    res.json(chamado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar chamado' });
  }
};

module.exports = { listar, criar, atualizar };
