require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirVinculacaoTecnico() {
  try {
    console.log('=== CORRIGINDO VINCULAÇÃO DE TÉCNICO ===\n');

    // Deletar vinculação do Reidel (ID: 76)
    const vinculacaoReidel = await prisma.vinculacao.findUnique({
      where: { id: 76 },
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { serialNumber: true, id: true } },
      },
    });

    if (vinculacaoReidel) {
      console.log(`Deletando vinculação do técnico:`);
      console.log(`  ${vinculacaoReidel.usuario.nome} → ${vinculacaoReidel.equipamento.serialNumber}\n`);

      await prisma.vinculacao.delete({
        where: { id: 76 },
      });

      console.log('✓ Vinculação deletada\n');

      // Atualizar equipamento para DISPONIVEL
      await prisma.equipamento.update({
        where: { id: vinculacaoReidel.equipamento.id },
        data: {
          status: 'DISPONIVEL',
          statusProcesso: 'Softwares Instalados',
        },
      });

      console.log('✓ Equipamento liberado\n');
    }

    // Buscar projeto LAPTOP
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar um equipamento DISPONIVEL
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
        vinculacoes: { none: { ativa: true } },
      },
    });

    console.log(`✓ Equipamento: ${equipamento.serialNumber} (ID: ${equipamento.id})`);

    // Buscar um usuário COMUM (não técnico) sem vinculação ativa
    const usuario = await prisma.usuario.findFirst({
      where: {
        empresaId: projeto.empresaId,
        ativo: true,
        role: { notIn: ['TECNICO', 'ADMIN', 'SUPERADMIN'] },
        vinculacoes: { none: { ativa: true } },
      },
    });

    if (!usuario) {
      console.log('❌ Nenhum usuário comum disponível encontrado');
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

    console.log('✅ CORREÇÃO CONCLUÍDA!');
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

corrigirVinculacaoTecnico();
