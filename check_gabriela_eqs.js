const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGabrielaEqs() {
  try {
    const ids = [723, 740, 727, 725, 724, 742, 726];
    const eqs = await prisma.equipamento.findMany({
      where: { id: { in: ids } },
      include: {
        unidade: true,
        projeto: true
      }
    });

    console.log("=== EQUIPAMENTOS DAS VINCULAÇÕES DE GABRIELA MARQUESI VAL ===");
    eqs.forEach(e => {
      console.log(`Eq ID: ${e.id}, Serial: ${e.serialNumber}, Status: ${e.status}, StatusProcesso: ${e.statusProcesso}, Projeto: ${e.projeto?.nome} (ID: ${e.projetoId}), Unidade: ${e.unidade?.nome} (ID: ${e.unidadeId})`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkGabrielaEqs();
