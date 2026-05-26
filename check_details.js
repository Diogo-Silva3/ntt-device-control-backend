const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  try {
    console.log("=== ANÁLISE DE EQUIPAMENTOS ENTREGUES SEM VINCULAÇÃO ATIVA ===");

    // 1. Equipamentos com statusProcesso in ['Entregue ao Usuário', 'Em Uso']
    const eqsEntregues = await prisma.equipamento.findMany({
      where: {
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        status: { not: 'DESCARTADO' },
        projetoId: 1
      },
      include: {
        unidade: true,
        vinculacoes: {
          include: {
            usuario: true
          }
        }
      }
    });

    console.log(`\nTotal de equipamentos com statusProcesso de entrega: ${eqsEntregues.length}`);
    
    let countSemVincAtiva = 0;
    for (const eq of eqsEntregues) {
      const vincAtiva = eq.vinculacoes.find(v => v.ativa);
      if (!vincAtiva) {
        countSemVincAtiva++;
        console.log(`\n[SEM VINCULAÇÃO ATIVA] Eq ID: ${eq.id}, Serial: ${eq.serialNumber}, Modelo: ${eq.modelo}, Unidade: ${eq.unidade?.nome} (ID: ${eq.unidadeId}), StatusProcesso: ${eq.statusProcesso}, Status: ${eq.status}`);
        console.log(`  Histórico de vinculações (${eq.vinculacoes.length}):`);
        eq.vinculacoes.forEach(v => {
          console.log(`    * Vinc ID: ${v.id}, Colaborador: ${v.usuario?.nome}, Ativa: ${v.ativa}, StatusEntrega: ${v.statusEntrega}, dataInicio: ${v.dataInicio}, dataFim: ${v.dataFim}`);
        });
      } else {
        // Tem vinculação ativa. Vamos checar se o statusEntrega é ENTREGUE
        if (vincAtiva.statusEntrega !== 'ENTREGUE') {
          console.log(`\n[VINCULAÇÃO ATIVA NÃO-ENTREGUE] Eq ID: ${eq.id}, Serial: ${eq.serialNumber}, Unidade: ${eq.unidade?.nome}`);
          console.log(`    * Vinc ID: ${vincAtiva.id}, Colaborador: ${vincAtiva.usuario?.nome}, Ativa: ${vincAtiva.ativa}, StatusEntrega: ${vincAtiva.statusEntrega}`);
        }
      }
    }
    console.log(`\nTotal de equipamentos entregues SEM vinculação ativa: ${countSemVincAtiva}`);

    console.log("\n=== ANÁLISE DE VINCULAÇÕES ATIVAS DA GABRIELA MARQUESI VAL (BASTECK) ===");
    const gabrielaVincs = await prisma.vinculacao.findMany({
      where: {
        usuario: {
          nome: { contains: 'GABRIELA MARQUESI' }
        }
      },
      include: {
        equipamento: true,
        usuario: true
      }
    });
    gabrielaVincs.forEach(v => {
      console.log(`Vinc ID: ${v.id}, Ativa: ${v.ativa}, StatusEntrega: ${v.statusEntrega}, Eq ID: ${v.equipamentoId}, Eq Serial: ${v.equipamento.serialNumber}, Eq Unidade: ${v.equipamento.unidadeId}, Eq Status: ${v.equipamento.status}, Eq StatusProcesso: ${v.equipamento.statusProcesso}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetails();
