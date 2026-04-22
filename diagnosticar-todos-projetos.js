require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO DE TODOS OS PROJETOS ===\n');

    const projetos = await prisma.projeto.findMany({
      orderBy: { nome: 'asc' },
    });

    for (const projeto of projetos) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 ${projeto.nome} (ID: ${projeto.id})`);
      console.log('='.repeat(60));

      // Equipamentos por statusProcesso
      const equipamentosPorStatus = await prisma.equipamento.groupBy({
        by: ['statusProcesso'],
        where: { 
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
        },
        _count: true,
      });

      console.log('\n📦 EQUIPAMENTOS POR STATUSPROCESSO:');
      equipamentosPorStatus.forEach(s => {
        console.log(`   ${s.statusProcesso}: ${s._count}`);
      });

      // Vinculações ativas
      const vinculacoesAtivas = await prisma.vinculacao.findMany({
        where: {
          ativa: true,
          equipamento: { projetoId: projeto.id },
        },
        include: {
          equipamento: { select: { serialNumber: true, statusProcesso: true } },
          usuario: { select: { nome: true } },
        },
      });

      const porStatusEntrega = {};
      vinculacoesAtivas.forEach(v => {
        if (!porStatusEntrega[v.statusEntrega]) {
          porStatusEntrega[v.statusEntrega] = [];
        }
        porStatusEntrega[v.statusEntrega].push(v);
      });

      console.log('\n🔗 VINCULAÇÕES ATIVAS:');
      console.log(`   Total: ${vinculacoesAtivas.length}`);
      Object.keys(porStatusEntrega).forEach(status => {
        console.log(`   ${status}: ${porStatusEntrega[status].length}`);
      });

      // Equipamentos "Agendado para Entrega" SEM vinculação PENDENTE
      const agendadosSemVinculacao = await prisma.equipamento.findMany({
        where: {
          projetoId: projeto.id,
          statusProcesso: 'Agendado para Entrega',
          vinculacoes: {
            none: {
              ativa: true,
              statusEntrega: 'PENDENTE',
            },
          },
        },
        include: {
          vinculacoes: {
            where: { ativa: true },
            select: { statusEntrega: true },
          },
        },
      });

      if (agendadosSemVinculacao.length > 0) {
        console.log(`\n⚠️  EQUIPAMENTOS "AGENDADO" SEM VINCULAÇÃO PENDENTE: ${agendadosSemVinculacao.length}`);
        agendadosSemVinculacao.forEach(eq => {
          const vinc = eq.vinculacoes[0];
          console.log(`   - ${eq.serialNumber} (vinculação: ${vinc?.statusEntrega || 'nenhuma'})`);
        });
      }

      // Equipamentos "Entregue ao Usuário" SEM vinculação ENTREGUE
      const entreguesSemVinculacao = await prisma.equipamento.findMany({
        where: {
          projetoId: projeto.id,
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
          vinculacoes: {
            none: {
              ativa: true,
              statusEntrega: 'ENTREGUE',
            },
          },
        },
      });

      if (entreguesSemVinculacao.length > 0) {
        console.log(`\n⚠️  EQUIPAMENTOS "ENTREGUE" SEM VINCULAÇÃO ENTREGUE: ${entreguesSemVinculacao.length}`);
        entreguesSemVinculacao.forEach(eq => {
          console.log(`   - ${eq.serialNumber}`);
        });
      }

      // O que o dashboard DEVERIA mostrar
      const pendentes = porStatusEntrega['PENDENTE']?.length || 0;
      const entregues = porStatusEntrega['ENTREGUE']?.length || 0;

      console.log('\n📈 DASHBOARD DEVERIA MOSTRAR:');
      console.log(`   AGENDADAS: ${pendentes}`);
      console.log(`   ENTREGUES: ${entregues}`);
      console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('FIM DO DIAGNÓSTICO');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
