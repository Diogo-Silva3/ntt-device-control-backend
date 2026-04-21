const prisma = require('./src/config/prisma');

async function debug() {
  try {
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    console.log('=== H45C9H4 ===');
    console.log('Serial:', eq.serialNumber);
    console.log('StatusProcesso:', eq.statusProcesso);
    console.log('Status:', eq.status);
    console.log('TecnicoId:', eq.tecnicoId);
    console.log('Agendamento:', eq.agendamento);
    
    // Contar agendados
    const count = await prisma.equipamento.count({
      where: {
        statusProcesso: 'Agendado para Entrega',
        status: { not: 'DESCARTADO' }
      }
    });
    
    console.log('\nTotal agendados:', count);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
