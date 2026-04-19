const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, email: true, role: true, senha: true },
    orderBy: { nome: 'asc' }
  });

  console.log(`Total de usuarios ativos: ${usuarios.length}\n`);

  // Agrupa por nome
  const porNome = {};
  for (const u of usuarios) {
    const key = u.nome.trim().toUpperCase();
    if (!porNome[key]) porNome[key] = [];
    porNome[key].push(u);
  }

  // Mostra duplicatas
  let temDuplicata = false;
  for (const [nome, lista] of Object.entries(porNome)) {
    if (lista.length > 1) {
      temDuplicata = true;
      console.log(`DUPLICATA: ${nome}`);
      lista.forEach(u => console.log(`  ID:${u.id} | role:${u.role} | email:${u.email || 'sem email'} | senha:${u.senha ? 'SIM' : 'NAO'}`));
    }
  }

  if (!temDuplicata) console.log('Nenhuma duplicata encontrada!');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
