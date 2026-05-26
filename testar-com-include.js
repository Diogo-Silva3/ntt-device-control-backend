const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Testando COM include unidade...\n');
    
    const empresaId = 1;
    const role = 'COLABORADOR';
    const limit = 10000;
    const skip = 0;
    
    const where = {
      empresaId,
      ativo: true,
      role,
    };
    
    // COM include
    console.log('1. COM include { unidade: true }:');
    const comInclude = await prisma.usuario.findMany({
      where,
      include: { unidade: true },
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    });
    console.log(`   Retornados: ${comInclude.length}`);
    console.log(`   Primeiro: ${comInclude[0]?.nome}`);
    console.log(`   Último: ${comInclude[comInclude.length - 1]?.nome}`);
    
    // SEM include
    console.log('\n2. SEM include:');
    const semInclude = await prisma.usuario.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip,
      take: limit,
    });
    console.log(`   Retornados: ${semInclude.length}`);
    console.log(`   Primeiro: ${semInclude[0]?.nome}`);
    console.log(`   Último: ${semInclude[semInclude.length - 1]?.nome}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
