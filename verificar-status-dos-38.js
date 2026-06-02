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
    console.log('🔍 Verificando status dos 38 equipamentos que estavam agendados...\n');

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

    // Contar por statusProcesso
    const porStatusProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      _count: { statusProcesso: true }
    });

    console.log('📊 DISTRIBUIÇÃO POR STATUS PROCESSO:\n');
    porStatusProcesso.forEach(item => {
      console.log(`${item.statusProcesso}: ${item._count.statusProcesso}`);
    });

    // Contar por status
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      _count: { status: true }
    });

    console.log('\n📊 DISTRIBUIÇÃO POR STATUS:\n');
    porStatus.forEach(item => {
      console.log(`${item.status}: ${item._count.status}`);
    });

    // Total
    const total = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    console.log(`\n📊 TOTAL: ${total}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
