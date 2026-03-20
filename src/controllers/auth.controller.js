const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const DOMINIOS_PERMITIDOS = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  : ['@grupobimbo.com', '@global.nttdata.com', '@gbsupport.net', '@nttdata.com', '@pasqualisolution.com.br'];

const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const dominioValido = DOMINIOS_PERMITIDOS.some(d => email.toLowerCase().endsWith(d));
    if (!dominioValido) {
      return res.status(401).json({ error: 'Domínio de email não autorizado' });
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email, ativo: true },
      include: { empresa: true, unidade: true },
    });

    if (!usuario || !usuario.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role, empresaId: usuario.empresaId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({ token, usuario: usuarioSemSenha });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
};

const register = async (req, res) => {
  try {
    const { nome, email, senha, funcao, role, unidadeId, empresaId } = req.body;

    const existe = await prisma.usuario.findFirst({ where: { email } });
    if (existe) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, funcao, role: role || 'TECNICO', unidadeId, empresaId },
      include: { empresa: true, unidade: true },
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.status(201).json(usuarioSemSenha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

const me = async (req, res) => {
  const { senha: _, ...usuarioSemSenha } = req.usuario;
  res.json(usuarioSemSenha);
};

module.exports = { login, register, me };
