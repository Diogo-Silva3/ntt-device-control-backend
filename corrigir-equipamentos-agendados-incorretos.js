require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO EQUIPAMENTOS "Agendado para Entrega" INCORRETOS ===\n');

    // Buscar equipamentos com statusProcesso "Agendado para Entrega" mas SEM vinculação PENDENTE
    const equipamentosAgendados = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
          },
        },
      },
    });

    console.log(`Total de equipamentos com statusProcesso "Agendado para Entrega": ${equipamentosAgendados.length}\n`);

    // Filtrar apenas os que NÃO têm vinculação PENDENTE
    const equipamentosParaCorrigir = equipamentosAgendados.filter(eq => {
      const temPendente = eq.vinculacoes.some(v => v.statusEntrega === 'PENDENTE');
      return !temPendente;
    });

    if (equipamentosParaCorrigir.length === 0) {
      console.log('✓ Todos os equipamentos "Agendado para Entrega" estão corretos!');
      return;
    }

    console.log(`Corrigindo ${equipamentosParaCorrigir.length} equipamentos:\n`);

    for (const eq of equipamentosParaCorrigir) {
      const vinculacao = eq.vinculacoes[0];
      
      console.log(`- ${eq.serialNumber}`);
      
      if (vinculacao && vinculacao.statusEntrega === 'ENTREGUE') {
        // Se tem vinculação ENTREGUE, deve estar como "Entregue ao Usuário"
        await prisma.equipamento.update({
          where: { id: eq.id },
          data: { statusProcesso: 'Entregue ao Usuário' },
        });
        console.log(`  ✓ Corrigido para "Entregue ao Usuário"`);
      } else if (vinculacao && vinculacao.statusEntrega === 'NAO_COMPARECEU') {
        // Se não compareceu, volta para "Softwares Instalados"
        await prisma.equipamento.update({
          where: { id: eq.id },
          data: { statusProcesso: 'Softwares Instalados' },
        });
        console.log(`  ✓ Corrigido para "Softwares Instalados" (não compareceu)`);
      } else {
        // Sem vinculação ativa, volta para "Softwares Instalados"
        await prisma.equipamento.update({
          where: { id: eq.id },
          data: { statusProcesso: 'Softwares Instalados' },
        });
        console.log(`  ✓ Corrigido para "Softwares Instalados" (sem vinculação)`);
      }
    }

    console.log(`\n✓ ${equipamentosParaCorrigir.length} equipamentos corrigidos!`);
    console.log('\n=== CORREÇÃO CONCLUÍDA ===');
    console.log('Recarregue o dashboard para ver as mudanças.');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
