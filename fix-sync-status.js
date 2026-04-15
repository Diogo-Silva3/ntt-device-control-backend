/**
 * fix-sync-status.js
 * Sincroniza status <-> statusProcesso para equipamentos inconsistentes.
 * Roda uma vez: node fix-sync-status.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Equipamentos com statusProcesso "Entregue ao Usuário" ou "Em Uso"
  //    mas status != EM_USO — corrige para EM_USO
  const r1 = await prisma.equipamento.updateMany({
    where: {
      statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
      status: { not: 'EM_USO' },
    },
    data: { status: 'EM_USO' },
  });
  console.log(`✅ ${r1.count} equipamentos com statusProcesso=Entregue mas status!=EM_USO → corrigidos para EM_USO`);

  // 2. Equipamentos com status EM_USO mas sem vinculação ativa
  //    e statusProcesso não é entregue — provavelmente ficaram presos
  const semVinculacao = await prisma.equipamento.findMany({
    where: {
      status: 'EM_USO',
      vinculacoes: { none: { ativa: true } },
      statusProcesso: { notIn: ['Entregue ao Usuário', 'Em Uso', 'Baixado'] },
    },
    select: { id: true, serialNumber: true, statusProcesso: true },
  });
  console.log(`\nℹ️  ${semVinculacao.length} equipamentos EM_USO sem vinculação ativa:`);
  semVinculacao.forEach(e => console.log(`   #${e.id} S/N:${e.serialNumber || '—'} statusProcesso:${e.statusProcesso}`));

  // 3. Mostra resumo final
  const [emUso, entregues, disponiveis] = await Promise.all([
    prisma.equipamento.count({ where: { status: 'EM_USO' } }),
    prisma.equipamento.count({ where: { statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] } } }),
    prisma.equipamento.count({ where: { status: 'DISPONIVEL' } }),
  ]);
  console.log(`\n📊 Resumo após correção:`);
  console.log(`   status=EM_USO: ${emUso}`);
  console.log(`   statusProcesso=Entregue: ${entregues}`);
  console.log(`   status=DISPONIVEL: ${disponiveis}`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
