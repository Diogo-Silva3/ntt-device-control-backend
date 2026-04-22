require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    console.log('=== DEBUG: POR QUE ATRIBUÍDO MOSTRA 35? ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Contar de diferentes formas
    const vinculacoesEntregue = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId: projeto.id },
      },
    });

    const vinculacoesAtivas = await prisma.vinculacao.count({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
    });

    const equipamentosEmUso = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: 'EM_USO',
      },
    });

    const equipamentosEntregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
      },
    });

    console.log('📊 CONTADORES:');
    console.log(`   Vinculações ENTREGUE (ativa=true): ${vinculacoesEntregue}`);
    console.log(`   Vinculações Ativas (todas): ${vinculacoesAtivas}`);
    console.log(`   Equipamentos EM_USO: ${equipamentosEmUso}`);
    console.log(`   Equipamentos statusProcesso ENTREGUE: ${equipamentosEntregues}\n`);

    // Listar todas as vinculações ativas
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            status: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { statusEntrega: 'asc' },
    });

    console.log('📋 TODAS AS VINCULAÇÕES ATIVAS:');
    todasVinculacoes.forEach((v, idx) => {
      console.log(`${idx + 1}. ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
      console.log(`   Status Entrega: ${v.statusEntrega}`);
      console.log(`   Status Equipamento: ${v.equipamento.status}\n`);
    });

    // Contar por statusEntrega
    const porStatus = await prisma.vinculacao.groupBy({
      by: ['statusEntrega'],
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
      _count: true,
    });

    console.log('📊 VINCULAÇÕES POR STATUS:');
    porStatus.forEach(s => {
      console.log(`   ${s.statusEntrega}: ${s._count}`);
    });

    console.log('\n✅ DEBUG CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
