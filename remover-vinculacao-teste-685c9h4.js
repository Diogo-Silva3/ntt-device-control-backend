const prisma = require('./src/config/prisma');

async function remover() {
  try {
    console.log('=== Removendo Vinculação de Teste 685C9H4 ===\n');
    
    // Buscar vinculação
    const vinc = await prisma.vinculacao.findUnique({
      where: { id: 33 }
    });
    
    if (!vinc) {
      console.log('Vinculação não encontrada');
      return;
    }
    
    console.log('Vinculação encontrada:');
    console.log(`- ID: ${vinc.id}`);
    console.log(`- EquipamentoId: ${vinc.equipamentoId}`);
    console.log(`- UsuarioId: ${vinc.usuarioId}`);
    console.log(`- StatusEntrega: ${vinc.statusEntrega}`);
    console.log(`- Ativa: ${vinc.ativa}`);
    
    console.log('\n✓ Deletando vinculação...');
    
    await prisma.vinculacao.delete({
      where: { id: 33 }
    });
    
    console.log('✓ Vinculação removida com sucesso!');
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

remover();
