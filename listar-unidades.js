const prisma = require('./src/config/prisma');

async function listar() {
  try {
    console.log('📋 Listando todas as unidades...\n');

    const unidades = await prisma.unidade.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true }
    });

    console.log('Unidades disponíveis:\n');
    unidades.forEach((u, i) => {
      console.log(`${i + 1}. ID: ${u.id} - ${u.nome}`);
    });

    console.log(`\nTotal: ${unidades.length} unidades`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

listar();
