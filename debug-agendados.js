const prisma = require('./src/config/prisma');

async function debug() {
  try {
    console.log('=== Equipamentos com statusProcesso: Agendado para Entrega ===');
    const agendados = await prisma.equipamento.findMany({
      where: { statusProcesso: 'Agendado para Entrega' },
      select: { 
        id: true, 
        serialNumber: true, 
        status: true,
        statusProcesso: true,
        empresaId: true,
        projetoId: true,
        marca: true,
        modelo: true
      }
    });
    
    console.log(`Total encontrado: ${agendados.length}`);
    agendados.forEach(eq => {
      console.log(`- ${eq.serialNumber} | Status: ${eq.status} | StatusProcesso: ${eq.statusProcesso} | Empresa: ${eq.empresaId}`);
    });
    
    console.log('\n=== Contagem por status ===');
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: { statusProcesso: 'Agendado para Entrega' },
      _count: true
    });
    
    porStatus.forEach(s => {
      console.log(`${s.status}: ${s._count}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
