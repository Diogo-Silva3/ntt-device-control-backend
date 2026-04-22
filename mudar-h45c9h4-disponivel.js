require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mudar() {
  try {
    console.log('=== MUDANDO H45C9H4 DE EM_USO PARA DISPONIVEL ===\n');

    // Buscar o equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: { usuario: true },
        },
      },
    });

    if (!equipamento) {
      console.log('❌ Equipamento não encontrado!');
      return;
    }

    console.log('📋 Equipamento encontrado:');
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Status ANTES: ${equipamento.status}`);
    console.log(`   StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`   Vinculações ativas: ${equipamento.vinculacoes.length}\n`);

    // Mudar status para DISPONIVEL
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { status: 'DISPONIVEL' },
    });

    console.log('✅ Status mudado para DISPONIVEL!\n');

    // Verificar contadores após mudança
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [emUso, disponiveis, totalAtribuido] = await Promise.all([
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'EM_USO',
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'DISPONIVEL',
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
    console.log(`   Em Uso: ${emUso} (deveria ser 34)`);
    console.log(`   Disponíveis: ${disponiveis} (deveria ser 146)`);
    console.log(`   Total Atribuído (ENTREGUE): ${totalAtribuido} (deveria ser 34)\n`);

    console.log('✅ MUDANÇA CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mudar();
