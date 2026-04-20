const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando Equipamento 685C9H4 ===\n');
    
    // Buscar com serial exato
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: '685C9H4' }
    });
    
    if (eq) {
      console.log('Equipamento encontrado:');
      console.log(`- ID: ${eq.id}`);
      console.log(`- Serial: ${eq.serialNumber}`);
      console.log(`- Status: ${eq.status}`);
      console.log(`- StatusProcesso: ${eq.statusProcesso}`);
      console.log(`- Agendamento: ${eq.agendamento}`);
      console.log(`- DataEntrega: ${eq.dataEntrega}`);
      console.log(`- EmpresaId: ${eq.empresaId}`);
      console.log(`- ProjetoId: ${eq.projetoId}`);
    } else {
      console.log('Equipamento não encontrado com serial 685C9H4');
    }
    
    // Buscar equipamentos com serial similar
    console.log('\n=== Buscando Seriais Similares ===\n');
    const similares = await prisma.equipamento.findMany({
      where: {
        serialNumber: { contains: '685C' }
      },
      select: { id: true, serialNumber: true, statusProcesso: true, agendamento: true }
    });
    
    console.log(`Encontrados ${similares.length} equipamento(s) com serial similar:`);
    similares.forEach(s => {
      console.log(`- ${s.serialNumber}: statusProcesso=${s.statusProcesso}, agendamento=${s.agendamento ? 'SIM' : 'NÃO'}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
