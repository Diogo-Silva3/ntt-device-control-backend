const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function criar() {
  try {
    console.log('Criando vinculação para equipamento F95C9H4...');
    
    // Encontrar o equipamento
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      select: { id: true, agendamento: true }
    });

    if (!eq) {
      console.log('❌ Equipamento não encontrado');
      process.exit(1);
    }

    console.log('Equipamento encontrado:', eq.id);
    
    // Parse agendamento
    let colaboradorId = null;
    if (eq.agendamento) {
      const agend = JSON.parse(eq.agendamento);
      colaboradorId = parseInt(agend.colaboradorId);
      console.log('Colaborador ID:', colaboradorId);
    }

    if (!colaboradorId) {
      console.log('❌ Nenhum colaborador no agendamento');
      process.exit(1);
    }

    // Desativar vinculações anteriores
    await prisma.vinculacao.updateMany({
      where: { equipamentoId: eq.id, ativa: true },
      data: { ativa: false, dataFim: new Date() }
    });

    // Criar nova vinculação
    const vinculacao = await prisma.vinculacao.create({
      data: {
        equipamentoId: eq.id,
        usuarioId: colaboradorId,
        tecnicoId: 1,
        statusEntrega: 'ENTREGUE',
        dataInicio: new Date(),
        ativa: true,
      }
    });
    
    console.log('✓ Vinculação criada com sucesso:', vinculacao.id);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

criar();
