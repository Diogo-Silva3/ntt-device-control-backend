const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO H45C9H4 PARA ENTREGUE ===\n');

    // Buscar o equipamento
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacao: {
          include: {
            tecnico: true,
            colaborador: true
          }
        }
      }
    });

    if (!equipamento) {
      console.log('❌ Equipamento H45C9H4 não encontrado');
      return;
    }

    console.log('Status atual:', equipamento.status);
    console.log('Vinculação:', equipamento.vinculacao);

    // Atualizar para ENTREGUE
    const atualizado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { status: 'ENTREGUE' }
    });

    console.log('\n✅ Equipamento atualizado para:', atualizado.status);

  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
