const prisma = require('./src/config/prisma');

async function desativar() {
  try {
    console.log('🔍 Desativando vinculação ENTREGUE do equipamento F95C9H4...\n');

    // Buscar equipamento
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      select: { id: true }
    });

    if (!eq) {
      console.log('❌ Equipamento F95C9H4 não encontrado');
      return;
    }

    // Desativar vinculações ENTREGUE
    const desativadas = await prisma.vinculacao.updateMany({
      where: { 
        equipamentoId: eq.id, 
        ativa: true, 
        statusEntrega: 'ENTREGUE' 
      },
      data: { 
        ativa: false, 
        dataFim: new Date() 
      }
    });

    console.log('✅ Vinculações ENTREGUE desativadas:', desativadas.count);

    // Verificar resultado
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { equipamentoId: eq.id },
      include: { usuario: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Vinculações após desativação:');
    vinculacoes.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.usuario?.nome} (${v.statusEntrega}) - Ativa: ${v.ativa}`);
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

desativar();
