const bcrypt = require('bcryptjs');
const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Resetando senha do PEDRO SEVERO (ID 161)...\n');
    
    const novaSenha = 'Teste@123';
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    
    const usuario = await prisma.usuario.update({
      where: { id: 161 },
      data: { senha: senhaHash }
    });

    console.log('✅ Senha resetada com sucesso!');
    console.log(`\nNova senha: ${novaSenha}`);
    console.log(`Email: ${usuario.email}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
