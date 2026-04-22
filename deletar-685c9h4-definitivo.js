require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deletar685C9H4() {
  try {
    console.log('=== DELETANDO 685C9H4 DEFINITIVAMENTE ===\n');

    // Buscar o equipamento 685C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: '685C9H4' },
    });

    if (!equipamento) {
      console.log('❌ Equipamento 685C9H4 não encontrado');
      return;
    }

    console.log(`✓ Equipamento: ${equipamento.serialNumber} (ID: ${equipamento.id})`);
    console.log(`  Status: ${equipamento.status}`);
    console.log(`  StatusProcesso: ${equipamento.statusProcesso}\n`);

    // Buscar TODAS as vinculações desse equipamento
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { equipamentoId: equipamento.id },
      include: {
        usuario: { select: { nome: true } },
      },
    });

    console.log(`Vinculações encontradas: ${vinculacoes.length}\n`);

    // DELETAR todas as vinculações (não apenas desativar)
    for (const vinc of vinculacoes) {
      console.log(`Deletando vinculação ID ${vinc.id}:`);
      console.log(`  Usuário: ${vinc.usuario.nome}`);
      console.log(`  Status: ${vinc.statusEntrega}`);
      console.log(`  Ativa: ${vinc.ativa}`);

      await prisma.vinculacao.delete({
        where: { id: vinc.id },
      });

      console.log(`  ✓ DELETADA\n`);
    }

    // Atualizar o equipamento para DISPONIVEL
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Softwares Instalados',
        status: 'DISPONIVEL',
      },
    });

    console.log('✓ Equipamento atualizado para DISPONIVEL\n');

    console.log('✅ DELEÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletar685C9H4();
