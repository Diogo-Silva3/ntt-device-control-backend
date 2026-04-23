const prisma = require('./src/config/prisma');

(async () => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true
      },
      orderBy: { nome: 'asc' }
    });

    console.log('\n========== USUÁRIOS DO SISTEMA ==========\n');
    usuarios.forEach((u, i) => {
      console.log(`${i + 1}. ${u.nome}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Ativo: ${u.ativo ? 'Sim' : 'Não'}`);
      console.log('');
    });

    console.log(`Total: ${usuarios.length} usuários\n`);
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
})();
