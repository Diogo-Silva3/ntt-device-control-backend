const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Testando query de colaboradores com limit 10000...\n');
    
    // Simular a query exata que o backend faz
    const empresaId = 1; // BIMBO BRASIL
    const limit = 10000;
    const skip = 0;
    
    const where = {
      empresaId,
      ativo: true,
      role: 'COLABORADOR',
    };
    
    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        include: { unidade: true },
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    
    console.log(`Total: ${total}`);
    console.log(`Retornados: ${usuarios.length}`);
    console.log(`Limit: ${limit}`);
    console.log(`Skip: ${skip}`);
    
    console.log('\nÚltimos 10 colaboradores:');
    usuarios.slice(-10).forEach((u, i) => {
      console.log(`${i+1}. ${u.nome}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
