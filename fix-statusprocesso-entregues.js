require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Busca todos equipamentos com status EM_USO mas statusProcesso diferente de 'Entregue ao Usuário'
  const result = await p.equipamento.updateMany({
    where: {
      status: 'EM_USO',
      statusProcesso: { notIn: ['Entregue ao Usuário'] }
    },
    data: { statusProcesso: 'Entregue ao Usuário' }
  });
  console.log(`Corrigidos: ${result.count} equipamentos`);
}

main().catch(console.error).finally(() => p.$disconnect());
