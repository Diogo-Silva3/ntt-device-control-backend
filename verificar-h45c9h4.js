const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      select: { id: true, serialNumber: true, statusProcesso: true, status: true, empresaId: true, agendamento: true }
    });
    
    console.log('Equipamento H45C9H4:');
    console.log(JSON.stringify(eq, null, 2));
    
    if (eq) {
      console.log('\nAgendamento parseado:');
      if (eq.agendamento) {
        console.log(JSON.parse(eq.agendamento));
      } else {
        console.log('Sem agendamento');
      }
    }
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
