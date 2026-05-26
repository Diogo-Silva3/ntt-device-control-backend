const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    const total = await prisma.usuario.count();
    const colaboradores = await prisma.usuario.count({ where: { role: 'COLABORADOR' } });
    const colaboradoresAtivos = await prisma.usuario.count({ where: { role: 'COLABORADOR', ativo: true } });
    const colaboradoresComSenha = await prisma.usuario.count({ where: { role: 'COLABORADOR', ativo: true, senha: { not: null } } });
    
    console.log('Total de usuários:', total);
    console.log('Colaboradores (todos):', colaboradores);
    console.log('Colaboradores (ativos):', colaboradoresAtivos);
    console.log('Colaboradores (ativos com senha):', colaboradoresComSenha);
    
    // Listar alguns colaboradores
    const alguns = await prisma.usuario.findMany({
      where: { role: 'COLABORADOR', ativo: true, senha: { not: null } },
      select: { id: true, nome: true, email: true, role: true },
      take: 5
    });
    
    console.log('Alguns colaboradores:', alguns);
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
}

verificar();
