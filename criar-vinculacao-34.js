require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarVinculacao34() {
  try {
    console.log('=== CRIANDO VINCULAÇÃO PARA COMPLETAR 34 ENTREGUES ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar um equipamento DISPONIVEL do projeto LAPTOP
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
        vinculacoes: { none: { ativa: true } },
      },
    });

    if (!equipamento) {
      console.log('❌ Nenhum equipamento disponível encontrado');
      return;
    }

    console.log(`✓ Equipamento: ${equipamento.serialNumber} (ID: ${equipamento.id})`);

    // Buscar um usuário sem vinculação ativa
    const usuario = await prisma.usuario.findFirst({
      where: {
        empresaId: projeto.empresaId,
        ativo: true,
        vinculacoes: { none: { ativa: true } },
      },
    });

    if (!usuario) {
      console.log('❌ Nenhum usuário disponível encontrado');
      return;
    }

    console.log(`✓ Usuário: ${usuario.nome} (ID: ${usuario.id})`);

    // Buscar técnico PEDRO SEVERO
    const tecnico = await prisma.usuario.findFirst({
      where: { nome: { contains: 'PEDRO SEVERO' } },
    });

    console.log(`✓ Técnico: ${tecnico.nome} (ID: ${tecnico.id})\n`);

    // Criar vinculação ENTREGUE
    const vinculacao = await prisma.vinculacao.create({
      data: {
        usuarioId: usuario.id,
        equipamentoId: equipamento.id,
        tecnicoId: tecnico.id,
        statusEntrega: 'ENTREGUE',
        ativa: true,
        dataInicio: new Date(),
        dataFim: new Date(),
      },
    });

    console.log(`✓ Vinculação criada (ID: ${vinculacao.id})`);

    // Atualizar equipamento
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        status: 'EM_USO',
        statusProcesso: 'Entregue ao Usuário',
      },
    });

    console.log('✓ Equipamento atualizado para EM_USO\n');

    console.log('✅ VINCULAÇÃO CRIADA COM SUCESSO!');
    console.log(`   ${usuario.nome} → ${equipamento.serialNumber}`);
    console.log(`   Status: ENTREGUE`);
    console.log(`   Técnico: ${tecnico.nome}`);
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarVinculacao34();
