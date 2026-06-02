const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corrigirProjetosHoneywell() {
  try {
    console.log('🔧 Corrigindo projetos HONEYWELL...\n');

    // Buscar empresa
    const empresa = await prisma.empresa.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    // Buscar projetos HONEYWELL
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

    console.log(`✅ Projeto CK65: ID ${ck65.id}`);
    console.log(`✅ Projeto PM45: ID ${pm45.id}\n`);

    // Corrigir CK65 - Buscar equipamentos com marca HONEYWELL e modelo CK65
    const ck65Equipamentos = await prisma.equipamento.findMany({
      where: {
        marca: { contains: 'HONEYWELL', mode: 'insensitive' },
        modelo: { contains: 'CK65', mode: 'insensitive' }
      }
    });

    console.log(`📦 Equipamentos CK65 encontrados: ${ck65Equipamentos.length}`);

    for (const eq of ck65Equipamentos) {
      await prisma.equipamento.update({
        where: { id: eq.id },
        data: { projetoId: ck65.id }
      });
    }

    console.log(`✅ ${ck65Equipamentos.length} equipamentos CK65 corrigidos\n`);

    // Corrigir PM45 - Buscar equipamentos com marca HONEYWELL e modelo PM45
    const pm45Equipamentos = await prisma.equipamento.findMany({
      where: {
        marca: { contains: 'HONEYWELL', mode: 'insensitive' },
        modelo: { contains: 'PM45', mode: 'insensitive' }
      }
    });

    console.log(`📦 Equipamentos PM45 encontrados: ${pm45Equipamentos.length}`);

    for (const eq of pm45Equipamentos) {
      await prisma.equipamento.update({
        where: { id: eq.id },
        data: { projetoId: pm45.id }
      });
    }

    console.log(`✅ ${pm45Equipamentos.length} equipamentos PM45 corrigidos\n`);

    // Verificar resultado
    console.log('📊 Verificando resultado...\n');

    const ck65Final = await prisma.equipamento.count({
      where: { projetoId: ck65.id }
    });

    const pm45Final = await prisma.equipamento.count({
      where: { projetoId: pm45.id }
    });

    console.log(`✅ TECH REFRESH HONEYWELL CK65 2026: ${ck65Final} equipamentos`);
    console.log(`✅ TECH REFRESH HONEYWELL PM45 2026: ${pm45Final} equipamentos`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirProjetosHoneywell();
