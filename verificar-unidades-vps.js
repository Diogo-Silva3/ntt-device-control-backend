const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando unidades dos desktops na VPS...\n');

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        serialNumber: {
          in: ['BFMYDJ4', 'B5MYDJ4', '5FMYDJ4', 'DFMYDJ4', 'DCMYDJ4']
        }
      },
      select: {
        serialNumber: true,
        unidadeId: true,
        unidade: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    console.table(equipamentos);

    // Contar por unidade
    const porUnidade = {};
    const allEquips = await prisma.equipamento.findMany({
      where: {
        projeto: {
          nome: 'TECH REFRESH DESKTOP 2026'
        }
      },
      select: {
        unidade: {
          select: {
            nome: true
          }
        }
      }
    });

    allEquips.forEach(e => {
      const un = e.unidade?.nome || 'Sem Unidade';
      porUnidade[un] = (porUnidade[un] || 0) + 1;
    });

    console.log('\n📊 Resumo por Unidade (TECH REFRESH DESKTOP 2026):');
    Object.entries(porUnidade).forEach(([un, qtd]) => {
      console.log(`   ${un}: ${qtd}`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
