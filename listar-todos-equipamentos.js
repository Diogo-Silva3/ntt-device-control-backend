const prisma = require('./src/config/prisma');

async function listar() {
  try {
    console.log('=== Buscando H45C9H4 ===');
    const h45 = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (h45) {
      console.log('Encontrado:');
      console.log(`ID: ${h45.id}`);
      console.log(`Serial: ${h45.serialNumber}`);
      console.log(`Status: ${h45.status}`);
      console.log(`StatusProcesso: ${h45.statusProcesso}`);
      console.log(`EmpresaId: ${h45.empresaId}`);
      console.log(`ProjetoId: ${h45.projetoId}`);
      console.log(`Agendamento: ${h45.agendamento}`);
    } else {
      console.log('Não encontrado!');
    }
    
    console.log('\n=== Contagem de equipamentos por statusProcesso ===');
    const porStatus = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      _count: true,
      orderBy: { _count: { statusProcesso: 'desc' } }
    });
    
    porStatus.forEach(s => {
      console.log(`${s.statusProcesso || 'null'}: ${s._count}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

listar();
