const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando H45C9H4 ===\n');
    
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: { 
        vinculacoes: { 
          include: { usuario: true } 
        } 
      }
    });
    
    if (!eq) {
      console.log('Equipamento não encontrado');
      return;
    }
    
    console.log('Serial:', eq.serialNumber);
    console.log('StatusProcesso:', eq.statusProcesso);
    console.log('Agendamento:', eq.agendamento);
    console.log('DataEntrega:', eq.dataEntrega);
    console.log('\nVinculações:');
    eq.vinculacoes.forEach(v => {
      console.log(`  - ${v.usuario.nome}`);
      console.log(`    StatusEntrega: ${v.statusEntrega}`);
      console.log(`    Ativa: ${v.ativa}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
