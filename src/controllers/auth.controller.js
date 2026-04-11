const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { enviarEmail } = require('../config/email');
const { registrarLog } = require('./auditoria.controller');

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
      registrarLog({
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        acao: 'LOGIN_FALHOU',
        detalhes: `Tentativa de login com senha incorreta para ${email}`,
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role, empresaId: usuario.empresaId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({ token, usuario: usuarioSemSenha });

    // Log de acesso (assíncrono, não bloqueia resposta)
    registrarLog({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      acao: 'LOGIN',
      detalhes: `Login realizado por ${usuario.email}`,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });
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

const esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const usuario = await prisma.usuario.findFirst({ where: { email, ativo: true } });

    // Sempre retorna sucesso para não revelar se o email existe
    if (!usuario || !usuario.senha) {
      return res.json({ message: 'Se o email estiver cadastrado, você receberá as instruções.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetToken: token, resetTokenExpira: expira },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://tech-refresh.cloud';
    const link = `${frontendUrl}/redefinir-senha?token=${token}`;

    await enviarEmail({
      para: email,
      assunto: 'Tech Refresh - Redefinição de senha',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
          <div style="text-align:center;padding:16px 0;">
            <img src="https://tech-refresh.cloud/logo-ntt.png" alt="Tech Refresh" style="height:48px;object-fit:contain;" />
          </div>
          <div style="background:#1e40af;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">Redefinição de Senha</h2>
          </div>
          <p style="color:#334155;">Olá, <strong>${usuario.nome}</strong>!</p>
          <p style="color:#475569;font-size:14px;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${link}" style="background:#1e40af;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Redefinir Senha
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
          <p style="color:#94a3b8;font-size:11px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;">
            Tech Refresh · Mensagem automática
          </p>
        </div>`,
    });

    res.json({ message: 'Se o email estiver cadastrado, você receberá as instruções.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};

const redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    if (novaSenha.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });

    const usuario = await prisma.usuario.findFirst({
      where: { resetToken: token, resetTokenExpira: { gt: new Date() }, ativo: true },
    });

    if (!usuario) return res.status(400).json({ error: 'Token inválido ou expirado' });

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: await bcrypt.hash(novaSenha, 10),
        resetToken: null,
        resetTokenExpira: null,
      },
    });

    registrarLog({
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
      acao: 'SENHA_REDEFINIDA',
      detalhes: `Senha redefinida via token para ${usuario.email}`,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};

module.exports = { login, register, me, esqueciSenha, redefinirSenha };
