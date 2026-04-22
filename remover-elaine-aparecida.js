require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removerDuplicacao() {
  try {
    console.log('=== REMOVENDO VINCULAÇÃO DUPLICADA ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 1. Buscar ELAINE APARECIDA DE PAULA
    const elaineAparecida = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'ELAINE APARECIDA' },
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
          include: {
            equipamento: { select: { serialNumber: true, statusProcesso: true } },
          },
        },
      },
    });

    if (!elaineAparecida) {
      console.log('❌ ELAINE APARECIDA DE PAULA não encontrada');
      return;
    }

    console.log(`Encontrada: ${elaineAparecida.nome} (ID: ${elaineAparecida.id})`);
    console.log(`Vinculações ativas: ${elaineAparecida.vinculacoes.length}\n`);

    if (elaineAparecida.vinculacoes.length === 0) {
      console.log('✓ Não há vinculações ativas para remover');
      return;
    }

    // 2. Desativar todas as vinculações dela
    for (const vinc of elaineAparecida.vinculacoes) {
      console.log(`Desativando vinculação:`);
      console.log(`  - Equipamento: ${vinc.equipamento.serialNumber}`);
      console.log(`  - Status: ${vinc.statusEntrega}`);
      console.log(`  - ID: ${vinc.id}`);

      // Desativar vinculação
      await prisma.vinculacao.update({
        where: { id: vinc.id },
        data: { ativa: false },
      });

      // Voltar equipamento para status anterior (Softwares Instalados)
      await prisma.equipamento.update({
        where: { id: vinc.equipamentoId },
        data: { statusProcesso: 'Softwares Instalados' },
      });

      console.log(`  ✓ Vinculação desativada\n`);
    }

    // 3. Verificar ELAINE LOPES DOS SANTOS
    const elaineLopes = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'ELAINE LOPES' },
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
          include: {
            equipamento: { select: { serialNumber: true, statusProcesso: true } },
          },
        },
      },
    });

    if (elaineLopes) {
      console.log(`\n✓ ELAINE LOPES DOS SANTOS mantida:`);
      console.log(`  Nome: ${elaineLopes.nome}`);
      console.log(`  Vinculações ativas: ${elaineLopes.vinculacoes.length}`);
      elaineLopes.vinculacoes.forEach(v => {
        console.log(`    → ${v.equipamento.serialNumber} (${v.statusEntrega})`);
      });
    }

    // 4. Verificar resultado final
    console.log('\n=== VERIFICAÇÃO FINAL ===\n');

    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
    });

    const porStatus = {};
    vinculacoesAtivas.forEach(v => {
      porStatus[v.statusEntrega] = (porStatus[v.statusEntrega] || 0) + 1;
    });

    console.log('📊 RESULTADO:');
    console.log(`   Total de vinculações ativas: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const pendentes = porStatus['PENDENTE'] || 0;
    const entregues = porStatus['ENTREGUE'] || 0;

    console.log('\n📈 DASHBOARD DEVE MOSTRAR:');
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    console.log('\n✅ CORREÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removerDuplicacao();
