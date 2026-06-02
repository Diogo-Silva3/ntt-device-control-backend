const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function sincronizarVPS() {
  try {
    console.log('🔄 Sincronizando equipamentos para VPS...\n');

    // Buscar empresa
    const empresa = await prisma.empresa.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    // Buscar os 3 projetos
    const ck65 = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'CK65', mode: 'insensitive' }
      }
    });

    const pm45 = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'PM45', mode: 'insensitive' }
      }
    });

    const celulares = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'CELULARES', mode: 'insensitive' }
      }
    });

    // Contar equipamentos por projeto
    const ck65Count = await prisma.equipamento.count({
      where: { projetoId: ck65.id }
    });

    const pm45Count = await prisma.equipamento.count({
      where: { projetoId: pm45.id }
    });

    const celularesCount = await prisma.equipamento.count({
      where: { projetoId: celulares.id }
    });

    console.log('📊 EQUIPAMENTOS SINCRONIZADOS:\n');
    console.log(`✅ TECH REFRESH HONEYWELL CK65 2026: ${ck65Count} coletores`);
    console.log(`✅ TECH REFRESH HONEYWELL PM45 2026: ${pm45Count} impressoras`);
    console.log(`✅ TECH REFRESH CELULARES 2026: ${celularesCount} celulares`);
    console.log(`\n📱 TOTAL: ${ck65Count + pm45Count + celularesCount} equipamentos`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

sincronizarVPS();
