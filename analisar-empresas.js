const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Analisando empresas e colaboradores...\n');
    
    // Teste 1: Total de empresas
    const empresas = await prisma.empresa.findMany({
      select: { id: true, nome: true }
    });
    console.log(`1. Total de empresas: ${empresas.length}`);
    empresas.forEach(e => {
      console.log(`   - ${e.nome} (ID: ${e.id})`);
    });
    
    // Teste 2: Colaboradores por empresa
    console.log('\n2. Colaboradores por empresa:');
    for (const empresa of empresas) {
      const count = await prisma.usuario.count({
        where: {
          empresaId: empresa.id,
          role: 'COLABORADOR',
          ativo: true,
        }
      });
      console.log(`   ${empresa.nome}: ${count}`);
    }
    
    // Teste 3: Usuário logado (para saber qual empresa está usando)
    const usuario = await prisma.usuario.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, nome: true, empresaId: true, empresa: { select: { nome: true } } }
    });
    console.log(`\n3. Usuário admin encontrado:`);
    console.log(`   Nome: ${usuario?.nome}`);
    console.log(`   Empresa: ${usuario?.empresa?.nome} (ID: ${usuario?.empresaId})`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
