const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando H45C9H4 ===\n');
    
    // Buscar equipamento
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      select: { id: true, serialNumber: true, statusProcesso: true, agendamento: true }
    });
    
    if (!eq) {
      console.log('Equipamento não encontrado');
      return;
    }
    
    console.log('Equipamento:');
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    console.log(`- Agendamento: ${eq.agendamento}`);
    
    // Buscar vinculações
    console.log('\n=== Vinculações ===\n');
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { equipamentoId: eq.id },
      include: {
        usuario: { select: { id: true, nome: true } }
      }
    });
    
    console.log(`Total de vinculações: ${vinculacoes.length}`);
    
    if (vinculacoes.length === 0) {
      console.log('✗ SEM VINCULAÇÃO! Equipamento agendado mas sem usuário atribuído!');
    } else {
      vinculacoes.forEach(v => {
        console.log(`- Usuário: ${v.usuario?.nome}, Ativa: ${v.ativa}, Status: ${v.statusEntrega}`);
      });
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
