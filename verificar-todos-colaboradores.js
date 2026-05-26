const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Verificando todos os colaboradores...\n');
    
    // Teste 1: Total de colaboradores ATIVOS
    const ativosTotal = await prisma.usuario.count({
      where: {
        role: 'COLABORADOR',
        ativo: true,
      }
    });
    console.log(`1. Colaboradores ATIVOS: ${ativosTotal}`);
    
    // Teste 2: Total de colaboradores INATIVOS
    const inativosTotal = await prisma.usuario.count({
      where: {
        role: 'COLABORADOR',
        ativo: false,
      }
    });
    console.log(`2. Colaboradores INATIVOS: ${inativosTotal}`);
    
    // Teste 3: Total de colaboradores (todos)
    const todosTotal = await prisma.usuario.count({
      where: {
        role: 'COLABORADOR',
      }
    });
    console.log(`3. Colaboradores TOTAL: ${todosTotal}`);
    
    // Teste 4: Total de usuários com qualquer role
    const todosUsuarios = await prisma.usuario.count();
    console.log(`4. Total de usuários (todos os roles): ${todosUsuarios}`);
    
    // Teste 5: Breakdown por role
    console.log('\n5. Breakdown por role:');
    const roles = await prisma.usuario.groupBy({
      by: ['role'],
      _count: true,
    });
    roles.forEach(r => {
      console.log(`   ${r.role}: ${r._count}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
