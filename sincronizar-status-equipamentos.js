require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sincronizar() {
  try {
    console.log('=== SINCRONIZANDO STATUS DOS EQUIPAMENTOS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar todas as vinculações ENTREGUES ativas
    const vinculacoesEntregues = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { id: true, serialNumber: true, statusProcesso: true } },
      },
    });

    console.log(`Vinculações ENTREGUES: ${vinculacoesEntregues.length}\n`);

    let atualizados = 0;

    for (const vinc of vinculacoesEntregues) {
      if (vinc.equipamento.statusProcesso !== 'Entregue ao Usuário') {
        console.log(`Atualizando ${vinc.equipamento.serialNumber}:`);
        console.log(`  De: ${vinc.equipamento.statusProcesso}`);
        console.log(`  Para: Entregue ao Usuário`);

        await prisma.equipamento.update({
          where: { id: vinc.equipamento.id },
          data: {
            statusProcesso: 'Entregue ao Usuário',
            status: 'EM_USO',
          },
        });

        atualizados++;
        console.log(`  ✓ Atualizado\n`);
      }
    }

    console.log(`\n✅ SINCRONIZAÇÃO CONCLUÍDA!`);
    console.log(`   ${atualizados} equipamentos atualizados`);
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sincronizar();
