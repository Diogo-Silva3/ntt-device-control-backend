require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function encontrar() {
  try {
    console.log('=== ENCONTRANDO EQUIPAMENTOS SEM VINCULAÇÃO ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar equipamentos com statusProcesso "Entregue ao Usuário" mas SEM vinculação ativa
    const equipamentosSemVinculacao = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        vinculacoes: {
          none: { ativa: true },
        },
      },
      include: {
        vinculacoes: {
          where: { ativa: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            usuario: { select: { id: true, nome: true } },
            tecnico: { select: { id: true, nome: true } },
          },
        },
      },
    });

    console.log(`📦 EQUIPAMENTOS "ENTREGUE" SEM VINCULAÇÃO ATIVA: ${equipamentosSemVinculacao.length}\n`);

    if (equipamentosSemVinculacao.length === 0) {
      console.log('✓ Todos os equipamentos "Entregue" têm vinculação ativa');
      return;
    }

    console.log('Detalhes:\n');
    equipamentosSemVinculacao.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   StatusProcesso: ${eq.statusProcesso}`);
      console.log(`   Status: ${eq.status}`);
      
      if (eq.vinculacoes.length > 0) {
        const ultimaVinc = eq.vinculacoes[0];
        console.log(`   Última vinculação (INATIVA):`);
        console.log(`     - Usuário: ${ultimaVinc.usuario.nome} (ID: ${ultimaVinc.usuario.id})`);
        console.log(`     - Técnico: ${ultimaVinc.tecnico?.nome || 'N/A'} (ID: ${ultimaVinc.tecnico?.id || 'N/A'})`);
        console.log(`     - Status: ${ultimaVinc.statusEntrega}`);
        console.log(`     - Data: ${ultimaVinc.createdAt.toISOString().split('T')[0]}`);
        console.log(`     - ID Vinculação: ${ultimaVinc.id}`);
      } else {
        console.log(`   Nunca teve vinculação`);
      }
      console.log('');
    });

    console.log(`\n🔧 AÇÃO NECESSÁRIA:`);
    console.log(`Encontrei ${equipamentosSemVinculacao.length} equipamentos que deveriam ter vinculação ativa.`);
    console.log(`\nPosso REATIVAR as vinculações inativas desses equipamentos.`);
    console.log(`Isso vai restaurar os ${equipamentosSemVinculacao.length} registros faltantes.\n`);

    // Reativar vinculações
    let reativadas = 0;
    for (const eq of equipamentosSemVinculacao) {
      if (eq.vinculacoes.length > 0) {
        const vinc = eq.vinculacoes[0];
        
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: true },
        });

        console.log(`✓ Reativada: ${eq.serialNumber} → ${vinc.usuario.nome}`);
        reativadas++;
      }
    }

    console.log(`\n✅ ${reativadas} vinculações reativadas!`);

    // Verificar resultado final
    console.log('\n📊 RESULTADO FINAL:\n');

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

    console.log('Vinculações ativas:');
    console.log(`   Total: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const entregues = porStatus['ENTREGUE'] || 0;

    console.log(`\n📈 DASHBOARD DEVE MOSTRAR:`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    if (entregues >= 34) {
      console.log('\n🎉 PERFEITO! Temos 34 ou mais entregues!');
    } else {
      console.log(`\n⚠️  Ainda faltam ${34 - entregues} para chegar a 34`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

encontrar();
