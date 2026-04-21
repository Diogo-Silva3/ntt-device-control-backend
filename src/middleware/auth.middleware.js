const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { empresa: true, unidade: true, projeto: true },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo' });
    }

    // SUPERADMIN pode operar em qualquer empresa via header x-empresa-id
    if (usuario.role === 'SUPERADMIN') {
      const empresaIdHeader = req.headers['x-empresa-id'];
      if (empresaIdHeader) {
        const empresaId = parseInt(empresaIdHeader);
        const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
        if (empresa) {
          const projetoIdHeader = req.headers['x-projeto-id'];
          req.usuario = {
            ...usuario,
            empresaId,
            empresa,
            empresaIdOriginal: usuario.empresaId, // preserva o id real do superadmin
            projetoIdAtivo: projetoIdHeader ? parseInt(projetoIdHeader) : null,
          };
          return next();
        }
      }
      // Sem header, usa a empresa do próprio usuário normalmente
    }

    req.usuario = usuario;

    // Captura projetoId do header x-projeto-id para uso nos controllers
    const projetoIdHeader = req.headers['x-projeto-id'];
    if (projetoIdHeader) req.usuario.projetoIdAtivo = parseInt(projetoIdHeader);

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.usuario?.role !== 'ADMIN' && req.usuario?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};

const superAdminMiddleware = (req, res, next) => {
  if (req.usuario?.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso restrito ao Super Admin' });
  }
  next();
};

const apenasAdminMiddleware = adminMiddleware;

module.exports = { authMiddleware, adminMiddleware, apenasAdminMiddleware, superAdminMiddleware };
