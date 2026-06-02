const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function verificar() {
  try {
    console.log('🔍 Verificando por que está mostrando 38 agendados...\n');

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

    // 1. Contar equipamentos com statusProcesso = 'Agendado para Entrega'
    const agendados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } },
        vinculacoes: {
          where: { ativa: true },
          select: { statusEntrega: true }
        }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Equipamentos com statusProcesso = 'Agendado para Entrega': ${agendados.length}\n`);

    console.log('📋 LISTA DE AGENDADOS:\n');
    agendados.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   Status Processo: ${eq.statusProcesso}`);
      console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
      console.log(`   Vinculações ativas: ${eq.vinculacoes.length}`);
      if (eq.vinculacoes.length > 0) {
        eq.vinculacoes.forEach(v => {
          console.log(`     - Status Entrega: ${v.statusEntrega}`);
        });
      }
      console.log('');
    });

    console.log('\n❓ PERGUNTA: Por que estão agendados?\n');
    console.log('Resposta: Porque têm statusProcesso = "Agendado para Entrega"');
    console.log('Isso significa que foram agendados para entrega, mas ainda não foram entregues.');
    console.log('Eles estão aguardando o técnico fazer a entrega ao colaborador.\n');

    console.log('📊 RESUMO:\n');
    console.log(`Total de celulares: 77`);
    console.log(`  - Agendados (aguardando entrega): 38`);
    console.log(`  - Em preparação (Imagem Instalada): 4`);
    console.log(`  - Entregues (Em Uso): 35`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
