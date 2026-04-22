require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function remover() {
  try {
    console.log('=== REMOVENDO 685C9H4 DOS AGENDADOS ===\n');

    // Buscar equipamento 685C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        serialNumber: '685C9H4',
      },
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

    console.log(`✓ Equipamento encontrado: ${equipamento.serialNumber}`);
    console.log(`  StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`  Status: ${equipamento.status}`);
    console.log(`  Vinculações ativas: ${equipamento.vinculacoes.length}\n`);

    if (equipamento.vinculacoes.length > 0) {
      console.log('Vinculações ativas:');
      equipamento.vinculacoes.forEach(v => {
        console.log(`  - Usuário: ${v.usuario.nome}`);
        console.log(`    Status: ${v.statusEntrega}`);
        console.log(`    ID: ${v.id}`);
      });
      console.log('');

      // Desativar todas as vinculações
      for (const vinc of equipamento.vinculacoes) {
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: false },
        });
        console.log(`✓ Vinculação ${vinc.id} desativada`);
      }
    }

    // Atualizar statusProcesso do equipamento para "Softwares Instalados"
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Softwares Instalados',
        status: 'DISPONIVEL',
      },
    });

    console.log(`\n✓ Equipamento 685C9H4 atualizado:`);
    console.log(`  StatusProcesso: Softwares Instalados`);
    console.log(`  Status: DISPONIVEL`);

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
