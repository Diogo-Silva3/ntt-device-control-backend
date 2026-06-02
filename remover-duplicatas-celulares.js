const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removerDuplicatas() {
  try {
    console.log('🔍 Removendo duplicatas de celulares...\n');

    // 1. Encontrar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. Encontrar as duplicatas
    const duplicatas = ['358680812643465', '358680812645577'];

    console.log('🔍 Analisando duplicatas:\n');

    for (const serial of duplicatas) {
      const equipamentos = await prisma.equipamento.findMany({
        where: {
          serialNumber: serial,
          projetoId: projeto.id
        },
        include: {
          unidade: true,
          tecnico: true,
          vinculacoes: true
        }
      });

      console.log(`Serial: ${serial}`);
      console.log(`Encontradas ${equipamentos.length} cópias:\n`);

      equipamentos.forEach((eq, index) => {
        console.log(`${index + 1}. ID: ${eq.id}`);
        console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
        console.log(`   Status: ${eq.status}`);
        console.log(`   Status Processo: ${eq.statusProcesso}`);
        console.log(`   Técnico: ${eq.tecnico?.nome || 'N/A'}`);
        console.log(`   Vinculações: ${eq.vinculacoes.length}`);
        console.log('');
      });

      // Manter a primeira, deletar as outras
      if (equipamentos.length > 1) {
        console.log(`⚠️  Mantendo: ID ${equipamentos[0].id} (${equipamentos[0].unidade?.nome})`);
        console.log(`❌ Deletando: ${equipamentos.slice(1).map(e => `ID ${e.id} (${e.unidade?.nome})`).join(', ')}\n`);

        // Deletar as duplicatas (mantém a primeira)
        for (let i = 1; i < equipamentos.length; i++) {
          const eq = equipamentos[i];
          
          // Primeiro, deletar vinculações
          if (eq.vinculacoes.length > 0) {
            await prisma.vinculacao.deleteMany({
              where: { equipamentoId: eq.id }
            });
            console.log(`   ✓ Deletadas ${eq.vinculacoes.length} vinculações do ID ${eq.id}`);
          }

          // Deletar históricos
          await prisma.historico.deleteMany({
            where: { equipamentoId: eq.id }
          });
          console.log(`   ✓ Deletados históricos do ID ${eq.id}`);

          // Deletar histórico de localização
          await prisma.historicoLocalizacao.deleteMany({
            where: { equipamentoId: eq.id }
          });
          console.log(`   ✓ Deletado histórico de localização do ID ${eq.id}`);

          // Deletar chamados
          await prisma.chamado.deleteMany({
            where: { equipamentoId: eq.id }
          });
          console.log(`   ✓ Deletados chamados do ID ${eq.id}`);

          // Deletar solicitações
          await prisma.solicitacaoAtivo.deleteMany({
            where: { equipamentoId: eq.id }
          });
          console.log(`   ✓ Deletadas solicitações do ID ${eq.id}`);

          // Depois, deletar o equipamento
          await prisma.equipamento.delete({
            where: { id: eq.id }
          });
          console.log(`   ✓ Deletado equipamento ID ${eq.id}\n`);
        }
      }
    }

    console.log('✅ DUPLICATAS REMOVIDAS!\n');

    // 3. Verificar resultado final
    console.log('📊 Verificação final:\n');

    const faltamEntregar = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      }
    });

    const disponivel = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      }
    });

    const entregue = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    console.log(`Faltam Entregar: ${faltamEntregar}`);
    console.log(`Disponível: ${disponivel}`);
    console.log(`Entregue: ${entregue}`);
    console.log(`Total: ${faltamEntregar + disponivel + entregue}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

removerDuplicatas();
