const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function corrigir() {
  try {
    console.log('🔄 Corrigindo status dos equipamentos agendados...\n');

    // Encontrar projeto
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'CELULAR', mode: 'insensitive' } }
    });

    if (!projeto) {
      console.log('❌ Projeto não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Encontrar equipamentos agendados com status DISPONIVEL
    const agendados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
        status: 'DISPONIVEL'
      }
    });

    console.log(`📊 Equipamentos agendados com status DISPONIVEL: ${agendados.length}\n`);

    if (agendados.length === 0) {
      console.log('✅ Nenhum equipamento para corrigir');
      await prisma.$disconnect();
      return;
    }

    // Atualizar status para EM_USO (ou outro status apropriado)
    // Na verdade, vamos manter DISPONIVEL mas o dashboard precisa olhar para statusProcesso
    // Vamos apenas confirmar que estão corretos

    console.log('📋 Amostra de equipamentos agendados:\n');
    agendados.slice(0, 5).forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   Status Processo: ${eq.statusProcesso}`);
      console.log('');
    });

    console.log(`\n⚠️  PROBLEMA IDENTIFICADO:`);
    console.log(`   Os ${agendados.length} equipamentos agendados têm:`);
    console.log(`   - status: DISPONIVEL`);
    console.log(`   - statusProcesso: Agendado para Entrega`);
    console.log(`\n   O dashboard está contando como "Disponível" porque olha para o status.`);
    console.log(`   Mas deveriam estar em "Faltam Entregar" porque estão agendados.\n`);

    console.log(`✅ SOLUÇÃO:`);
    console.log(`   O dashboard precisa ser corrigido para usar statusProcesso em vez de status.`);
    console.log(`   OU os equipamentos agendados precisam ter status diferente de DISPONIVEL.\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

corrigir();
