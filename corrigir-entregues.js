const prisma = require('./src/config/prisma');

async function corrigirEntregues() {
  try {
    console.log('\n🔧 CORRIGINDO EQUIPAMENTOS JÁ ENTREGUES...\n');

    // Equipamentos a corrigir
    const seriais = ['695C9H4', 'H45C9H4'];

    for (const serial of seriais) {
      console.log(`🔄 Processando ${serial}...`);

      // Buscar equipamento
      const eq = await prisma.equipamento.findFirst({
        where: { serialNumber: serial },
        include: { vinculacoes: { where: { ativa: true } } }
      });

      if (!eq) {
        console.log(`⚠️  Equipamento com serial ${serial} não encontrado\n`);
        continue;
      }

      // Atualizar equipamento
      await prisma.equipamento.update({
        where: { id: eq.id },
        data: {
          statusProcesso: 'Entregue ao Usuário',
          status: 'EM_USO'
        }
      });

      console.log(`✅ Equipamento atualizado: statusProcesso = "Entregue ao Usuário"\n`);

      // Atualizar Atribuição
      if (eq.vinculacoes.length > 0) {
        for (const vinc of eq.vinculacoes) {
          await prisma.vinculacao.update({
            where: { id: vinc.id },
            data: { statusEntrega: 'ENTREGUE' }
          });
          console.log(`✅ Atribuição atualizada: statusEntrega = "ENTREGUE"\n`);
        }
      }
    }

    console.log('✅ Todos os equipamentos foram corrigidos!\n');

  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirEntregues();
