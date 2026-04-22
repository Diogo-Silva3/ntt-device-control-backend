require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reativar() {
  try {
    console.log('=== REATIVANDO H45C9H4 CORRETAMENTE ===\n');

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
    console.log(`   Status Entrega ANTES: ${vinculacao.statusEntrega}`);
    console.log(`   Ativa ANTES: ${vinculacao.ativa}\n`);

    // Reativar a vinculação e garantir que é PENDENTE
    await prisma.vinculacao.update({
      where: { id: vinculacao.id },
      data: { 
        ativa: true,
        statusEntrega: 'PENDENTE',
      },
    });

    console.log('✅ Vinculação reativada com statusEntrega PENDENTE!\n');

    // Mudar status do equipamento para EM_USO
    await prisma.equipamento.update({
      where: { id: vinculacao.equipamento.id },
      data: { status: 'EM_USO' },
    });

    console.log('✅ Status do equipamento mudado para EM_USO!\n');

    // Verificar contadores após mudança
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [emUso, disponiveis, agendados, atribuido, faltamEntregar] = await Promise.all([
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
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'DISPONIVEL',
        },
      }),
    ]);

    console.log('📊 CONTADORES APÓS MUDANÇA:');
    console.log(`   EM USO: ${emUso} (esperado: 34) ${emUso === 34 ? '✅' : '❌'}`);
    console.log(`   DISPONÍVEIS: ${disponiveis} (esperado: 145) ${disponiveis === 145 ? '✅' : '❌'}`);
    console.log(`   AGENDADAS: ${agendados} (esperado: 1) ${agendados === 1 ? '✅' : '❌'}`);
    console.log(`   ATRIBUÍDO: ${atribuido} (esperado: 34) ${atribuido === 34 ? '✅' : '❌'}`);
    console.log(`   FALTAM ENTREGAR: ${faltamEntregar} (esperado: 145) ${faltamEntregar === 145 ? '✅' : '❌'}\n`);

    console.log('✅ REATIVAÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reativar();
