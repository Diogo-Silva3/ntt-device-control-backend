const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function contar() {
  try {
    const total = await prisma.equipamento.count({
      where: {
        projeto: {
          nome: 'TECH REFRESH CELULARES 2026'
        }
      }
    });

    console.log(`📱 Total de celulares no projeto TECH REFRESH CELULARES 2026: ${total}`);

    // Listar todos
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        projeto: {
          nome: 'TECH REFRESH CELULARES 2026'
        }
      },
      select: {
        serialNumber: true,
        marca: true,
        modelo: true,
        status: true
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    console.log('\n📋 Lista de celulares:');
    equipamentos.forEach((e, i) => {
      console.log(`${i + 1}. ${e.serialNumber} - ${e.marca} ${e.modelo}`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

contar();
