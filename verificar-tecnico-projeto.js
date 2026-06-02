const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando vinculação de técnico com projeto...\n');

    // Buscar o técnico Reidel
    const reidel = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'REIDEL', mode: 'insensitive' }
      }
    });

    if (!reidel) {
      console.log('❌ Técnico Reidel não encontrado');
      return;
    }

    console.log(`✅ Técnico encontrado: ${reidel.nome} (ID: ${reidel.id})\n`);

    // Buscar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      return;
    }

    console.log(`✅ Projeto encontrado: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Verificar se existe vinculação
    console.log('📋 Verificando se há tabela de vinculação técnico-projeto...\n');

    // Listar todos os projetos
    const projetos = await prisma.projeto.findMany({
      select: {
        id: true,
        nome: true
      }
    });

    console.log('📊 Projetos cadastrados:');
    console.table(projetos);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
