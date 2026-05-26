const prisma = require('./src/config/prisma');

const atribuir = async () => {
  try {
    console.log('Atribuindo equipamento para colaborador...\n');
    
    // Buscar o equipamento
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: '435C9H4' }
    });
    
    if (!equipamento) {
      console.log('❌ Equipamento 435C9H4 não encontrado');
      return;
    }
    
    console.log(`✅ Equipamento encontrado:`);
    console.log(`   ID: ${equipamento.id}`);
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Status: ${equipamento.statusProcesso}\n`);
    
    // Buscar o colaborador
    const colaborador = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'SERGIO ALVES CARDOSO JUNIOR', mode: 'insensitive' },
        role: 'COLABORADOR'
      }
    });
    
    if (!colaborador) {
      console.log('❌ Colaborador SERGIO ALVES CARDOSO JUNIOR não encontrado');
      return;
    }
    
    console.log(`✅ Colaborador encontrado:`);
    console.log(`   ID: ${colaborador.id}`);
    console.log(`   Nome: ${colaborador.nome}`);
    console.log(`   Email: ${colaborador.email}\n`);
    
    // Atualizar equipamento para "Entregue ao Usuário"
    const equipamentoAtualizado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Entregue ao Usuário',
        agendamento: JSON.stringify({
          colaboradorId: colaborador.id,
          data: new Date().toISOString().split('T')[0],
          horario: new Date().toTimeString().split(' ')[0],
          local: 'Atribuição automática'
        })
      }
    });
    
    console.log(`✅ Equipamento atualizado para "Entregue ao Usuário"`);
    
    // Criar vinculação
    const vinculacao = await prisma.vinculacao.create({
      data: {
        equipamentoId: equipamento.id,
        usuarioId: colaborador.id,
        statusEntrega: 'ENTREGUE',
        ativa: true,
        dataInicio: new Date()
      }
    });
    
    console.log(`✅ Vinculação criada:`);
    console.log(`   ID: ${vinculacao.id}`);
    console.log(`   Status: ${vinculacao.statusEntrega}`);
    console.log(`   Ativa: ${vinculacao.ativa}\n`);
    
    console.log('✅ Equipamento 435C9H4 atribuído com sucesso para SERGIO ALVES CARDOSO JUNIOR!');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

atribuir();
