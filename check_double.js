const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoubleVinculacoes() {
  try {
    const eqs = await prisma.equipamento.findMany({
      where: {
        status: { not: 'DESCARTADO' },
        projetoId: 1
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: { usuario: true }
        }
      }
    });

    console.log("=== EQUIPAMENTOS COM MÚLTIPLAS VINCULAÇÕES ATIVAS ===");
    let count = 0;
    for (const eq of eqs) {
      if (eq.vinculacoes.length > 1) {
        count++;
        console.log(`\nEq ID: ${eq.id}, Serial: ${eq.serialNumber}, Status: ${eq.status}, StatusProcesso: ${eq.statusProcesso}`);
        eq.vinculacoes.forEach(v => {
          console.log(`  * Vinc ID: ${v.id}, Colaborador: ${v.usuario.nome} (ID: ${v.usuarioId}, Unidade: ${v.usuario.unidadeId}), StatusEntrega: ${v.statusEntrega}, Criado em: ${v.createdAt}`);
        });
      }
    }
    console.log(`\nTotal de equipamentos com múltiplas vinculações ativas: ${count}`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoubleVinculacoes();
