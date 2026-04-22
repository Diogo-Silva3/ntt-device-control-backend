require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function desativar() {
  try {
    console.log('=== DESATIVANDO VINCULAÇÃO DO H45C9H4 ===\n');

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

    // Mudar status do equipamento para DISPONIVEL
    await prisma.equipamento.update({
      where: { id: vinculacao.equipamento.id },
      data: { status: 'DISPONIVEL' },
    });

    console.log('✅ Status do equipamento mudado para DISPONIVEL!\n');

    // Verificar contadores após mudança
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [emUso, disponiveis, agendados, atribuido] = await Promise.all([
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'DISPONIVEL',
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: 'Agendado para Entrega',
        },
      }),
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { projetoId: projeto.id },
        },
      }),
    ]);

    console.log('📊 CONTADORES APÓS MUDANÇA:');
    console.log(`   EM USO: ${emUso} (esperado: 34)`);
    console.log(`   DISPONÍVEIS: ${disponiveis} (esperado: 146)`);
    console.log(`   AGENDADAS: ${agendados} (esperado: 0)`);
    console.log(`   ATRIBUÍDO: ${atribuido} (esperado: 34)\n`);

    console.log('✅ DESATIVAÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

desativar();
