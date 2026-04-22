const prisma = require('./src/config/prisma');

async function undo() {
  try {
    // Restaurar H45C9H4
    const resultado = await prisma.equipamento.update({
      where: { serialNumber: 'H45C9H4' },
      data: { status: 'DISPONIVEL' }
    });

    console.log(`Equipamento restaurado: ${resultado.serialNumber}`);

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    // Verificar os valores
    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    const entregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    console.log('\n=== VALORES ===');
    console.log('Total do Projeto:', totalProjeto);
    console.log('Entregues:', entregues);
    console.log('Faltam Entregar:', Math.max(0, totalProjeto - entregues));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

undo();
