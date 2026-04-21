const prisma = require('./src/config/prisma');

async function testar() {
  try {
    console.log('=== Testando agendamento ===\n');
    
    // Buscar ELAINE LOPES DOS SANTOS
    const elaine = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'ELAINE' }
      }
    });
    
    if (!elaine) {
      console.log('ELAINE não encontrada');
      return;
    }
    
    console.log('Colaboradora encontrada:');
    console.log(`- ID: ${elaine.id}`);
    console.log(`- Nome: ${elaine.nome}`);
    console.log(`- Empresa: ${elaine.empresaId}`);
    
    // Buscar H45C9H4
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (!eq) {
      console.log('H45C9H4 não encontrado');
      return;
    }
    
    console.log('\nEquipamento encontrado:');
    console.log(`- ID: ${eq.id}`);
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    console.log(`- Empresa: ${eq.empresaId}`);
    
    // Verificar se ELAINE é da mesma empresa
    if (elaine.empresaId !== eq.empresaId) {
      console.log('\n⚠️ AVISO: ELAINE é de empresa diferente!');
      console.log(`- Equipamento empresa: ${eq.empresaId}`);
      console.log(`- ELAINE empresa: ${elaine.empresaId}`);
      return;
    }
    
    console.log('\n✓ Mesma empresa - pode agendar!');
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testar();
