require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO RESPOSTA REAL DO DASHBOARD ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const empresaId = 1;
    const projetoId = projeto.id;

    // Simular exatamente o que o dashboard faz
    const whereEq = {
      empresaId,
      projetoId,
    };

    const [
      totalProjeto,
      maquinasAgendadas,
      maquinasEntregues,
      totalAtribuido,
      disponiveis,
    ] = await Promise.all([
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
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { 
            projetoId,
            empresaId,
          },
        },
      }),
      prisma.equipamento.count({ where: { ...whereEq, status: 'DISPONIVEL' } }),
    ]);

    const maquinasFaltamEntregar = disponiveis;

    console.log('📊 RESPOSTA DO DASHBOARD (techRefresh):');
    console.log(`   totalProjeto: ${totalProjeto}`);
    console.log(`   maquinasAgendadas: ${maquinasAgendadas}`);
    console.log(`   maquinasEntregues: ${maquinasEntregues}`);
    console.log(`   maquinasFaltamEntregar: ${maquinasFaltamEntregar}`);
    console.log(`   totalAtribuido: ${totalAtribuido}`);
    console.log(`   _debug: { totalAtribuido: ${totalAtribuido}, maquinasEntregues: ${maquinasEntregues} }\n`);

    // Verificar se há vinculações ativas que não são ENTREGUE
    const vinculacoesAtivas = await prisma.vinculacao.count({
      where: {
        ativa: true,
        equipamento: { projetoId },
      },
    });

    const vinculacoesEntregue = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId },
      },
    });

    const vinculacoesPendente = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: { projetoId },
      },
    });

    console.log('📋 VINCULAÇÕES ATIVAS:');
    console.log(`   Total ativas: ${vinculacoesAtivas}`);
    console.log(`   ENTREGUE: ${vinculacoesEntregue}`);
    console.log(`   PENDENTE: ${vinculacoesPendente}\n`);

    // Listar todas as vinculações ativas
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            status: true,
          },
        },
        usuario: {
          select: {
            nome: true,
            role: true,
          },
        },
      },
      orderBy: { statusEntrega: 'asc' },
    });

    console.log('📋 TODAS AS VINCULAÇÕES ATIVAS:');
    todasVinculacoes.forEach((v, idx) => {
      console.log(`${idx + 1}. ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
      console.log(`   Status Entrega: ${v.statusEntrega}`);
      console.log(`   Status Equipamento: ${v.equipamento.status}`);
      console.log(`   Role: ${v.usuario.role}\n`);
    });

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
