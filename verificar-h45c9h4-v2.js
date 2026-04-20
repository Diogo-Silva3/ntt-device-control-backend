const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    // Buscar todos os equipamentos agendados
    const agendados = await prisma.equipamento.findMany({
      where: { statusProcesso: 'Agendado para Entrega' },
      select: { id: true, serialNumber: true, statusProcesso: true, projetoId: true, empresaId: true }
    });
    
    console.log('Equipamentos agendados:');
    console.log(JSON.stringify(agendados, null, 2));
    
    // Buscar especificamente H45C9H4
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      select: { id: true, serialNumber: true, statusProcesso: true, status: true, empresaId: true, projetoId: true }
    });
    
    console.log('\nEquipamento H45C9H4:');
    console.log(JSON.stringify(eq, null, 2));
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
