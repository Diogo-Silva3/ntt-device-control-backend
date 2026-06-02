const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function debug() {
  try {
    console.log('🔍 Debugando resposta do dashboard...\n');

    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 4; // TECH REFRESH CELULARES 2026

    const whereEq = {
      empresaId,
      projetoId
    };

    // Simular exatamente o que o dashboard faz
    const TECH_REFRESH_CELULARES_2026_ID = 4;
    const isCelularesProject = projetoId === TECH_REFRESH_CELULARES_2026_ID;

    console.log(`isCelularesProject: ${isCelularesProject}\n`);

    // Executar as mesmas queries do dashboard
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
      todosDisponiveis,
    ] = await Promise.all([
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' } } }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'EM_USO' } }),
      isCelularesProject
        ? prisma.equipamento.count({ where: { ...whereEq, status: 'DISPONIVEL', statusProcesso: { not: 'Agendado para Entrega' } } })
        : prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: { not: { in: ['Entregue ao Usuário', 'Em Uso'] } } } }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'MANUTENCAO' } }),
      prisma.usuario.count({ where: { empresaId, ativo: true } }),
      prisma.unidade.count({ where: { empresaId } }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' }, statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados', 'Asset Registrado'] } } }),
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
        where: { empresaId, ativo: true, vinculacoes: { none: { ativa: true } } },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega'] },
          updatedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.equipamento.count({ where: { ...whereEq, status: { not: 'DESCARTADO' } } }),
      prisma.vinculacao.count({
        where: {
          equipamento: { projetoId },
          statusEntrega: 'PENDENTE',
        },
      }),
      prisma.vinculacao.count({
        where: {
          equipamento: { projetoId },
          statusEntrega: 'ENTREGUE',
        },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: 'DISPONIVEL'
        },
      }),
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: 'DISPONIVEL'
        },
      }),
    ]);

    console.log('📊 VARIÁVEIS CALCULADAS:\n');
    console.log(`totalEquipamentos: ${totalEquipamentos}`);
    console.log(`emUso: ${emUso}`);
    console.log(`disponiveis: ${disponiveis}`);
    console.log(`manutencao: ${manutencao}`);
    console.log(`emPreparacao: ${emPreparacao}`);
    console.log(`agendados: ${agendados}`);
    console.log(`entregues: ${entregues}`);
    console.log(`totalProjeto: ${totalProjeto}`);
    console.log(`maquinasAgendadas: ${maquinasAgendadas}`);
    console.log(`maquinasEntregues: ${maquinasEntregues}`);
    console.log(`faltamEntregar: ${faltamEntregar}`);
    console.log(`todosDisponiveis: ${todosDisponiveis}\n`);

    // Calcular maquinasFaltamEntregar
    const maquinasFaltamEntregar = isCelularesProject
      ? todosDisponiveis
      : (totalProjeto - maquinasEntregues);

    console.log(`📊 CÁLCULO DE maquinasFaltamEntregar:\n`);
    console.log(`isCelularesProject: ${isCelularesProject}`);
    console.log(`todosDisponiveis: ${todosDisponiveis}`);
    console.log(`maquinasFaltamEntregar: ${maquinasFaltamEntregar}\n`);

    console.log('📊 RESPOSTA DO DASHBOARD:\n');
    console.log(`techRefresh: {`);
    console.log(`  totalProjeto: ${totalProjeto},`);
    console.log(`  maquinasAgendadas: ${isCelularesProject ? todosDisponiveis : maquinasAgendadas},`);
    console.log(`  maquinasEntregues: ${entregues},`);
    console.log(`  maquinasFaltamEntregar: ${maquinasFaltamEntregar},`);
    console.log(`  totalAtribuido: ${entregues}`);
    console.log(`}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debug();
