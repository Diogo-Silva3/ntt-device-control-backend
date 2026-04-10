require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.equipamento.findMany({
  where: { statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] } },
  select: { id: true, marca: true, modelo: true, statusProcesso: true, status: true, projetoId: true }
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
}).catch(e => { console.error(e); p.$disconnect(); });
