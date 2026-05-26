const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Testando query de colaboradores...\n');
    
    // Teste 1: Contar total de colaboradores
    const totalColab = await prisma.usuario.count({
      where: {
        role: 'COLABORADOR',
        ativo: true,
      }
    });
    console.log(`1. Total de colaboradores ativos: ${totalColab}`);
    
    // Teste 2: Buscar com limit 10000
    const colaboradores = await prisma.usuario.findMany({
      where: {
        role: 'COLABORADOR',
        ativo: true,
      },
      orderBy: { nome: 'asc' },
      take: 10000,
    });
    console.log(`2. Colaboradores retornados com limit 10000: ${colaboradores.length}`);
    
    // Teste 3: Mostrar primeiros 10
    console.log('\n3. Primeiros 10 colaboradores:');
    colaboradores.slice(0, 10).forEach((c, i) => {
      console.log(`   ${i+1}. ${c.nome}`);
    });
    
    // Teste 4: Mostrar últimos 10
    console.log('\n4. Últimos 10 colaboradores:');
    colaboradores.slice(-10).forEach((c, i) => {
      console.log(`   ${i+1}. ${c.nome}`);
    });
    
    // Teste 5: Contar por primeira letra
    console.log('\n5. Contagem por primeira letra:');
    const porLetra = {};
    colaboradores.forEach(c => {
      const letra = c.nome.charAt(0).toUpperCase();
      porLetra[letra] = (porLetra[letra] || 0) + 1;
    });
    Object.keys(porLetra).sort().forEach(letra => {
      console.log(`   ${letra}: ${porLetra[letra]}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
