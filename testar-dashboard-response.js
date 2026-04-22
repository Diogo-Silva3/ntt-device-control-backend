require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testar() {
  try {
    console.log('=== SIMULANDO RESPOSTA DO DASHBOARD ===\n');

    const empresaId = 1;
    const projetoId = 1;

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

    const techRefresh = { 
      totalProjeto, 
      maquinasAgendadas,
      maquinasEntregues, 
      maquinasFaltamEntregar,
      totalAtribuido,
      _debug: { totalAtribuido, maquinasEntregues },
    };

    console.log('📊 RESPOSTA techRefresh:');
    console.log(JSON.stringify(techRefresh, null, 2));

    console.log('\n📋 VALORES INDIVIDUAIS:');
    console.log(`   totalProjeto: ${totalProjeto}`);
    console.log(`   maquinasAgendadas: ${maquinasAgendadas}`);
    console.log(`   maquinasEntregues: ${maquinasEntregues}`);
    console.log(`   totalAtribuido: ${totalAtribuido}`);
    console.log(`   maquinasFaltamEntregar: ${maquinasFaltamEntregar}`);
    console.log(`   disponiveis: ${disponiveis}`);

    console.log('\n✅ TESTE CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testar();