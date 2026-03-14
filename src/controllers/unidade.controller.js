const prisma = require('../config/prisma');

const listar = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const unidades = await prisma.unidade.findMany({
      where: { empresaId },
      include: {
        _count: { select: { usuarios: true, equipamentos: true } },
      },
      orderBy: { nome: 'asc' },
    });
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar unidades' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const unidade = await prisma.unidade.findFirst({
      where: { id: parseInt(req.params.id), empresaId: req.usuario.empresaId },
      include: {
        usuarios: { select: { id: true, nome: true, funcao: true, email: true } },
        equipamentos: { select: { id: true, tipo: true, marca: true, modelo: true, status: true } },
      },
    });
    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    res.json(unidade);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar unidade' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, cidade, estado } = req.body;
    const empresaId = req.usuario.empresaId;

    const unidade = await prisma.unidade.create({
      data: { nome, cidade, estado, empresaId },
    });
    res.status(201).json(unidade);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Unidade com esse nome já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar unidade' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, cidade, estado } = req.body;
    const unidade = await prisma.unidade.update({
      where: { id: parseInt(req.params.id) },
      data: { nome, cidade, estado },
    });
    res.json(unidade);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar unidade' });
  }
};

const deletar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const count = await prisma.usuario.count({ where: { unidadeId: id } });
    if (count > 0) {
      return res.status(400).json({ error: 'Unidade possui usuários vinculados' });
    }
    await prisma.unidade.delete({ where: { id } });
    res.json({ message: 'Unidade removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar unidade' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };
