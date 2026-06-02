const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function encontrar() {
  try {
    console.log('🔍 Procurando qual serial está faltando na contagem de 42...\n');

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

    // 1. Contar TODOS com status DISPONIVEL
    const todosDisponiveis = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL'
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Equipamentos com status DISPONIVEL: ${todosDisponiveis.length}\n`);

    // 2. Listar todos
    console.log('📋 TODOS OS EQUIPAMENTOS COM STATUS DISPONIVEL:\n');
    todosDisponiveis.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber} - ${eq.statusProcesso} (${eq.unidade?.nome})`);
    });

    // 3. Contar por statusProcesso
    console.log('\n📊 DISTRIBUIÇÃO POR STATUS PROCESSO:\n');
    const porStatusProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL'
      },
      _count: { statusProcesso: true }
    });

    porStatusProcesso.forEach(item => {
      console.log(`${item.statusProcesso}: ${item._count.statusProcesso}`);
    });

    // 4. Verificar se há algum equipamento que não está sendo contado
    console.log('\n🔍 VERIFICAÇÃO:\n');
    const agendados = todosDisponiveis.filter(e => e.statusProcesso === 'Agendado para Entrega').length;
    const emPreparacao = todosDisponiveis.filter(e => e.statusProcesso !== 'Agendado para Entrega').length;

    console.log(`Agendados: ${agendados}`);
    console.log(`Em Preparação: ${emPreparacao}`);
    console.log(`Total: ${agendados + emPreparacao}`);
    console.log(`Esperado: 42`);
    console.log(`Diferença: ${42 - (agendados + emPreparacao)}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

encontrar();
