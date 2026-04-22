require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sincronizar() {
  try {
    console.log('=== SINCRONIZANDO statusProcesso COM vinculações ===\n');
    console.log('Este script apenas sincroniza o statusProcesso dos equipamentos');
    console.log('baseado nas vinculações existentes (fonte da verdade).\n');

    // Regra: 
    // - Se equipamento tem vinculação ATIVA com statusEntrega = 'ENTREGUE' → statusProcesso = 'Entregue ao Usuário'
    // - Se equipamento tem vinculação ATIVA com statusEntrega = 'PENDENTE' → statusProcesso = 'Agendado para Entrega'
    // - Não mexe em equipamentos sem vinculação ativa

    // 1. Buscar equipamentos com vinculação ENTREGUE
    const equipamentosComVinculacaoEntregue = await prisma.equipamento.findMany({
      where: {
        vinculacoes: {
          some: {
            ativa: true,
            statusEntrega: 'ENTREGUE',
          },
        },
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          where: {
            ativa: true,
            statusEntrega: 'ENTREGUE',
          },
          select: {
            id: true,
          },
        },
      },
    });

    console.log(`Equipamentos com vinculação ENTREGUE: ${equipamentosComVinculacaoEntregue.length}`);

    // Filtrar apenas os que NÃO estão com statusProcesso correto
    const entreguesParaCorrigir = equipamentosComVinculacaoEntregue.filter(
      eq => eq.statusProcesso !== 'Entregue ao Usuário' && eq.statusProcesso !== 'Em Uso'
    );

    if (entreguesParaCorrigir.length > 0) {
      console.log(`\n→ Corrigindo ${entreguesParaCorrigir.length} equipamentos para "Entregue ao Usuário":`);
      entreguesParaCorrigir.slice(0, 5).forEach(eq => {
        console.log(`  - ${eq.serialNumber} (era: ${eq.statusProcesso})`);
      });
      if (entreguesParaCorrigir.length > 5) {
        console.log(`  ... e mais ${entreguesParaCorrigir.length - 5}`);
      }

      const resultadoEntregues = await prisma.equipamento.updateMany({
        where: {
          id: { in: entreguesParaCorrigir.map(eq => eq.id) },
        },
        data: {
          statusProcesso: 'Entregue ao Usuário',
        },
      });

      console.log(`✓ ${resultadoEntregues.count} equipamentos atualizados`);
    } else {
      console.log('✓ Todos os equipamentos ENTREGUES já estão corretos');
    }

    // 2. Buscar equipamentos com vinculação PENDENTE
    const equipamentosComVinculacaoPendente = await prisma.equipamento.findMany({
      where: {
        vinculacoes: {
          some: {
            ativa: true,
            statusEntrega: 'PENDENTE',
          },
        },
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          where: {
            ativa: true,
            statusEntrega: 'PENDENTE',
          },
          select: {
            id: true,
          },
        },
      },
    });

    console.log(`\nEquipamentos com vinculação PENDENTE: ${equipamentosComVinculacaoPendente.length}`);

    // Filtrar apenas os que NÃO estão com statusProcesso correto
    const pendentesParaCorrigir = equipamentosComVinculacaoPendente.filter(
      eq => eq.statusProcesso !== 'Agendado para Entrega'
    );

    if (pendentesParaCorrigir.length > 0) {
      console.log(`\n→ Corrigindo ${pendentesParaCorrigir.length} equipamentos para "Agendado para Entrega":`);
      pendentesParaCorrigir.slice(0, 5).forEach(eq => {
        console.log(`  - ${eq.serialNumber} (era: ${eq.statusProcesso})`);
      });
      if (pendentesParaCorrigir.length > 5) {
        console.log(`  ... e mais ${pendentesParaCorrigir.length - 5}`);
      }

      const resultadoPendentes = await prisma.equipamento.updateMany({
        where: {
          id: { in: pendentesParaCorrigir.map(eq => eq.id) },
        },
        data: {
          statusProcesso: 'Agendado para Entrega',
        },
      });

      console.log(`✓ ${resultadoPendentes.count} equipamentos atualizados`);
    } else {
      console.log('✓ Todos os equipamentos PENDENTES já estão corretos');
    }

    console.log('\n=== SINCRONIZAÇÃO CONCLUÍDA ===');
    console.log('\nAgora o dashboard deve mostrar os números corretos!');
    console.log('Recarregue a página do dashboard para ver as mudanças.');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sincronizar();
