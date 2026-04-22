const prisma = require('./src/config/prisma');

async function find() {
  try {
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }

    // Encontrar equipamentos sem vinculação
    const semVinculacao = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          none: {}
        }
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        marca: true,
        modelo: true
      }
    });

    console.log(`\nEncontrados ${semVinculacao.length} equipamentos SEM vinculação:`);
    semVinculacao.forEach(eq => {
      console.log(`- ${eq.serialNumber} (${eq.marca} ${eq.modelo}) - ${eq.statusProcesso}`);
    });

    // Encontrar equipamentos com vinculação NAO_COMPARECEU
    const naoCompareceu = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          some: {
            statusEntrega: 'NAO_COMPARECEU'
          }
        }
      },
      include: {
        vinculacoes: {
          where: { statusEntrega: 'NAO_COMPARECEU' },
          select: { statusEntrega: true }
        }
      }
    });

    console.log(`\nEncontrados ${naoCompareceu.length} equipamentos com NAO_COMPARECEU:`);
    naoCompareceu.forEach(eq => {
      console.log(`- ${eq.serialNumber} (${eq.marca} ${eq.modelo}) - ${eq.statusProcesso}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

find();
