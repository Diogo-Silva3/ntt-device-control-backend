const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Debugando colaboradores da BIMBO BRASIL...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    
    // Teste 1: Contar por primeira letra
    console.log('1. Contagem por primeira letra:');
    const colaboradores = await prisma.usuario.findMany({
      where: {
        empresaId,
        ativo: true,
        role: 'COLABORADOR',
      },
      select: { nome: true },
      orderBy: { nome: 'asc' },
    });
    
    const porLetra = {};
    colaboradores.forEach(c => {
      const letra = c.nome.charAt(0).toUpperCase();
      porLetra[letra] = (porLetra[letra] || 0) + 1;
    });
    
    Object.keys(porLetra).sort().forEach(letra => {
      console.log(`   ${letra}: ${porLetra[letra]}`);
    });
    
    console.log(`\nTotal: ${colaboradores.length}`);
    
    // Teste 2: Mostrar primeiros 5 de cada letra
    console.log('\n2. Primeiros 5 de cada letra:');
    const letras = Object.keys(porLetra).sort();
    for (const letra of letras) {
      const nomes = colaboradores.filter(c => c.nome.charAt(0).toUpperCase() === letra).slice(0, 2);
      console.log(`   ${letra}: ${nomes.map(n => n.nome).join(', ')}`);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
