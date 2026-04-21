const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Procurando PEDRO SEVERO...');
    const u = await prisma.usuario.findFirst({
      where: { email: 'pedro.severo@nttdata.com' },
      include: { projeto: true }
    });

    if (u) {
      console.log('\n✅ PEDRO encontrado:');
      console.log(JSON.stringify(u, null, 2));
    } else {
      console.log('\n❌ PEDRO não encontrado');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
