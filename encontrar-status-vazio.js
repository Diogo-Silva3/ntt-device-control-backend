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
    console.log('🔍 Procurando equipamento com status vazio ou diferente...\n');

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

    // Contar por status
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      _count: { status: true }
    });

    console.log('📊 DISTRIBUIÇÃO POR STATUS:\n');
    porStatus.forEach(item => {
      console.log(`${item.status || 'NULL'}: ${item._count.status}`);
    });

    // Buscar todos os equipamentos
    const todos = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`\n📊 TOTAL: ${todos.length}\n`);

    // Contar DISPONIVEL
    const disponivel = todos.filter(e => e.status === 'DISPONIVEL').length;
    const emUso = todos.filter(e => e.status === 'EM_USO').length;
    const outros = todos.filter(e => e.status !== 'DISPONIVEL' && e.status !== 'EM_USO').length;

    console.log(`DISPONIVEL: ${disponivel}`);
    console.log(`EM_USO: ${emUso}`);
    console.log(`OUTROS: ${outros}`);
    console.log(`TOTAL: ${disponivel + emUso + outros}\n`);

    if (outros > 0) {
      console.log('⚠️  EQUIPAMENTOS COM STATUS DIFERENTE:\n');
      todos.filter(e => e.status !== 'DISPONIVEL' && e.status !== 'EM_USO').forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.serialNumber}`);
        console.log(`   Status: ${eq.status || 'NULL'}`);
        console.log(`   Status Processo: ${eq.statusProcesso}`);
        console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

encontrar();
