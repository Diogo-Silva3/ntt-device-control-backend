const prisma = require('./src/config/prisma');

async function testar() {
  try {
    console.log('🔍 Testando vinculação do equipamento F95C9H4...\n');

    // Buscar equipamento
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      include: {
        vinculacoes: {
          include: { usuario: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!eq) {
      console.log('❌ Equipamento F95C9H4 não encontrado');
      return;
    }

    console.log('📦 Equipamento:', eq.serialNumber, '-', eq.marca, eq.modelo);
    console.log('📊 Status:', eq.statusProcesso);
    console.log('🔗 Vinculações:');
    
    if (eq.vinculacoes.length === 0) {
      console.log('   Nenhuma vinculação');
    } else {
      eq.vinculacoes.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.usuario?.nome} (${v.statusEntrega}) - Ativa: ${v.ativa}`);
      });
    }

    // Verificar se tem vinculação ENTREGUE ativa
    const vinculacaoEntregue = eq.vinculacoes.find(v => v.ativa && v.statusEntrega === 'ENTREGUE');
    const vinculacaoPendente = eq.vinculacoes.find(v => v.ativa && v.statusEntrega === 'PENDENTE');

    console.log('\n✅ Resultado:');
    console.log('   - Vinculação ENTREGUE ativa:', vinculacaoEntregue ? 'SIM ❌ (não deveria estar)' : 'NÃO ✓');
    console.log('   - Vinculação PENDENTE ativa:', vinculacaoPendente ? 'SIM ✓' : 'NÃO');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testar();
