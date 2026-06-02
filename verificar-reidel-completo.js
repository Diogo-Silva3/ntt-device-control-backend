const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando dados completos do técnico Reidel...\n');

    const reidel = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'REIDEL', mode: 'insensitive' }
      },
      include: {
        unidade: true,
        projeto: true,
        empresa: true
      }
    });

    if (!reidel) {
      console.log('❌ Técnico Reidel não encontrado');
      return;
    }

    console.log('📋 Dados do Técnico Reidel:\n');
    console.log(`ID: ${reidel.id}`);
    console.log(`Nome: ${reidel.nome}`);
    console.log(`Email: ${reidel.email}`);
    console.log(`Role: ${reidel.role}`);
    console.log(`Ativo: ${reidel.ativo}`);
    console.log(`Unidade ID: ${reidel.unidadeId}`);
    console.log(`Unidade: ${reidel.unidade ? reidel.unidade.nome : '❌ SEM UNIDADE'}`);
    console.log(`Projeto ID: ${reidel.projetoId}`);
    console.log(`Projeto: ${reidel.projeto ? reidel.projeto.nome : '❌ SEM PROJETO'}`);
    console.log(`Empresa ID: ${reidel.empresaId}`);
    console.log(`Empresa: ${reidel.empresa ? reidel.empresa.nome : '❌ SEM EMPRESA'}`);

    if (!reidel.unidadeId) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO: Reidel não tem unidade vinculada!');
      console.log('   Isso pode ser o motivo de não aparecer no dropdown.');
    }

    if (!reidel.projetoId) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO: Reidel não tem projeto vinculado!');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
