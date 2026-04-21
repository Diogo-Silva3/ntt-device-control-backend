const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Atribuindo projetoId ao PEDRO SEVERO (ID 161)...\n');
    
    const usuario = await prisma.usuario.update({
      where: { id: 161 },
      data: { projetoId: 1 },
      include: { projeto: true }
    });

    console.log('✅ ProjetoId atribuído com sucesso!');
    console.log('\nDados atualizados:');
    console.log(JSON.stringify(usuario, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
