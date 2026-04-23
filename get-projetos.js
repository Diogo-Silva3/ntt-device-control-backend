const prisma = require('./src/config/prisma');

(async () => {
  try {
    const projetos = await prisma.projeto.findMany({
      select: { id: true, nome: true }
    });
    console.log(JSON.stringify(projetos, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
