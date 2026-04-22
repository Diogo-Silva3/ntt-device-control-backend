require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mudar() {
  try {
    console.log('=== MUDANDO STATUS ENTREGA DO H45C9H4 ===\n');

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
    console.log(`   Status Entrega ANTES: ${vinculacao.statusEntrega}\n`);

    // Mudar statusEntrega de PENDENTE para NAO_COMPARECEU (ou outro que não seja ENTREGUE)
    await prisma.vinculacao.update({
      where: { id: vinculacao.id },
      data: { statusEntrega: 'NAO_COMPARECEU' },
    });

    console.log('✅ Status Entrega mudado para NAO_COMPARECEU!\n');

    // Verificar contadores após mudança
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [totalAtribuido, agendados, naoCompareceu] = await Promise.all([
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { projetoId: projeto.id },
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
          statusEntrega: 'NAO_COMPARECEU',
          equipamento: { projetoId: projeto.id },
        },
      }),
    ]);

    console.log('📊 CONTADORES APÓS MUDANÇA:');
    console.log(`   Total Atribuído (ENTREGUE): ${totalAtribuido} (deveria ser 34)`);
    console.log(`   Agendados: ${agendados} (deveria ser 1)`);
    console.log(`   Não Compareceu: ${naoCompareceu} (deveria ser 1)\n`);

    console.log('✅ MUDANÇA CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mudar();
