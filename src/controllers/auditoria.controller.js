const prisma = require('../config/prisma');

// Registra uma ação no log (uso interno)
const registrarLog = async ({ usuarioId, empresaId, acao, detalhes, ip, userAgent }) => {
  try {
    await prisma.logAcesso.create({
      data: {
        usuarioId: usuarioId || null,
        empresaId: empresaId || null,
        acao,
        detalhes: detalhes || null,
        ip: ip || null,
        userAgent: userAgent ? userAgent.substring(0, 255) : null,
      },
    });
  } catch (err) {
    // Nunca deixa o log quebrar a requisição principal
    console.error('[AUDITORIA] Erro ao registrar log:', err.message);
  }
};

// GET /api/auditoria — lista logs (admin only)
const listar = async (req, res) => {
  try {
    const isSuperAdmin = req.usuario.role === 'SUPERADMIN';
    const { page = 1, limit = 50, acao, usuarioId, empresaId: empresaIdQuery } = req.query;
    const pageNum = parseInt(page);
    const take = Math.min(parseInt(limit) || 50, 200);
    const skip = (pageNum - 1) * take;

    // SUPERADMIN sem filtro de empresa vê tudo; com filtro, filtra pelo escolhido
    // ADMIN/TECNICO só vê a própria empresa
    let empresaFiltro;
    if (isSuperAdmin) {
      empresaFiltro = empresaIdQuery ? parseInt(empresaIdQuery) : undefined;
    } else {
      empresaFiltro = req.usuario.empresaId;
    }

    const where = {
      ...(empresaFiltro !== undefined && { empresaId: empresaFiltro }),
      ...(acao && { acao: { contains: acao } }),
      ...(usuarioId && { usuarioId: parseInt(usuarioId) }),
    };

    const [total, logs] = await Promise.all([
      prisma.logAcesso.count({ where }),
      prisma.logAcesso.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    // Enriquece com nome do usuário
    const usuarioIds = [...new Set(logs.map(l => l.usuarioId).filter(Boolean))];
    const usuarios = usuarioIds.length > 0
      ? await prisma.usuario.findMany({ where: { id: { in: usuarioIds } }, select: { id: true, nome: true, empresaId: true } })
      : [];
    const usuarioMap = Object.fromEntries(usuarios.map(u => [u.id, u.nome]));

    // Se SUPERADMIN, enriquece também com nome da empresa
    let empresaMap = {};
    if (isSuperAdmin) {
      const empresaIds = [...new Set(logs.map(l => l.empresaId).filter(Boolean))];
      if (empresaIds.length > 0) {
        const empresas = await prisma.empresa.findMany({ where: { id: { in: empresaIds } }, select: { id: true, nome: true } });
        empresaMap = Object.fromEntries(empresas.map(e => [e.id, e.nome]));
      }
    }

    const logsEnriquecidos = logs.map(l => ({
      ...l,
      usuarioNome: l.usuarioId ? (usuarioMap[l.usuarioId] || 'Desconhecido') : 'Sistema',
      ...(isSuperAdmin && { empresaNome: l.empresaId ? (empresaMap[l.empresaId] || `Empresa #${l.empresaId}`) : '—' }),
    }));

    res.json({ data: logsEnriquecidos, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
  }
};

module.exports = { registrarLog, listar };
