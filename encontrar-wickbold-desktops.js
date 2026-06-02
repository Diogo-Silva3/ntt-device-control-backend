const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function encontrar() {
  try {
    console.log('🔍 Encontrando desktops ainda como WICKBOLD...\n');

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        projeto: {
          nome: 'TECH REFRESH DESKTOP 2026'
        },
        unidade: {
          nome: 'WICKBOLD'
        }
      },
      select: {
        serialNumber: true,
        unidade: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    console.log(`Total: ${equipamentos.length} desktops ainda como WICKBOLD\n`);
    
    equipamentos.forEach(e => {
      console.log(`  ${e.serialNumber}`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

encontrar();
