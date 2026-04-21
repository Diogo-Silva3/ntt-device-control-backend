const prisma = require('./src/config/prisma');

async function agendar() {
  try {
    console.log('=== Agendando H45C9H4 para ELAINE ===\n');
    
    // Primeiro buscar o ID
    const eqFind = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (!eqFind) {
      console.log('H45C9H4 não encontrado');
      return;
    }
    
    const eq = await prisma.equipamento.update({
      where: { id: eqFind.id },
      data: {
        agendamento: JSON.stringify({
          colaboradorId: '82',
          data: new Date().toISOString().split('T')[0],
          horario: '10:00',
          local: 'Sala TI'
        }),
        statusProcesso: 'Agendado para Entrega',
        dataEntrega: new Date()
      },
      include: { 
        vinculacoes: { 
          include: { usuario: true } 
        } 
      }
    });
    
    console.log('✓ Agendamento salvo com sucesso!');
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    console.log(`- Agendamento: ${eq.agendamento}`);
    console.log(`- DataEntrega: ${eq.dataEntrega}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

agendar();
