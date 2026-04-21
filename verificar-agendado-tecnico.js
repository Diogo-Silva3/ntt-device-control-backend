const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando equipamentos agendados ===\n');
    
    // Buscar PEDRO SEVERO
    const pedro = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'PEDRO SEVERO' }
      }
    });
    
    if (!pedro) {
      console.log('PEDRO SEVERO não encontrado');
      return;
    }
    
    console.log(`PEDRO SEVERO - ID: ${pedro.id}\n`);
    
    // Buscar equipamentos agendados de PEDRO
    const agendados = await prisma.equipamento.findMany({
      where: {
        tecnicoId: pedro.id,
        statusProcesso: 'Agendado para Entrega'
      },
      include: {
        tecnico: true,
        vinculacoes: { include: { usuario: true } }
      }
    });
    
    console.log(`Equipamentos agendados de PEDRO: ${agendados.length}\n`);
    
    agendados.forEach(eq => {
      console.log(`Serial: ${eq.serialNumber}`);
      console.log(`StatusProcesso: ${eq.statusProcesso}`);
      console.log(`TecnicoId: ${eq.tecnicoId}`);
      console.log(`Técnico: ${eq.tecnico?.nome}`);
      console.log(`Vinculações: ${eq.vinculacoes.length}`);
      eq.vinculacoes.forEach(v => {
        console.log(`  - ${v.usuario.nome}`);
      });
      console.log('---');
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
