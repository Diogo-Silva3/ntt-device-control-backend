require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirDashboard() {
  try {
    console.log('=== CORREÇÃO DEFINITIVA - DASHBOARD TECH REFRESH LAPTOP 2026 ===\n');

    // 1. Buscar o projeto
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    if (!projeto) {
      console.log('❌ Projeto LAPTOP não encontrado!');
      return;
    }

    console.log(`✓ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. Buscar vinculação NAO_COMPARECEU que deveria ser PENDENTE
    const vinculacaoNaoCompareceu = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'NAO_COMPARECEU',
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
      },
    });

    console.log(`📋 Vinculações NAO_COMPARECEU encontradas: ${vinculacaoNaoCompareceu.length}\n`);

    if (vinculacaoNaoCompareceu.length > 0) {
      console.log('Detalhes:');
      vinculacaoNaoCompareceu.forEach(v => {
        console.log(`  - ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
        console.log(`    Status atual: ${v.statusEntrega}`);
        console.log(`    StatusProcesso do equipamento: ${v.equipamento.statusProcesso}`);
      });

      console.log('\n🔧 AÇÕES A SEREM EXECUTADAS:');
      console.log('  1. Alterar statusEntrega de NAO_COMPARECEU para PENDENTE');
      console.log('  2. Alterar statusProcesso do equipamento para "Agendado para Entrega"');
      console.log('\nDeseja continuar? (Este script vai executar automaticamente)\n');

      // Executar correções
      for (const vinc of vinculacaoNaoCompareceu) {
        // Atualizar vinculação para PENDENTE
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { statusEntrega: 'PENDENTE' },
        });

        // Atualizar equipamento para Agendado para Entrega
        await prisma.equipamento.update({
          where: { id: vinc.equipamentoId },
          data: { statusProcesso: 'Agendado para Entrega' },
        });

        console.log(`✓ Corrigido: ${vinc.equipamento.serialNumber} → ${vinc.usuario.nome}`);
      }

      console.log(`\n✅ ${vinculacaoNaoCompareceu.length} vinculação(ões) corrigida(s)!`);
    } else {
      console.log('✓ Nenhuma vinculação NAO_COMPARECEU encontrada');
    }

    // 3. Verificar resultado final
    console.log('\n=== VERIFICAÇÃO FINAL ===\n');

    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
    });

    const porStatus = {};
    vinculacoesAtivas.forEach(v => {
      porStatus[v.statusEntrega] = (porStatus[v.statusEntrega] || 0) + 1;
    });

    console.log('📊 RESULTADO FINAL:');
    console.log(`   Total de vinculações ativas: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const pendentes = porStatus['PENDENTE'] || 0;
    const entregues = porStatus['ENTREGUE'] || 0;

    console.log('\n📈 O DASHBOARD AGORA DEVE MOSTRAR:');
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMOS PASSOS:');
    console.log('   1. Reiniciar o backend: pm2 restart tech-refresh-backend');
    console.log('   2. Recarregar a página do dashboard');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirDashboard();
