require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remover() {
  try {
    console.log('=== REMOVENDO 685C9H4 DOS AGENDADOS (DEFINITIVO) ===\n');

    // Buscar equipamento 685C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: '685C9H4' },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: { select: { nome: true } },
          },
        },
      },
    });

    if (!equipamento) {
      console.log('❌ Equipamento 685C9H4 não encontrado');
      return;
    }

    console.log(`✓ Equipamento: ${equipamento.serialNumber} (ID: ${equipamento.id})`);
    console.log(`  StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`  Vinculações ativas: ${equipamento.vinculacoes.length}\n`);

    // Desativar todas as vinculações
    if (equipamento.vinculacoes.length > 0) {
      for (const vinc of equipamento.vinculacoes) {
        console.log(`Desativando vinculação ID ${vinc.id}:`);
        console.log(`  Usuário: ${vinc.usuario.nome}`);
        console.log(`  Status: ${vinc.statusEntrega}`);

        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: false },
        });

        console.log('  ✓ Desativada\n');
      }
    }

    // Atualizar equipamento
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Softwares Instalados',
        status: 'DISPONIVEL',
      },
    });

    console.log('✓ Equipamento 685C9H4 atualizado:');
    console.log('  StatusProcesso: Softwares Instalados');
    console.log('  Status: DISPONIVEL');

    console.log('\n✅ REMOÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

remover();
