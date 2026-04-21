const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando TODOS os equipamentos agendados ===\n');
    
    const agendados = await prisma.equipamento.findMany({
      where: { 
        statusProcesso: 'Agendado para Entrega'
      },
      include: { 
        vinculacoes: { 
          include: { usuario: true } 
        },
        empresa: { select: { nome: true } }
      }
    });
    
    console.log(`Total de equipamentos agendados: ${agendados.length}\n`);
    
    agendados.forEach(eq => {
      console.log(`Serial: ${eq.serialNumber}`);
      console.log(`Empresa: ${eq.empresa.nome}`);
      console.log(`StatusProcesso: ${eq.statusProcesso}`);
      console.log(`Agendamento: ${JSON.stringify(eq.agendamento)}`);
      console.log(`DataEntrega: ${eq.dataEntrega}`);
      console.log(`Vinculações: ${eq.vinculacoes.length}`);
      eq.vinculacoes.forEach(v => {
        console.log(`  - ${v.usuario.nome} (${v.statusEntrega})`);
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
