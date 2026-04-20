const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando Vinculações do Equipamento 685C9H4 ===\n');
    
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { equipamentoId: 719 }, // ID do equipamento 685C9H4
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { serialNumber: true } },
        tecnico: { select: { nome: true } }
      }
    });
    
    console.log(`Total de vinculações: ${vinculacoes.length}\n`);
    
    vinculacoes.forEach(v => {
      console.log(`Vinculação ID: ${v.id}`);
      console.log(`  - Colaborador: ${v.usuario?.nome}`);
      console.log(`  - Equipamento: ${v.equipamento?.serialNumber}`);
      console.log(`  - Status Entrega: ${v.statusEntrega}`);
      console.log(`  - Data Agendamento: ${v.dataAgendamento}`);
      console.log(`  - Ativa: ${v.ativa}`);
      console.log(`  - Criada em: ${v.createdAt}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
