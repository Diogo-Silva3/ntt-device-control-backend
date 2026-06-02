const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Procurando técnico Reidel...\n');

    // Buscar por nome contendo "reidel"
    const tecnicos = await prisma.usuario.findMany({
      where: {
        OR: [
          { nome: { contains: 'Reidel', mode: 'insensitive' } },
          { nome: { contains: 'REIDEL', mode: 'insensitive' } },
          { nome: { contains: 'reidel', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true
      }
    });

    if (tecnicos.length > 0) {
      console.log(`✅ Encontrado(s) ${tecnicos.length} técnico(s):\n`);
      console.table(tecnicos);
    } else {
      console.log('❌ Nenhum técnico com nome "Reidel" encontrado\n');

      // Listar todos os técnicos
      console.log('📋 Listando todos os técnicos cadastrados:\n');
      const todosTecnicos = await prisma.usuario.findMany({
        where: {
          role: 'TECNICO',
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      if (todosTecnicos.length > 0) {
        console.table(todosTecnicos);
      } else {
        console.log('❌ Nenhum técnico ativo encontrado');
      }
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
