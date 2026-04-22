require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deletar() {
  try {
    console.log('=== DELETANDO VINCULAÇÃO DA ADRIANA (TÉCNICO DIOGO) ===\n');

    // Buscar ADRIANA MAIA DE MORAIS
    const adriana = await prisma.usuario.findFirst({
      where: { nome: { contains: 'ADRIANA MAIA' } },
    });

    if (!adriana) {
      console.log('❌ ADRIANA não encontrada');
      return;
    }

    console.log(`✓ Usuário: ${adriana.nome} (ID: ${adriana.id})`);

    // Buscar técnico Diogo
    const diogo = await prisma.usuario.findFirst({
      where: { nome: { contains: 'DIEGO' } },
    });

    console.log(`✓ Técnico: ${diogo?.nome || 'N/A'} (ID: ${diogo?.id || 'N/A'})`);

    // Buscar vinculação da ADRIANA com técnico Diogo
    const vinculacao = await prisma.vinculacao.findFirst({
      where: {
        usuarioId: adriana.id,
        tecnicoId: diogo?.id,
        ativa: true,
        equipamento: {
          projeto: { nome: { contains: 'LAPTOP' } },
        },
      },
      include: {
        equipamento: { select: { serialNumber: true } },
      },
    });

    if (!vinculacao) {
      console.log('❌ Vinculação não encontrada');
      return;
    }

    console.log(`\n✓ Vinculação encontrada (ID: ${vinculacao.id})`);
    console.log(`  Equipamento: ${vinculacao.equipamento.serialNumber}`);
    console.log(`  Status: ${vinculacao.statusEntrega}`);

    // Desativar vinculação
    await prisma.vinculacao.update({
      where: { id: vinculacao.id },
      data: { ativa: false },
    });

    console.log('\n✓ Vinculação desativada');

    // Atualizar equipamento para "Softwares Instalados"
    await prisma.equipamento.update({
      where: { id: vinculacao.equipamentoId },
      data: {
        statusProcesso: 'Softwares Instalados',
        status: 'DISPONIVEL',
      },
    });

    console.log('✓ Equipamento atualizado para "Softwares Instalados"');

    console.log('\n✅ VINCULAÇÃO DELETADA COM SUCESSO!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deletar();
