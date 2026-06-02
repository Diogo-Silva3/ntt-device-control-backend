const { PrismaClient } = require('@prisma/client');

// Cliente local
const prismaLocal = new PrismaClient();

// Cliente VPS
const prismaVPS = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function comparar() {
  try {
    console.log('🔍 Comparando seriais LOCAL vs VPS...\n');

    // 1. Encontrar projeto de celulares em ambos
    const projetoLocal = await prismaLocal.projeto.findFirst({
      where: { nome: { contains: 'CELULAR', mode: 'insensitive' } }
    });

    const projetoVPS = await prismaVPS.projeto.findFirst({
      where: { nome: { contains: 'CELULAR', mode: 'insensitive' } }
    });

    if (!projetoLocal || !projetoVPS) {
      console.log('❌ Projeto não encontrado');
      await prismaLocal.$disconnect();
      await prismaVPS.$disconnect();
      return;
    }

    console.log(`✅ Projeto encontrado em ambos: ${projetoLocal.nome}\n`);

    // 2. Buscar "Faltam Entregar" (Agendado para Entrega)
    const faltamLocal = await prismaLocal.equipamento.findMany({
      where: {
        projetoId: projetoLocal.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      },
      select: { serialNumber: true, unidade: { select: { nome: true } } },
      orderBy: { serialNumber: 'asc' }
    });

    const faltamVPS = await prismaVPS.equipamento.findMany({
      where: {
        projetoId: projetoVPS.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      },
      select: { serialNumber: true, unidade: { select: { nome: true } } },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 FALTAM ENTREGAR (Agendado para Entrega):`);
    console.log(`   LOCAL: ${faltamLocal.length}`);
    console.log(`   VPS: ${faltamVPS.length}\n`);

    // 3. Buscar "Disponível"
    const disponivelLocal = await prismaLocal.equipamento.findMany({
      where: {
        projetoId: projetoLocal.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      },
      select: { serialNumber: true, statusProcesso: true, unidade: { select: { nome: true } } },
      orderBy: { serialNumber: 'asc' }
    });

    const disponivelVPS = await prismaVPS.equipamento.findMany({
      where: {
        projetoId: projetoVPS.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      },
      select: { serialNumber: true, statusProcesso: true, unidade: { select: { nome: true } } },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 DISPONÍVEL:`);
    console.log(`   LOCAL: ${disponivelLocal.length}`);
    console.log(`   VPS: ${disponivelVPS.length}\n`);

    // 4. Comparar seriais
    const serialsFaltamLocal = faltamLocal.map(e => e.serialNumber);
    const serialsFaltamVPS = faltamVPS.map(e => e.serialNumber);
    const serialsDisponivelLocal = disponivelLocal.map(e => e.serialNumber);
    const serialsDisponivelVPS = disponivelVPS.map(e => e.serialNumber);

    // Faltam no LOCAL mas estão na VPS
    const faltamNoLocal = serialsFaltamVPS.filter(s => !serialsFaltamLocal.includes(s));
    const faltamNoVPS = serialsFaltamLocal.filter(s => !serialsFaltamVPS.includes(s));

    // Disponível no LOCAL mas não na VPS
    const disponivelNoLocal = serialsDisponivelVPS.filter(s => !serialsDisponivelLocal.includes(s));
    const disponivelNoVPS = serialsDisponivelLocal.filter(s => !serialsDisponivelVPS.includes(s));

    if (faltamNoLocal.length > 0) {
      console.log(`⚠️  FALTAM ENTREGAR - Estão na VPS mas NÃO no LOCAL (${faltamNoLocal.length}):\n`);
      faltamNoLocal.forEach((serial, index) => {
        const eq = faltamVPS.find(e => e.serialNumber === serial);
        console.log(`${index + 1}. ${serial} (${eq?.unidade?.nome || 'N/A'})`);
      });
      console.log('');
    }

    if (faltamNoVPS.length > 0) {
      console.log(`⚠️  FALTAM ENTREGAR - Estão no LOCAL mas NÃO na VPS (${faltamNoVPS.length}):\n`);
      faltamNoVPS.forEach((serial, index) => {
        const eq = faltamLocal.find(e => e.serialNumber === serial);
        console.log(`${index + 1}. ${serial} (${eq?.unidade?.nome || 'N/A'})`);
      });
      console.log('');
    }

    if (disponivelNoLocal.length > 0) {
      console.log(`⚠️  DISPONÍVEL - Estão na VPS mas NÃO no LOCAL (${disponivelNoLocal.length}):\n`);
      disponivelNoLocal.forEach((serial, index) => {
        const eq = disponivelVPS.find(e => e.serialNumber === serial);
        console.log(`${index + 1}. ${serial} - ${eq?.statusProcesso} (${eq?.unidade?.nome || 'N/A'})`);
      });
      console.log('');
    }

    if (disponivelNoVPS.length > 0) {
      console.log(`⚠️  DISPONÍVEL - Estão no LOCAL mas NÃO na VPS (${disponivelNoVPS.length}):\n`);
      disponivelNoVPS.forEach((serial, index) => {
        const eq = disponivelLocal.find(e => e.serialNumber === serial);
        console.log(`${index + 1}. ${serial} - ${eq?.statusProcesso} (${eq?.unidade?.nome || 'N/A'})`);
      });
      console.log('');
    }

    if (faltamNoLocal.length === 0 && faltamNoVPS.length === 0 && disponivelNoLocal.length === 0 && disponivelNoVPS.length === 0) {
      console.log('✅ LOCAL e VPS estão sincronizados!');
    }

    await prismaLocal.$disconnect();
    await prismaVPS.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prismaLocal.$disconnect();
    await prismaVPS.$disconnect();
    process.exit(1);
  }
}

comparar();
