require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forcarRemocao() {
  try {
    console.log('=== FORÇANDO REMOÇÃO DA ADRIANA ===\n');

    // Buscar TODAS as vinculações da ADRIANA MAIA DE MORAIS (ativas e inativas)
    const adriana = await prisma.usuario.findFirst({
      where: { nome: { contains: 'ADRIANA MAIA' } },
    });

    if (!adriana) {
      console.log('❌ ADRIANA não encontrada');
      return;
    }

    console.log(`✓ Usuário: ${adriana.nome} (ID: ${adriana.id})`);

    // Buscar TODAS as vinculações dela no projeto LAPTOP
    const vinculacoes = await prisma.vinculacao.findMany({
      where: {
        usuarioId: adriana.id,
        equipamento: {
          projeto: { nome: { contains: 'LAPTOP' } },
        },
      },
      include: {
        equipamento: { select: { serialNumber: true } },
      },
    });

    console.log(`\nVinculações encontradas: ${vinculacoes.length}\n`);

    if (vinculacoes.length === 0) {
      console.log('❌ Nenhuma vinculação encontrada');
      return;
    }

    for (const vinc of vinculacoes) {
      console.log(`Vinculação ID ${vinc.id}:`);
      console.log(`  Equipamento: ${vinc.equipamento.serialNumber}`);
      console.log(`  Status: ${vinc.statusEntrega}`);
      console.log(`  Ativa: ${vinc.ativa}`);

      if (vinc.ativa) {
        // Desativar
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: false },
        });
        console.log(`  ✓ DESATIVADA`);

        // Atualizar equipamento
        await prisma.equipamento.update({
          where: { id: vinc.equipamentoId },
          data: {
            statusProcesso: 'Softwares Instalados',
            status: 'DISPONIVEL',
          },
        });
        console.log(`  ✓ Equipamento atualizado`);
      } else {
        console.log(`  - Já estava inativa`);
      }
      console.log('');
    }

    console.log('✅ REMOÇÃO FORÇADA CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forcarRemocao();
