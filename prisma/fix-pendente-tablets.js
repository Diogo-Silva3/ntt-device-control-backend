const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.vinculacao.updateMany({
    where: {
      numeroChamado: { in: ['TASK1652056', 'TASK1652058'] },
      statusEntrega: 'ENTREGUE',
    },
    data: { statusEntrega: 'PENDENTE' },
  });
  console.log(`✅ ${result.count} vinculações corrigidas para PENDENTE`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
