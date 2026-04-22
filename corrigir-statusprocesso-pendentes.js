require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO STATUSPROCESSO DE VINCULAÇÕES PENDENTES ===\n');

    // Buscar TODAS as vinculações PENDENTES ativas
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
      },
      include: {
        equipamento: { 
          select: { 
            id: true,
            serialNumber: true, 
            statusProcesso: true,
            projeto: { select: { nome: true } },
          } 
        },
        usuario: { select: { nome: true } },
      },
    });

    console.log(`📋 Vinculações PENDENTES encontradas: ${vinculacoesPendentes.length}\n`);

    if (vinculacoesPendentes.length === 0) {
      console.log('✓ Nenhuma vinculação PENDENTE encontrada');
      return;
    }

    console.log('Detalhes:\n');
    vinculacoesPendentes.forEach((v, index) => {
      console.log(`${index + 1}. ${v.usuario.nome}`);
      console.log(`   Projeto: ${v.equipamento.projeto.nome}`);
      console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
      console.log(`   StatusProcesso atual: ${v.equipamento.statusProcesso}`);
      console.log(`   StatusEntrega: ${v.statusEntrega}`);
      console.log('');
    });

    // Filtrar apenas os que NÃO estão como "Agendado para Entrega"
    const paraCorrigir = vinculacoesPendentes.filter(
      v => v.equipamento.statusProcesso !== 'Agendado para Entrega'
    );

    if (paraCorrigir.length === 0) {
      console.log('✓ Todos os equipamentos já estão com statusProcesso correto');
      return;
    }

    console.log(`🔧 Corrigindo ${paraCorrigir.length} equipamentos...\n`);

    for (const vinc of paraCorrigir) {
      await prisma.equipamento.update({
        where: { id: vinc.equipamento.id },
        data: { statusProcesso: 'Agendado para Entrega' },
      });

      console.log(`✓ ${vinc.equipamento.serialNumber} → "Agendado para Entrega"`);
    }

    console.log(`\n✅ ${paraCorrigir.length} equipamentos corrigidos!`);

    // Verificar resultado por projeto
    console.log('\n📊 RESULTADO POR PROJETO:\n');

    const projetos = await prisma.projeto.findMany({
      include: {
        equipamentos: {
          where: { 
            status: { not: 'DESCARTADO' },
            statusProcesso: 'Agendado para Entrega',
          },
        },
      },
    });

    for (const projeto of projetos) {
      if (projeto.equipamentos.length > 0) {
        console.log(`${projeto.nome}:`);
        console.log(`   Agendados para Entrega: ${projeto.equipamentos.length}`);
      }
    }

    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
