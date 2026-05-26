const prisma = require('./src/config/prisma');

const verificar = async () => {
  try {
    console.log('Verificando equipamento F95C9H4...\n');
    
    // Buscar o equipamento
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      include: {
        vinculacoes: true,
        tecnico: { select: { nome: true } }
      }
    });
    
    if (!equipamento) {
      console.log('❌ Equipamento F95C9H4 não encontrado');
      return;
    }
    
    console.log('📦 Equipamento encontrado:');
    console.log(`   ID: ${equipamento.id}`);
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Marca: ${equipamento.marca}`);
    console.log(`   Modelo: ${equipamento.modelo}`);
    console.log(`   Status: ${equipamento.status}`);
    console.log(`   Status Processo: ${equipamento.statusProcesso}`);
    console.log(`   Técnico: ${equipamento.tecnico?.nome || 'Nenhum'}`);
    
    console.log('\n📋 Agendamento:');
    if (equipamento.agendamento) {
      try {
        const agendamento = JSON.parse(equipamento.agendamento);
        console.log(`   ${JSON.stringify(agendamento, null, 2)}`);
      } catch (e) {
        console.log(`   ${equipamento.agendamento}`);
      }
    } else {
      console.log('   Nenhum agendamento');
    }
    
    console.log('\n🔗 Vinculações:');
    if (equipamento.vinculacoes.length === 0) {
      console.log('   Nenhuma vinculação');
    } else {
      equipamento.vinculacoes.forEach((v, i) => {
        console.log(`   ${i+1}. ID: ${v.id}`);
        console.log(`      Usuário ID: ${v.usuarioId}`);
        console.log(`      Status: ${v.statusEntrega}`);
        console.log(`      Ativa: ${v.ativa}`);
        console.log(`      Data Início: ${v.dataInicio}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

verificar();
