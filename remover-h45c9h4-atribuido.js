require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remover() {
  try {
    console.log('=== REMOVENDO H45C9H4 DE ATRIBUÍDO ===\n');

    // Buscar a vinculação do H45C9H4
    const vinculacao = await prisma.vinculacao.findFirst({
      where: {
        equipamento: {
          serialNumber: 'H45C9H4',
        },
      },
      include: {
        equipamento: true,
        usuario: true,
      },
    });

    if (!vinculacao) {
      console.log('❌ Vinculação não encontrada!');
      return;
    }

    console.log('📋 Vinculação encontrada:');
    console.log(`   ID: ${vinculacao.id}`);
    console.log(`   Equipamento: ${vinculacao.equipamento.serialNumber}`);
    console.log(`   Usuário: ${vinculacao.usuario.nome}`);
    console.log(`   Status Entrega: ${vinculacao.statusEntrega}`);
    console.log(`   Ativa: ${vinculacao.ativa}\n`);

    // Desativar a vinculação
    await prisma.vinculacao.update({
      where: { id: vinculacao.id },
      data: { ativa: false },
    });

    console.log('✅ Vinculação desativada!\n');

    // Verificar contadores após remoção
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [totalAtribuido, totalVinculacoes] = await Promise.all([
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { projetoId: projeto.id },
        },
      }),
      prisma.vinculacao.count({
        where: {
          ativa: true,
          equipamento: { projetoId: projeto.id },
        },
      }),
    ]);

    console.log('📊 CONTADORES APÓS REMOÇÃO:');
    console.log(`   Total Atribuído (ENTREGUE): ${totalAtribuido} (deveria ser 34)`);
    console.log(`   Total Vinculações Ativas: ${totalVinculacoes} (deveria ser 34)\n`);

    console.log('✅ REMOÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

remover();
