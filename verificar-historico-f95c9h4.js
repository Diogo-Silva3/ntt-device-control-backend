const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('🔍 Verificando histórico do equipamento F95C9H4...\n');

    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        historicoEtapas: true,
        historicos: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, acao: true, descricao: true, createdAt: true }
        }
      }
    });

    if (!eq) {
      console.log('❌ Equipamento não encontrado');
      return;
    }

    console.log('📦 Equipamento:', eq.serialNumber);
    console.log('📊 Status atual:', eq.statusProcesso);
    console.log('\n📋 Histórico de etapas:');

    if (eq.historicoEtapas) {
      try {
        const etapas = JSON.parse(eq.historicoEtapas);
        if (Array.isArray(etapas)) {
          etapas.forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.de} → ${e.para} (${new Date(e.data).toLocaleString('pt-BR')})`);
          });
        }
      } catch (err) {
        console.log('   Erro ao parsear histórico');
      }
    }

    console.log('\n📝 Histórico de ações:');
    eq.historicos.forEach((h, i) => {
      console.log(`   ${i + 1}. ${h.acao} - ${h.descricao}`);
      console.log(`      ${new Date(h.createdAt).toLocaleString('pt-BR')}`);
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
