const prisma = require('./src/config/prisma');

async function discard() {
  try {
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }

    // Encontrar equipamento com NAO_COMPARECEU
    const naoCompareceu = await prisma.equipamento.findFirst({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          some: {
            statusEntrega: 'NAO_COMPARECEU'
          }
        }
      }
    });

    if (!naoCompareceu) {
      console.log('Nenhum equipamento com NAO_COMPARECEU encontrado');
      return;
    }

    console.log(`Equipamento encontrado: ${naoCompareceu.serialNumber}`);
    console.log(`Status atual: ${naoCompareceu.status}`);

    // Descartar o equipamento
    const resultado = await prisma.equipamento.update({
      where: { id: naoCompareceu.id },
      data: { status: 'DESCARTADO' }
    });

    console.log(`Equipamento descartado: ${resultado.serialNumber}`);

    // Verificar os novos valores
    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    const entregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    console.log('\n=== NOVOS VALORES ===');
    console.log('Total do Projeto:', totalProjeto);
    console.log('Entregues:', entregues);
    console.log('Faltam Entregar:', Math.max(0, totalProjeto - entregues));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

discard();
