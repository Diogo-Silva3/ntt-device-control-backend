const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO H45C9H4 ===\n');

    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacao: {
          include: {
            tecnico: true,
            colaborador: true
          }
        }
      }
    });

    if (!equipamento) {
      console.log('❌ Equipamento não encontrado');
      return;
    }

    console.log('Serial:', equipamento.serialNumber);
    console.log('Status:', equipamento.status);
    console.log('\nVinculação:');
    if (equipamento.vinculacao) {
      console.log('  Colaborador:', equipamento.vinculacao.colaborador?.nome);
      console.log('  Técnico:', equipamento.vinculacao.tecnico?.nome);
      console.log('  Status Vinculação:', equipamento.vinculacao.status);
      console.log('  Data Agendamento:', equipamento.vinculacao.dataAgendamento);
      console.log('  Data Entrega:', equipamento.vinculacao.dataEntrega);
    } else {
      console.log('  ❌ SEM VINCULAÇÃO');
    }

  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
