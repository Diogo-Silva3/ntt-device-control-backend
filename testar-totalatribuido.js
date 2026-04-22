require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testar() {
  try {
    console.log('=== TESTANDO TOTALATRIBUIDO ===\n');

    const empresaId = 1;
    const projetoId = 1;

    // Teste 1: Com projetoId
    const resultado1 = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: {
          ...(projetoId && { projetoId }),
          empresaId,
        },
      },
    });

    console.log(`✅ COM projetoId (${projetoId}): ${resultado1}`);

    // Teste 2: Sem projetoId (undefined)
    const projetoIdUndefined = undefined;
    const resultado2 = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: {
          ...(projetoIdUndefined && { projetoId: projetoIdUndefined }),
          empresaId,
        },
      },
    });

    console.log(`❌ SEM projetoId (undefined): ${resultado2}`);

    // Teste 3: Forçando projetoId sempre
    const resultado3 = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: {
          projetoId: 1,
          empresaId: 1,
        },
      },
    });

    console.log(`✅ FORÇANDO projetoId=1: ${resultado3}`);

    console.log('\n✅ TESTE CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testar();
