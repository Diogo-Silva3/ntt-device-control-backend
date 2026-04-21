const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Listando todos os técnicos...\n');
    const tecnicos = await prisma.usuario.findMany({
      where: { role: 'TECNICO' },
      select: { id: true, nome: true, email: true, projetoId: true, empresaId: true },
      orderBy: { nome: 'asc' }
    });

    if (tecnicos.length === 0) {
      console.log('❌ Nenhum técnico encontrado');
    } else {
      console.log(`✅ ${tecnicos.length} técnico(s) encontrado(s):\n`);
      tecnicos.forEach(t => {
        console.log(`  ID: ${t.id}`);
        console.log(`  Nome: ${t.nome}`);
        console.log(`  Email: ${t.email}`);
        console.log(`  ProjetoId: ${t.projetoId || 'null'}`);
        console.log(`  EmpresaId: ${t.empresaId}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
