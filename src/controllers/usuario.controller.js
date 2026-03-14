const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const listar = async (req, res) => {
  try {
    const { busca, unidadeId, page = 1, limit = 50, comAcesso, semAcesso } = req.query;
    const empresaId = req.usuario.empresaId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      empresaId,
      ativo: true,
      ...(unidadeId && { unidadeId: parseInt(unidadeId) }),
      // comAcesso = usuários do sistema (tem senha definida ou role ADMIN)
      ...(comAcesso === 'true' && { senha: { not: null } }),
      // semAcesso = colaboradores importados (sem senha)
      ...(semAcesso === 'true' && { senha: null }),
      ...(busca && {
        OR: [
          { nome: { contains: busca } },
          { email: { contains: busca } },
          { funcao: { contains: busca } },
        ],
      }),
    };

    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        include: { unidade: true },
        orderBy: { nome: 'asc' },
        skip,
        take: parseInt(limit),
      }),
    ]);

    const usuariosSemSenha = usuarios.map(({ senha, ...u }) => u);
    res.json({ data: usuariosSemSenha, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: parseInt(req.params.id), empresaId: req.usuario.empresaId },
      include: {
        unidade: true,
        vinculacoes: {
          where: { ativa: true },
          include: { equipamento: true },
        },
      },
    });

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, email, funcao, role, unidadeId, senha } = req.body;
    const empresaId = req.usuario.empresaId;

    const data = { nome, email, funcao, role: role || 'TECNICO', empresaId };
    if (unidadeId) data.unidadeId = parseInt(unidadeId);
    if (senha) data.senha = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({ data, include: { unidade: true } });
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(201).json(usuarioSemSenha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, email, funcao, role, unidadeId, ativo, senha } = req.body;
    const data = { nome, email, funcao, role, ativo };
    if (unidadeId !== undefined) data.unidadeId = unidadeId ? parseInt(unidadeId) : null;
    if (senha) data.senha = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { unidade: true },
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

const deletar = async (req, res) => {
  try {
    await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data: { ativo: false },
    });
    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };
