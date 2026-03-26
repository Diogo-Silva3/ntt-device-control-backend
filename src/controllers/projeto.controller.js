const prisma = require('../config/prisma');

const listar = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const projetos = await prisma.projeto.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { equipamentos: true, usuarios: true, vinculacoes: true } },
      },
    });
    res.json(projetos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, descricao, dataInicio, dataFim } = req.body;
    const empresaId = req.usuario.empresaId;
    if (!nome) return res.status(400).json({ error: 'Nome do projeto é obrigatório' });

    const projeto = await prisma.projeto.create({
      data: {
        nome: nome?.toUpperCase(), descricao,
        empresaId,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        ativo: true,
      },
    });
    res.status(201).json(projeto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar projeto' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, descricao, dataInicio, dataFim, ativo } = req.body;
    const id = parseInt(req.params.id);
    const projeto = await prisma.projeto.update({
      where: { id },
      data: {
        nome: nome?.toUpperCase(), descricao,
        ...(ativo !== undefined && { ativo }),
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
      },
    });
    res.json(projeto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar projeto' });
  }
};

module.exports = { listar, criar, atualizar };
