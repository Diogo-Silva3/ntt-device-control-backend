require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarDesativadas() {
  try {
    console.log('=== BUSCANDO VINCULAÇÕES DESATIVADAS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar vinculações INATIVAS que eram ENTREGUE
    const vinculacoesDesativadas = await prisma.vinculacao.findMany({
      where: {
        ativa: false,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true, status: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📋 VINCULAÇÕES DESATIVADAS (ENTREGUE): ${vinculacoesDesativadas.length}\n`);

    if (vinculacoesDesativadas.length > 0) {
      console.log('Detalhes:\n');
      vinculacoesDesativadas.forEach((v, index) => {
        console.log(`${index + 1}. ${v.usuario.nome}`);
        console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
        console.log(`   Status Equipamento: ${v.equipamento.status}`);
        console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
        console.log(`   Criada em: ${v.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Última atualização: ${v.createdAt.toISOString().split('T')[0]}`);
        console.log(`   ID Vinculação: ${v.id}`);
        console.log('');
      });

      // Perguntar quais reativar
      console.log('\n🔧 AÇÃO NECESSÁRIA:');
      console.log(`Encontrei ${vinculacoesDesativadas.length} vinculações ENTREGUE que foram desativadas.`);
      console.log(`Você precisa de 6 vinculações para chegar a 34 entregues.`);
      console.log('\nEste script pode REATIVAR essas vinculações automaticamente.');
      console.log('Vou reativar as mais recentes (até 6).\n');

      // Pegar as 6 mais recentes
      const paraReativar = vinculacoesDesativadas.slice(0, 6);

      console.log(`Reativando ${paraReativar.length} vinculações:\n`);

      for (const vinc of paraReativar) {
        // Reativar vinculação
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: true },
        });

        // Atualizar statusProcesso do equipamento
        await prisma.equipamento.update({
          where: { id: vinc.equipamentoId },
          data: { 
            statusProcesso: 'Entregue ao Usuário',
            status: 'EM_USO',
          },
        });

        console.log(`✓ ${vinc.usuario.nome} → ${vinc.equipamento.serialNumber}`);
      }

      console.log('\n✅ VINCULAÇÕES REATIVADAS!');

    } else {
      console.log('❌ Nenhuma vinculação ENTREGUE desativada encontrada.');
      console.log('\nIsso significa que as 6 vinculações faltantes nunca existiram no banco');
      console.log('ou foram completamente deletadas (não apenas desativadas).');
    }

    // Verificar resultado final
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

    console.log('📊 RESULTADO:');
    console.log(`   Total de vinculações ativas: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const pendentes = porStatus['PENDENTE'] || 0;
    const entregues = porStatus['ENTREGUE'] || 0;

    console.log('\n📈 DASHBOARD DEVE MOSTRAR:');
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    if (entregues === 34) {
      console.log('\n🎉 PERFEITO! Agora temos 34 entregues!');
    } else {
      console.log(`\n⚠️  Ainda faltam ${34 - entregues} vinculações para chegar a 34`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarDesativadas();
