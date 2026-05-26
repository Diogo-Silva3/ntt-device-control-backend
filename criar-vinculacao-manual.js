const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function criar() {
  try {
    console.log('Criando vinculação para equipamento 718...');
    
    const vinculacao = await prisma.vinculacao.create({
      data: {
        equipamentoId: 718,
        usuarioId: 231,
        tecnicoId: 1,
        statusEntrega: 'ENTREGUE',
        dataInicio: new Date(),
        ativa: true,
      }
    });
    
    console.log('✓ Vinculação criada com sucesso:', vinculacao.id);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

criar();
