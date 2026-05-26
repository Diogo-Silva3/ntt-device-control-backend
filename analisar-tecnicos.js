const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Analisando técnicos...\n');
    
    // Teste 1: Técnicos COM senha (acesso real)
    const tecnicosComSenha = await prisma.usuario.count({
      where: {
        role: 'TECNICO',
        senha: { not: null },
      }
    });
    console.log(`1. Técnicos COM senha (acesso real): ${tecnicosComSenha}`);
    
    // Teste 2: Técnicos SEM senha (provavelmente colaboradores)
    const tecnicosSemSenha = await prisma.usuario.count({
      where: {
        role: 'TECNICO',
        senha: null,
      }
    });
    console.log(`2. Técnicos SEM senha (provavelmente colaboradores): ${tecnicosSemSenha}`);
    
    // Teste 3: Total de técnicos
    const totalTecnicos = await prisma.usuario.count({
      where: {
        role: 'TECNICO',
      }
    });
    console.log(`3. Total de técnicos: ${totalTecnicos}`);
    
    // Teste 4: Primeiros 10 técnicos SEM senha
    console.log('\n4. Primeiros 10 técnicos SEM senha:');
    const tecnicosSemSenhaList = await prisma.usuario.findMany({
      where: {
        role: 'TECNICO',
        senha: null,
      },
      select: { id: true, nome: true, email: true, ativo: true },
      take: 10,
    });
    tecnicosSemSenhaList.forEach((t, i) => {
      console.log(`   ${i+1}. ${t.nome} (${t.email}) - Ativo: ${t.ativo}`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
