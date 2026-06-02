const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Primeiro contar quantas existem
  const total = await prisma.solicitacaoAtivo.count({ where: { status: 'ENCERRADO' } });
  console.log(`Encontradas ${total} solicitações encerradas.`);

  if (total === 0) {
    console.log('Nada para excluir.');
    return;
  }

  // Buscar IDs das encerradas
  const encerradas = await prisma.solicitacaoAtivo.findMany({
    where: { status: 'ENCERRADO' },
    select: { id: true, numeroChamado: true }
  });

  console.log('Solicitações a excluir:');
  encerradas.forEach(s => console.log(`  - ID ${s.id}: ${s.numeroChamado}`));

  // Excluir auditorias relacionadas primeiro (FK)
  const ids = encerradas.map(s => s.id);
  const audDel = await prisma.solicitacaoAuditoria.deleteMany({
    where: { solicitacaoId: { in: ids } }
  });
  console.log(`Excluídos ${audDel.count} registros de auditoria.`);

  // Excluir as solicitações
  const solDel = await prisma.solicitacaoAtivo.deleteMany({
    where: { status: 'ENCERRADO' }
  });
  console.log(`Excluídas ${solDel.count} solicitações encerradas com sucesso!`);
}

main()
  .catch(e => { console.error('Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
