require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Busca todos equipamentos que têm vinculação ENTREGUE mas statusProcesso errado
  const vinculacoesEntregues = await p.vinculacao.findMany({
    where: { statusEntrega: 'ENTREGUE' },
    select: { equipamentoId: true },
    distinct: ['equipamentoId'],
  });

  const ids = vinculacoesEntregues.map(v => v.equipamentoId).filter(Boolean);
  console.log(`Equipamentos com vinculação entregue: ${ids.length}`);

  const result = await p.equipamento.updateMany({
    where: {
      id: { in: ids },
      statusProcesso: { notIn: ['Entregue ao Usuário'] },
    },
    data: { statusProcesso: 'Entregue ao Usuário' },
  });

  console.log(`Corrigidos: ${result.count} equipamentos`);
}

main().catch(console.error).finally(() => p.$disconnect());
