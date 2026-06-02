const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarProjetos() {
  try {
    console.log('📊 VERIFICANDO TODOS OS PROJETOS...\n');

    // Buscar empresa BIMBO BRASIL
    const empresa = await prisma.empresa.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    if (!empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    // Buscar todos os projetos
    const projetos = await prisma.projeto.findMany({
      where: { empresaId: empresa.id }
    });

    console.log(`✅ Total de projetos: ${projetos.length}\n`);

    // Para cada projeto, contar equipamentos
    for (const projeto of projetos) {
      const equipamentos = await prisma.equipamento.findMany({
        where: { projetoId: projeto.id }
      });

      console.log(`📦 ${projeto.nome}`);
      console.log(`   ID: ${projeto.id}`);
      console.log(`   Equipamentos: ${equipamentos.length}`);
      console.log();
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarProjetos();
