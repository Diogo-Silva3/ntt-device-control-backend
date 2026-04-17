/**
 * fix-tecnico-empresa.js
 * Lista técnicos e permite corrigir o empresaId
 * Roda: node fix-tecnico-empresa.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany({ select: { id: true, nome: true } });
  console.log('\nEmpresas:');
  empresas.forEach(e => console.log(`  #${e.id} — ${e.nome}`));

  const tecnicos = await prisma.usuario.findMany({
    where: { role: 'TECNICO', senha: { not: null } },
    select: { id: true, nome: true, email: true, empresaId: true, empresa: { select: { nome: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\nTécnicos com acesso (últimos criados):');
  tecnicos.forEach(t => console.log(`  #${t.id} — ${t.nome} (${t.email || '—'}) → empresa: ${t.empresa?.nome} (#${t.empresaId})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
