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
    const empresaId = req.usuario.empresaId;
    const { page = 1, limit = 50, acao, usuarioId } = req.query;
    const pageNum = parseInt(page);
    const take = Math.min(parseInt(limit) || 50, 200);
    const skip = (pageNum - 1) * take;

    const where = {
      empresaId,
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
        include: {
          // Não temos relação direta, buscamos o nome manualmente abaixo
        },
      }),
    ]);

    // Enriquece com nome do usuário
    const usuarioIds = [...new Set(logs.map(l => l.usuarioId).filter(Boolean))];
    const usuarios = usuarioIds.length > 0
      ? await prisma.usuario.findMany({ where: { id: { in: usuarioIds } }, select: { id: true, nome: true } })
      : [];
    const usuarioMap = Object.fromEntries(usuarios.map(u => [u.id, u.nome]));

    const logsEnriquecidos = logs.map(l => ({
      ...l,
      usuarioNome: l.usuarioId ? (usuarioMap[l.usuarioId] || 'Desconhecido') : 'Sistema',
    }));

    res.json({ data: logsEnriquecidos, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar logs de auditoria' });
  }
};

module.exports = { registrarLog, listar };
