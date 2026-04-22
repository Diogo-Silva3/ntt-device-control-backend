require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigar() {
  try {
    console.log('=== INVESTIGANDO VINCULAÇÕES FALTANTES ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 1. Buscar TODAS as vinculações (ativas e inativas)
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 TOTAL DE VINCULAÇÕES (ativas + inativas): ${todasVinculacoes.length}\n`);

    // Agrupar por status
    const porStatus = {};
    const porAtiva = { ativas: [], inativas: [] };

    todasVinculacoes.forEach(v => {
      if (!porStatus[v.statusEntrega]) {
        porStatus[v.statusEntrega] = [];
      }
      porStatus[v.statusEntrega].push(v);

      if (v.ativa) {
        porAtiva.ativas.push(v);
      } else {
        porAtiva.inativas.push(v);
      }
    });

    console.log('Por Status de Entrega:');
    Object.keys(porStatus).forEach(status => {
      console.log(`  ${status}: ${porStatus[status].length}`);
    });

    console.log(`\nPor Ativa:`);
    console.log(`  Ativas: ${porAtiva.ativas.length}`);
    console.log(`  Inativas: ${porAtiva.inativas.length}`);

    // 2. Mostrar vinculações INATIVAS que eram ENTREGUE
    const inativasEntregues = todasVinculacoes.filter(v => !v.ativa && v.statusEntrega === 'ENTREGUE');

    if (inativasEntregues.length > 0) {
      console.log(`\n⚠️  VINCULAÇÕES INATIVAS QUE ERAM ENTREGUE: ${inativasEntregues.length}`);
      inativasEntregues.forEach(v => {
        console.log(`  - ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
        console.log(`    ID: ${v.id}, Criada em: ${v.createdAt.toISOString().split('T')[0]}`);
      });
    }

    // 3. Buscar equipamentos do projeto SEM vinculação ativa
    const equipamentosSemVinculacao = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          none: { ativa: true },
        },
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        status: true,
        vinculacoes: {
          where: { ativa: false },
          select: {
            id: true,
            statusEntrega: true,
            createdAt: true,
            usuario: { select: { nome: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`\n📦 EQUIPAMENTOS SEM VINCULAÇÃO ATIVA: ${equipamentosSemVinculacao.length}`);
    
    if (equipamentosSemVinculacao.length > 0) {
      console.log('\nDetalhes:');
      equipamentosSemVinculacao.slice(0, 10).forEach(eq => {
        const ultimaVinc = eq.vinculacoes[0];
        console.log(`  - ${eq.serialNumber} (statusProcesso: ${eq.statusProcesso})`);
        if (ultimaVinc) {
          console.log(`    Última vinculação: ${ultimaVinc.usuario.nome} (${ultimaVinc.statusEntrega}) - desativada`);
        } else {
          console.log(`    Nunca teve vinculação`);
        }
      });
      if (equipamentosSemVinculacao.length > 10) {
        console.log(`  ... e mais ${equipamentosSemVinculacao.length - 10}`);
      }
    }

    // 4. Verificar histórico de vinculações (se existir tabela de auditoria)
    try {
      const historicoVinculacoes = await prisma.$queryRaw`
        SELECT COUNT(*) as total 
        FROM vinculacao_history 
        WHERE "equipamentoId" IN (
          SELECT id FROM equipamento WHERE "projetoId" = ${projeto.id}
        )
      `;
      console.log(`\n📜 Registros no histórico: ${historicoVinculacoes[0]?.total || 0}`);
    } catch (e) {
      console.log('\n📜 Tabela de histórico não existe');
    }

    // 5. RESUMO
    console.log('\n=== RESUMO ===');
    console.log(`Total de vinculações no banco: ${todasVinculacoes.length}`);
    console.log(`Vinculações ATIVAS: ${porAtiva.ativas.length}`);
    console.log(`Vinculações INATIVAS: ${porAtiva.inativas.length}`);
    console.log(`\nVinculações ativas ENTREGUE: ${porStatus['ENTREGUE']?.filter(v => v.ativa).length || 0}`);
    console.log(`Vinculações ativas PENDENTE: ${porStatus['PENDENTE']?.filter(v => v.ativa).length || 0}`);
    console.log(`\n⚠️  FALTAM: ${34 - porAtiva.ativas.length} vinculações para chegar a 34`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigar();
