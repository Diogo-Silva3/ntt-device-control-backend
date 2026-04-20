const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando Equipamento H45C9H4 ===\n');
    
    // Buscar equipamento
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
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
      console.log('Equipamento não encontrado');
      return;
    }
    
    // Buscar vinculações
    console.log('\n=== Vinculações ===\n');
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { equipamentoId: eq.id },
      include: {
        usuario: { select: { nome: true } },
        tecnico: { select: { nome: true } }
      }
    });
    
    console.log(`Total de vinculações: ${vinculacoes.length}`);
    vinculacoes.forEach(v => {
      console.log(`- Colaborador: ${v.usuario?.nome}, Status: ${v.statusEntrega}, Ativa: ${v.ativa}`);
    });
    
    // Verificar se deveria estar em "Agendadas"
    console.log('\n=== Análise ===\n');
    if (eq.statusProcesso === 'Agendado para Entrega') {
      console.log('✓ Equipamento DEVERIA estar em "Agendadas" (statusProcesso correto)');
    } else {
      console.log(`✗ Equipamento NÃO deveria estar em "Agendadas" (statusProcesso=${eq.statusProcesso})`);
    }
    
    if (eq.agendamento) {
      console.log('✓ Tem dados de agendamento');
    } else {
      console.log('✗ Sem dados de agendamento');
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
