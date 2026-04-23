const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // Criar usuário de teste
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'USUARIO TESTE',
        email: 'teste@tech-refresh.com',
        senha: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        empresaId: 1,
        ativo: true
      }
    });

    console.log('\n========== USUÁRIO DE TESTE CRIADO ==========\n');
    console.log('Email: teste@tech-refresh.com');
    console.log('Senha: 123456');
    console.log('Role: ADMIN');
    console.log('\nUse essas credenciais para testar localmente!\n');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
