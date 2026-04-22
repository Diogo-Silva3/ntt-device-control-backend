require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO H45C9H4 ===\n');

    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
    });

    console.log(`Equipamento: ${equipamento.serialNumber}`);
    console.log(`  Status atual: ${equipamento.status}`);
    console.log(`  StatusProcesso: ${equipamento.statusProcesso}`);

    // Equipamento agendado para entrega não deve estar DISPONIVEL
    // Deve estar em preparação (status diferente de DISPONIVEL)
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        status: 'EM_PREPARACAO', // ou outro status que não seja DISPONIVEL
      },
    });

    console.log(`  Novo status: EM_PREPARACAO\n`);

    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
