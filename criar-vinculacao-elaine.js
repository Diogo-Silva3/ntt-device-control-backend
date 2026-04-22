require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criar() {
  try {
    console.log('=== CRIANDO VINCULAÇÃO PARA ELAINE LOPES DOS SANTOS ===\n');

    // Buscar ELAINE
    const elaine = await prisma.usuario.findFirst({
      where: { nome: { contains: 'ELAINE LOPES' } },
    });

    if (!elaine) {
      console.log('❌ ELAINE não encontrada');
      return;
    }

    console.log(`✓ Usuário: ${elaine.nome} (ID: ${elaine.id})`);

    // Buscar equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
    });

    if (!equipamento) {
      console.log('❌ Equipamento H45C9H4 não encontrado');
      return;
    }

    console.log(`✓ Equipamento: ${equipamento.serialNumber} (ID: ${equipamento.id})`);

    // Buscar técnico Pedro Severo
    const pedro = await prisma.usuario.findFirst({
      where: { nome: { contains: 'PEDRO SEVERO' } },
    });

    console.log(`✓ Técnico: ${pedro?.nome || 'N/A'} (ID: ${pedro?.id || 'N/A'})`);

    // Criar vinculação
    const vinculacao = await prisma.vinculacao.create({
      data: {
        usuarioId: elaine.id,
        equipamentoId: equipamento.id,
        tecnicoId: pedro?.id || null,
        projetoId: equipamento.projetoId,
        dataInicio: new Date(),
        ativa: true,
        statusEntrega: 'PENDENTE',
        tipoOperacao: 'Agendamento',
        observacao: 'Vinculação criada para correção - Técnico Pedro Severo',
      },
    });

    console.log(`\n✓ Vinculação criada (ID: ${vinculacao.id})`);

    // Atualizar equipamento
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log('✓ Equipamento atualizado para "Agendado para Entrega"');

    console.log('\n✅ VINCULAÇÃO CRIADA COM SUCESSO!');
    console.log('\n📊 RESULTADO:');
    console.log(`   ELAINE LOPES DOS SANTOS → H45C9H4`);
    console.log(`   Status: PENDENTE (Agendada)`);
    console.log(`   Técnico: ${pedro?.nome || 'N/A'}`);

    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criar();
