require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpar() {
  try {
    console.log('=== LIMPANDO AGENDADOS - DEIXAR APENAS ELAINE ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar ELAINE
    const elaine = await prisma.usuario.findFirst({
      where: { nome: { contains: 'ELAINE LOPES' } },
    });

    console.log(`✓ ELAINE LOPES DOS SANTOS (ID: ${elaine.id})\n`);

    // Buscar TODAS as vinculações PENDENTE do projeto
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: { projetoId: projeto.id },
      },
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { serialNumber: true } },
      },
    });

    console.log(`📋 Vinculações PENDENTE encontradas: ${vinculacoesPendentes.length}\n`);

    vinculacoesPendentes.forEach((v, index) => {
      console.log(`${index + 1}. ${v.usuario.nome} → ${v.equipamento.serialNumber} (ID: ${v.id})`);
    });

    // Filtrar as que NÃO são da ELAINE
    const paraRemover = vinculacoesPendentes.filter(v => v.usuarioId !== elaine.id);

    if (paraRemover.length === 0) {
      console.log('\n✓ Apenas a ELAINE tem vinculação PENDENTE - está correto!');
    } else {
      console.log(`\n⚠️  ${paraRemover.length} vinculações PENDENTE que NÃO são da ELAINE:\n`);

      for (const vinc of paraRemover) {
        console.log(`Removendo: ${vinc.usuario.nome} → ${vinc.equipamento.serialNumber}`);

        // Desativar vinculação
        await prisma.vinculacao.update({
          where: { id: vinc.id },
          data: { ativa: false },
        });

        // Atualizar equipamento
        await prisma.equipamento.update({
          where: { id: vinc.equipamentoId },
          data: {
            statusProcesso: 'Softwares Instalados',
          },
        });

        console.log('  ✓ Removida\n');
      }

      console.log(`✅ ${paraRemover.length} vinculações removidas!`);
    }

    // Verificar resultado final
    console.log('\n=== RESULTADO FINAL ===\n');

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

    console.log('Vinculações ativas:');
    console.log(`   Total: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const pendentes = porStatus['PENDENTE'] || 0;
    const entregues = porStatus['ENTREGUE'] || 0;

    console.log(`\n📈 DASHBOARD DEVE MOSTRAR:`);
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    console.log('\n✅ LIMPEZA CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpar();
