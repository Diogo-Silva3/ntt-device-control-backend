const prisma = require('./src/config/prisma');

async function limparAgendamentosTeste() {
  try {
    console.log('=== Limpando Agendamentos de Teste ===\n');
    
    // Buscar equipamento 685C9H4
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: '685C9H4' },
      select: { id: true, serialNumber: true, statusProcesso: true, agendamento: true }
    });
    
    if (!eq) {
      console.log('Equipamento 685C9H4 não encontrado');
      return;
    }
    
    console.log('Equipamento encontrado:');
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    console.log(`- Agendamento: ${eq.agendamento}`);
    
    if (eq.statusProcesso === 'Agendado para Entrega' && eq.agendamento) {
      console.log('\n✓ Removendo agendamento...');
      
      // Voltar para status anterior (Asset Registrado é o padrão antes de agendar)
      const atualizado = await prisma.equipamento.update({
        where: { id: eq.id },
        data: {
          statusProcesso: 'Asset Registrado',
          agendamento: null,
          dataEntrega: null
        }
      });
      
      console.log('\n✓ Agendamento removido com sucesso!');
      console.log(`- Novo StatusProcesso: ${atualizado.statusProcesso}`);
      console.log(`- Agendamento: ${atualizado.agendamento}`);
    } else {
      console.log('\n✗ Equipamento não está agendado ou não tem dados de agendamento');
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

limparAgendamentosTeste();
