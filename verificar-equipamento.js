const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarEquipamento() {
  try {
    console.log('🔍 Procurando equipamento: sp14rs07#Neto\n');

    const equipamento = await prisma.equipamento.findFirst({
      where: {
        OR: [
          { serialNumber: { contains: 'sp14rs07', mode: 'insensitive' } },
          { serialNumber: { contains: 'Neto', mode: 'insensitive' } }
        ]
      },
      include: {
        vinculacoes: { where: { ativa: true } },
        unidade: true,
        projeto: true,
        empresa: true
      }
    });

    if (!equipamento) {
      console.log('❌ Equipamento não encontrado');
      return;
    }

    console.log('✅ Equipamento encontrado:\n');
    console.log(`Serial: ${equipamento.serialNumber}`);
    console.log(`Marca/Modelo: ${equipamento.marca} ${equipamento.modelo}`);
    console.log(`Status: ${equipamento.status}`);
    console.log(`StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`Empresa: ${equipamento.empresa?.nome}`);
    console.log(`Projeto: ${equipamento.projeto?.nome}`);
    console.log(`Unidade: ${equipamento.unidade?.nome}`);
    console.log(`\nVinculações ativas: ${equipamento.vinculacoes.length}`);
    
    equipamento.vinculacoes.forEach((v, idx) => {
      console.log(`  ${idx + 1}. StatusEntrega: ${v.statusEntrega}`);
    });

    console.log(`\n⚠️ Este equipamento ${equipamento.statusProcesso === 'Agendado para Entrega' ? 'ESTÁ' : 'NÃO ESTÁ'} em "Agendado para Entrega"`);

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarEquipamento();
