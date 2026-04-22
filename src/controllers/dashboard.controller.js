const prisma = require('../config/prisma');

const getDashboard = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const unidadeIdParam = req.query.unidadeId ? parseInt(req.query.unidadeId) : null;
    const isAdmin = req.usuario.role === 'ADMIN' || req.usuario.role === 'SUPERADMIN';
    const tecnicoId = !isAdmin ? req.usuario.id : null;
    
    // Se técnico, usa projetoId do usuário. Se admin, usa do header
    let projetoId = null;
    if (!isAdmin && req.usuario.projetoId) {
      projetoId = req.usuario.projetoId;
    } else if (isAdmin && req.headers['x-projeto-id']) {
      projetoId = parseInt(req.headers['x-projeto-id']);
    }

    // Para técnicos, NÃO filtra por unidade (equipamentos podem estar em qualquer unidade)
    // Para admins, filtra pela unidade do parâmetro ou nenhuma
    const unidadeFiltro = isAdmin ? (unidadeIdParam || null) : null;

    const hoje = new Date();
    const tresDiasAtras = new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Dashboard mostra TODOS os equipamentos da empresa/projeto (não filtra por tecnicoId)
    const whereEq = {
      empresaId,
      ...(projetoId && { projetoId }),
      ...(unidadeFiltro && { unidadeId: unidadeFiltro }),
    };

    const whereUsr = {
      empresaId,
      ativo: true,
      ...(unidadeFiltro && { unidadeId: unidadeFiltro }),
    };

    const whereVinc = tecnicoId
      ? { ativa: true, tecnicoId }
      : {
          ativa: true,
          ...(projetoId && { equipamento: { projetoId } }),
          usuario: { empresaId, ...(unidadeFiltro && { unidadeId: unidadeFiltro }) },
        };

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
      porUnidadeRaw,
      porTipo,
      ultimosEquipamentos,
      colaboradoresSemEquipamento,
      atrasadosNaPreparacao,
      totalProjeto,
      maquinasAgendadas,
      maquinasEntregues,
      faltamEntregar,
    ] = await Promise.all([
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' } } }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'EM_USO' } }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'DISPONIVEL', statusProcesso: { not: 'Agendado para Entrega' } } }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'MANUTENCAO' } }),
      prisma.usuario.count({ where: whereUsr }),
      prisma.unidade.count({ where: { empresaId } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados'] } } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: 'Novo' } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: 'Softwares Instalados' } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: 'Agendado para Entrega' } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] } } }),
      prisma.equipamento.groupBy({
        by: ['marca'],
        where: { ...whereEq, marca: { not: null }, status: { not: 'DESCARTADO' } },
        _count: { marca: true },
        orderBy: { _count: { marca: 'desc' } },
        take: 8,
      }),
      prisma.equipamento.groupBy({
        by: ['unidadeId'],
        where: { ...whereEq, status: { not: 'DESCARTADO' }, unidadeId: { not: null } },
        _count: { unidadeId: true },
        orderBy: { _count: { unidadeId: 'desc' } },
        take: 10,
      }),
      prisma.equipamento.groupBy({
        by: ['tipo'],
        where: { ...whereEq, tipo: { not: null }, status: { not: 'DESCARTADO' } },
        _count: { tipo: true },
        orderBy: { _count: { tipo: 'desc' } },
        take: 8,
      }),
      prisma.equipamento.findMany({
        where: { ...whereEq, status: { not: 'DESCARTADO' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { unidade: true },
      }),
      prisma.usuario.count({
        where: { ...whereUsr, vinculacoes: { none: { ativa: true } } },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega'] },
          updatedAt: { lt: tresDiasAtras },
        },
      }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' } } }),
      prisma.equipamento.count({
        where: { 
          ...whereEq,
          status: { not: 'DESCARTADO' }, 
          statusProcesso: 'Agendado para Entrega'
        },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: { not: 'DESCARTADO' },
          statusProcesso: 'Softwares Instalados'
        },
      }),
    ]);

    const maquinasFaltamEntregar = disponiveis; // Usar disponiveis (Softwares Instalados) em vez de totalProjeto - maquinasEntregues

    // Busca nomes das unidades para porUnidade
    const unidadeIds = porUnidadeRaw.map(u => u.unidadeId).filter(Boolean);
    const unidadesNomes = unidadeIds.length > 0
      ? await prisma.unidade.findMany({ where: { id: { in: unidadeIds } }, select: { id: true, nome: true } })
      : [];
    const unidadeNomeMap = Object.fromEntries(unidadesNomes.map(u => [u.id, u.nome]));

    const porUnidade = porUnidadeRaw
      .map(u => ({ unidade: unidadeNomeMap[u.unidadeId] || 'Sem unidade', equipamentos: u._count.unidadeId }))
      .sort((a, b) => b.equipamentos - a.equipamentos);

    // Entregas por mês (últimos 6 meses)
    const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    const entregasPorMesRaw = await prisma.vinculacao.findMany({
      where: {
        statusEntrega: 'ENTREGUE',
        createdAt: { gte: seisMesesAtras },
        ...(projetoId && { equipamento: { projetoId } }),
        usuario: { empresaId, ...(unidadeFiltro && { unidadeId: unidadeFiltro }) },
      },
      select: { createdAt: true },
    });

    const mesesMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      mesesMap[key] = { mes: label, entregas: 0 };
    }
    entregasPorMesRaw.forEach(e => {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (mesesMap[key]) mesesMap[key].entregas++;
    });

    const atividadesRecentes = await prisma.vinculacao.findMany({
      where: {
        ...(projetoId && { equipamento: { projetoId } }),
        usuario: { empresaId, ...(unidadeFiltro && { unidadeId: unidadeFiltro }) },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { marca: true, modelo: true, serialNumber: true } },
      },
    });

    const unidades = await prisma.unidade.findMany({
      where: { empresaId },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    res.json({
      _timestamp: Date.now(), // Força atualização do cache
      resumo: { totalEquipamentos, emUso, disponiveis, manutencao, totalUsuarios, totalUnidades },
      processo: { emPreparacao, aguardandoImagem, comImagem: emPreparacao, agendados, entregues },
      alertas: { atrasadosNaPreparacao, colaboradoresSemEquipamento },
      techRefresh: { 
        totalProjeto, 
        maquinasAgendadas: maquinasAgendadas,
        maquinasEntregues: maquinasEntregues, 
        maquinasFaltamEntregar,
        totalAtribuido: maquinasEntregues,
      },
      porMarca: porMarca.map(m => ({ marca: m.marca || 'Sem marca', total: m._count.marca })),
      porUnidade,
      porTipo: porTipo.map(t => ({ tipo: t.tipo || 'Sem tipo', total: t._count.tipo })),
      ultimosEquipamentos,
      entregasPorMes: Object.values(mesesMap),
      atividadesRecentes,
      unidades,
      unidadeFiltroAtivo: unidadeFiltro,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

const dashboardTecnicos = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const { mes } = req.query;
    let dataInicio, dataFim;
    if (mes) {
      if (!/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
      const [ano, m] = mes.split('-').map(Number);
      dataInicio = new Date(ano, m - 1, 1);
      dataFim = new Date(ano, m, 0, 23, 59, 59);
    } else {
      const agora = new Date();
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
    }
    const inicio6m = new Date(dataInicio);
    inicio6m.setMonth(inicio6m.getMonth() - 5);

    const tecnicos = await prisma.usuario.findMany({
      where: { empresaId, ativo: true, senha: { not: null }, role: { in: ['TECNICO', 'ADMIN'] } },
      select: { id: true, nome: true },
    });

    const resultado = await Promise.all(tecnicos.map(async tec => {
      const [totalMes, total6m] = await Promise.all([
        prisma.vinculacao.count({ where: { tecnicoId: tec.id, statusEntrega: 'ENTREGUE', dataFim: { gte: dataInicio, lte: dataFim } } }),
        prisma.vinculacao.count({ where: { tecnicoId: tec.id, statusEntrega: 'ENTREGUE', dataFim: { gte: inicio6m, lte: dataFim } } }),
      ]);
      return { ...tec, totalMesAtual: totalMes, total6Meses: total6m, mediaMensal: Math.round(total6m / 6 * 10) / 10 };
    }));

    resultado.sort((a, b) => b.totalMesAtual - a.totalMesAtual);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dashboard de técnicos' });
  }
};

module.exports = { getDashboard, dashboardTecnicos };
