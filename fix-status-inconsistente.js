require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inconsistentes = await prisma.equipamento.findMany({
    where: {
      status: 'DISPONIVEL',
      statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
    },
    select: { id: true, serialNumber: true, tipo: true, status: true, statusProcesso: true },
  });

  console.log(`Encontrados ${inconsistentes.length} equipamentos inconsistentes:`);

  const tablets = inconsistentes.filter(e => e.tipo?.toLowerCase().includes('tablet'))
  const outros = inconsistentes.filter(e => !e.tipo?.toLowerCase().includes('tablet'))

  console.log(`  Tablets: ${tablets.length} | Outros: ${outros.length}`)

  if (tablets.length > 0) {
    await prisma.equipamento.updateMany({
      where: { id: { in: tablets.map(e => e.id) } },
      data: { statusProcesso: 'Imagem Instalada' }, // "App Instalado" no fluxo de tablet
    });
    console.log(`✅ ${tablets.length} tablet(s) → 'Imagem Instalada'`);
  }

  if (outros.length > 0) {
    await prisma.equipamento.updateMany({
      where: { id: { in: outros.map(e => e.id) } },
      data: { statusProcesso: 'Asset Registrado' },
    });
    console.log(`✅ ${outros.length} equipamento(s) → 'Asset Registrado'`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
