require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Equipamentos com vinculação PENDENTE e dataAgendamento definida mas statusProcesso errado
  const vinculacoesPendentes = await p.vinculacao.findMany({
    where: { statusEntrega: 'PENDENTE', dataAgendamento: { not: null } },
    select: { equipamentoId: true },
    distinct: ['equipamentoId'],
  });

  const ids = vinculacoesPendentes.map(v => v.equipamentoId).filter(Boolean);
  console.log(`Equipamentos agendados pendentes: ${ids.length}`);

  const result = await p.equipamento.updateMany({
    where: {
      id: { in: ids },
      statusProcesso: { notIn: ['Agendado para Entrega', 'Entregue ao Usuário', 'Em Uso'] },
    },
    data: { statusProcesso: 'Agendado para Entrega' },
  });

  console.log(`Corrigidos: ${result.count} equipamentos`);
}

main().catch(console.error).finally(() => p.$disconnect());
