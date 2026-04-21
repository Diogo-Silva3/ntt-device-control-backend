const prisma = require('./src/config/prisma');

async function corrigir() {
  try {
    console.log('=== Corrigindo H45C9H4 ===\n');
    
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (!eq) {
      console.log('Equipamento não encontrado');
      return;
    }
    
    console.log('Equipamento encontrado:');
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    console.log(`- Agendamento: ${eq.agendamento}`);
    
    console.log('\n✓ Voltando para "Asset Registrado"...');
    
    const atualizado = await prisma.equipamento.update({
      where: { id: eq.id },
      data: {
        statusProcesso: 'Asset Registrado',
        agendamento: null,
        dataEntrega: null
      }
    });
    
    console.log('✓ Corrigido com sucesso!');
    console.log(`- Novo StatusProcesso: ${atualizado.statusProcesso}`);
    console.log('\nAgora você pode agendar corretamente com colaborador e data!');
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
