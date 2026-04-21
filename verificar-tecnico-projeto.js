const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Procurando técnico com projetoId...');
    const u = await prisma.usuario.findFirst({
      where: { role: 'TECNICO', projetoId: { not: null } },
      include: { projeto: true }
    });

    if (u) {
      console.log('\n✅ Técnico encontrado:');
      console.log(JSON.stringify(u, null, 2));
    } else {
      console.log('\n❌ Nenhum técnico com projetoId encontrado');
      
      // Listar todos os técnicos
      console.log('\nListando todos os técnicos:');
      const tecnicos = await prisma.usuario.findMany({
        where: { role: 'TECNICO' },
        select: { id: true, nome: true, email: true, projetoId: true }
      });
      console.log(JSON.stringify(tecnicos, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
