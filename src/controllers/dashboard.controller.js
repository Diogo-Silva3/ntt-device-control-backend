const prisma = require('../config/prisma');

const getDashboard = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const hoje = new Date();
    const tresDiasAtras = new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [
      totalEquipamentos,
      emUso,
      disponiveis,
      manutencao,
      totalUsuarios,
      totalUnidades,
      emPreparacao,
      aguardandoImagem,
      aguardandoSoftware,
      agendados,
      entregues,
      porMarca,
      porUnidade,
      porTipo,
      ultimosEquipamentos,
      colaboradoresSemEquipamento,
      atrasadosNaPreparacao,
    ] = await Promise.all([
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' } } }),
      prisma.equipamento.count({ where: { empresaId, status: 'EM_USO' } }),
      prisma.equipamento.count({ where: { empresaId, status: 'DISPONIVEL' } }),
      prisma.equipamento.count({ where: { empresaId, status: 'MANUTENCAO' } }),
      prisma.usuario.count({ where: { empresaId, ativo: true } }),
      prisma.unidade.count({ where: { empresaId } }),
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' }, statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados', 'Asset Registrado'] } } }),
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' }, statusProcesso: 'Novo' } }),
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' }, statusProcesso: 'Softwares Instalados' } }),
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' }, statusProcesso: 'Agendado para Entrega' } }),
      prisma.equipamento.count({ where: { empresaId, status: { not: 'DESCARTADO' }, statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] } } }),
      prisma.equipamento.groupBy({
        by: ['marca'],
        where: { empresaId, marca: { not: null }, status: { not: 'DESCARTADO' } },
        _count: { marca: true },
        orderBy: { _count: { marca: 'desc' } },
        take: 8,
      }),
      prisma.unidade.findMany({
        where: { empresaId },
        include: { _count: { select: { equipamentos: true, usuarios: true } } },
        orderBy: { nome: 'asc' },
      }),
      prisma.equipamento.groupBy({
        by: ['tipo'],
        where: { empresaId, tipo: { not: null }, status: { not: 'DESCARTADO' } },
        _count: { tipo: true },
        orderBy: { _count: { tipo: 'desc' } },
        take: 8,
      }),
      prisma.equipamento.findMany({
        where: { empresaId, status: { not: 'DESCARTADO' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { unidade: true },
      }),
      // Colaboradores sem equipamento ativo
      prisma.usuario.count({
        where: {
          empresaId,
          ativo: true,
          vinculacoes: { none: { ativa: true } },
        },
      }),
      // Equipamentos em preparação há mais de 3 dias
      prisma.equipamento.count({
        where: {
          empresaId,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega'] },
          updatedAt: { lt: tresDiasAtras },
        },
      }),
    ]);

    // Entregas por mês (últimos 6 meses)
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const entregasPorMesRaw = await prisma.equipamento.findMany({
      where: {
        empresaId,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        updatedAt: { gte: seisMesesAtras },
      },
      select: { updatedAt: true },
    });

    const mesesMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      mesesMap[key] = { mes: label, entregas: 0 };
    }
    entregasPorMesRaw.forEach(e => {
      const d = new Date(e.updatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (mesesMap[key]) mesesMap[key].entregas++;
    });

    // Atividades recentes (últimas vinculações)
    const atividadesRecentes = await prisma.vinculacao.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { marca: true, modelo: true, serialNumber: true } },
      },
    });

    res.json({
      resumo: { totalEquipamentos, emUso, disponiveis, manutencao, totalUsuarios, totalUnidades },
      processo: { emPreparacao, aguardandoImagem, aguardandoSoftware, agendados, entregues },
      alertas: { atrasadosNaPreparacao, colaboradoresSemEquipamento },
      porMarca: porMarca.map(m => ({ marca: m.marca || 'Sem marca', total: m._count.marca })),
      porUnidade: porUnidade.map(u => ({ unidade: u.nome, equipamentos: u._count.equipamentos, usuarios: u._count.usuarios })),
      porTipo: porTipo.map(t => ({ tipo: t.tipo || 'Sem tipo', total: t._count.tipo })),
      ultimosEquipamentos,
      entregasPorMes: Object.values(mesesMap),
      atividadesRecentes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

module.exports = { getDashboard };
