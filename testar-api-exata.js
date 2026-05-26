const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Testando query EXATA que o backend faz...\n');
    
    // Simular exatamente o que o controller faz
    const empresaId = 1; // BIMBO BRASIL
    const role = 'COLABORADOR';
    const limit = 10000;
    const page = 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Parâmetros:');
    console.log(`  empresaId: ${empresaId}`);
    console.log(`  role: ${role}`);
    console.log(`  limit: ${limit}`);
    console.log(`  page: ${page}`);
    console.log(`  skip: ${skip}\n`);
    
    const where = {
      empresaId,
      ativo: true,
      role,
    };
    
    console.log('Where clause:', JSON.stringify(where, null, 2));
    
    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        include: { unidade: true },
        orderBy: { nome: 'asc' },
        skip,
        take: parseInt(limit),
      }),
    ]);
    
    console.log(`\nResultado:`);
    console.log(`  Total no banco: ${total}`);
    console.log(`  Retornados: ${usuarios.length}`);
    
    // Contar por letra
    const porLetra = {};
    usuarios.forEach(u => {
      const letra = u.nome.charAt(0).toUpperCase();
      porLetra[letra] = (porLetra[letra] || 0) + 1;
    });
    
    console.log(`\nPor letra:`);
    Object.keys(porLetra).sort().forEach(letra => {
      console.log(`  ${letra}: ${porLetra[letra]}`);
    });
    
    console.log(`\nPrimeiro: ${usuarios[0]?.nome}`);
    console.log(`Último: ${usuarios[usuarios.length - 1]?.nome}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
