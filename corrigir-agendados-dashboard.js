require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== Corrigindo equipamentos agendados ===\n');

    // 1. Buscar equipamentos com vinculação PENDENTE que NÃO estão com statusProcesso correto
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
      },
      select: {
        equipamentoId: true,
        equipamento: {
          select: {
            id: true,
            serialNumber: true,
            statusProcesso: true,
          },
        },
      },
    });

    console.log(`Total de vinculações PENDENTES: ${vinculacoesPendentes.length}\n`);

    // Filtrar apenas os que NÃO estão com statusProcesso correto
    const equipamentosParaCorrigir = vinculacoesPendentes.filter(v => 
      v.equipamento && 
      v.equipamento.statusProcesso !== 'Agendado para Entrega' &&
      v.equipamento.statusProcesso !== 'Entregue ao Usuário' &&
      v.equipamento.statusProcesso !== 'Em Uso'
    );

    console.log(`Equipamentos que precisam correção: ${equipamentosParaCorrigir.length}\n`);

    if (equipamentosParaCorrigir.length === 0) {
      console.log('✓ Nenhum equipamento precisa de correção!');
      return;
    }

    // Mostrar quais serão corrigidos
    console.log('Equipamentos que serão corrigidos:');
    equipamentosParaCorrigir.forEach(v => {
      console.log(`- ${v.equipamento.serialNumber} (statusProcesso atual: ${v.equipamento.statusProcesso})`);
    });

    console.log('\n');

    // 2. Corrigir os equipamentos
    const ids = equipamentosParaCorrigir.map(v => v.equipamento.id);

    const resultado = await prisma.equipamento.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log(`\n✓ ${resultado.count} equipamentos corrigidos para "Agendado para Entrega"`);

    // 3. Verificar se há equipamentos com statusProcesso "Agendado para Entrega" mas SEM vinculação PENDENTE
    const equipamentosAgendados = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
            statusEntrega: 'PENDENTE',
          },
        },
      },
    });

    const equipamentosSemVinculacao = equipamentosAgendados.filter(eq => eq.vinculacoes.length === 0);

    if (equipamentosSemVinculacao.length > 0) {
      console.log(`\n⚠️  Atenção: ${equipamentosSemVinculacao.length} equipamentos estão como "Agendado para Entrega" mas NÃO têm vinculação PENDENTE:`);
      equipamentosSemVinculacao.forEach(eq => {
        console.log(`- ${eq.serialNumber}`);
      });
      console.log('\nEsses equipamentos podem precisar de revisão manual.');
    }

    console.log('\n=== Correção concluída ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
