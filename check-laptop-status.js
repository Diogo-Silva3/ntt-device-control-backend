const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projeto = await prisma.projeto.findFirst({ where: { nome: { contains: 'LAPTOP', mode: 'insensitive' } } });
  if (!projeto) { console.log('Projeto não encontrado'); return; }

  const por = await prisma.equipamento.groupBy({
    by: ['statusProcesso', 'status'],
    where: { projetoId: projeto.id },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log(`Projeto: ${projeto.nome} (total: ${por.reduce((s,x)=>s+x._count.id,0)})\n`);
  console.log('statusProcesso                | status        | qtd');
  console.log('------------------------------|---------------|----');
  por.forEach(p => console.log(`${(p.statusProcesso||'null').padEnd(30)}| ${(p.status||'null').padEnd(15)}| ${p._count.id}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
