require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Equipamentos com statusProcesso de entregue mas status DISPONIVEL (inconsistente)
  const inconsistentes = await prisma.equipamento.findMany({
    where: {
      status: 'DISPONIVEL',
      statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
    },
    select: { id: true, serialNumber: true, status: true, statusProcesso: true },
  });

  console.log(`Encontrados ${inconsistentes.length} equipamentos inconsistentes:`);
  inconsistentes.forEach(e => {
    console.log(`  ID ${e.id} | Serial: ${e.serialNumber} | status: ${e.status} | statusProcesso: ${e.statusProcesso}`);
  });

  if (inconsistentes.length === 0) {
    console.log('Nenhuma correção necessária.');
    return;
  }

  // Corrige: volta statusProcesso para 'Asset Registrado' (pronto para ser entregue novamente)
  const ids = inconsistentes.map(e => e.id);
  const result = await prisma.equipamento.updateMany({
    where: { id: { in: ids } },
    data: { statusProcesso: 'Asset Registrado' },
  });

  console.log(`\n✅ ${result.count} equipamento(s) corrigido(s) — statusProcesso voltou para 'Asset Registrado'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
