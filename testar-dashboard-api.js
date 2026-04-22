require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testarDashboard() {
  try {
    console.log('=== TESTANDO CÁLCULO DO DASHBOARD ===\n');

    const empresaId = 1;
    const projetoId = 1; // TECH REFRESH LAPTOP 2026
    const unidadeFiltro = null;

    console.log(`Empresa ID: ${empresaId}`);
    console.log(`Projeto ID: ${projetoId}`);
    console.log(`Unidade Filtro: ${unidadeFiltro}\n`);

    // Simular o cálculo do totalAtribuido
    const totalAtribuido = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        ...(projetoId && { equipamento: { projetoId } }),
        usuario: { empresaId, ...(unidadeFiltro && { unidadeId: unidadeFiltro }) },
      },
    });

    console.log(`✅ TOTAL ATRIBUÍDO (ENTREGUES): ${totalAtribuido}`);

    // Verificar se está filtrando corretamente
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId },
        usuario: { empresaId },
      },
      include: {
        usuario: { select: { nome: true, empresaId: true } },
        equipamento: { select: { serialNumber: true, projetoId: true } },
      },
    });

    console.log(`\nVinculações encontradas: ${todasVinculacoes.length}\n`);

    todasVinculacoes.slice(0, 5).forEach(v => {
      console.log(`  - ${v.usuario.nome} → ${v.equipamento.serialNumber}`);
      console.log(`    Empresa: ${v.usuario.empresaId}, Projeto: ${v.equipamento.projetoId}`);
    });

    if (todasVinculacoes.length > 5) {
      console.log(`  ... e mais ${todasVinculacoes.length - 5} vinculações`);
    }

    console.log('\n✅ TESTE CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarDashboard();
