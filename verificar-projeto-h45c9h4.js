const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando projeto do H45C9H4 ===\n');
    
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: { projeto: true }
    });
    
    if (!eq) {
      console.log('H45C9H4 não encontrado');
      return;
    }
    
    console.log('Equipamento encontrado:');
    console.log(`- Serial: ${eq.serialNumber}`);
    console.log(`- ProjetoId: ${eq.projetoId}`);
    console.log(`- Projeto: ${eq.projeto ? eq.projeto.nome : 'Nenhum'}`);
    console.log(`- StatusProcesso: ${eq.statusProcesso}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
