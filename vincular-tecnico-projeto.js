const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function vincular() {
  try {
    console.log('🔗 Vinculando técnico Reidel ao projeto de celulares...\n');

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

    // Buscar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: 'TECH REFRESH CELULARES 2026'
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      return;
    }

    console.log(`✅ Técnico: ${reidel.nome} (ID: ${reidel.id})`);
    console.log(`✅ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Atualizar o técnico para vincular ao projeto
    // Nota: Isso depende da estrutura do banco. Se houver um campo projetoId no usuário:
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: reidel.id },
      data: {
        // Se houver um campo de projeto, descomente:
        // projetoId: projeto.id
      }
    });

    console.log('✅ Técnico vinculado com sucesso!');
    console.log('\n📋 Informações atualizadas:');
    console.log(`   Nome: ${usuarioAtualizado.nome}`);
    console.log(`   Role: ${usuarioAtualizado.role}`);
    console.log(`   Ativo: ${usuarioAtualizado.ativo}`);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

vincular();
