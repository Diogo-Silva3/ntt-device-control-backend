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
    console.log('🔍 Procurando equipamento que está retinando...\n');

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

    // Buscar equipamentos que NÃO têm status DISPONIVEL
    const naoDisponiveis = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: { not: 'DISPONIVEL' }
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Equipamentos que NÃO têm status DISPONIVEL: ${naoDisponiveis.length}\n`);

    if (naoDisponiveis.length > 0) {
      console.log('📋 EQUIPAMENTOS COM STATUS DIFERENTE DE DISPONIVEL:\n');
      naoDisponiveis.forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.serialNumber}`);
        console.log(`   Status: ${eq.status}`);
        console.log(`   Status Processo: ${eq.statusProcesso}`);
        console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
        console.log('');
      });
    }

    // Buscar equipamentos com status NULL ou vazio
    const statusNull = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: null
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      }
    });

    if (statusNull.length > 0) {
      console.log(`\n⚠️  Equipamentos com status NULL: ${statusNull.length}\n`);
      statusNull.forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.serialNumber}`);
        console.log(`   Status: ${eq.status}`);
        console.log(`   Status Processo: ${eq.statusProcesso}`);
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
