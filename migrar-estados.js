const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migração de estados...\n');

  const mapeamento = {
    'Aguardando Entrega': 'Aguard.Entrega',
    'Aguardando NF': 'Aguard.Definição',
    'Coleta Solicitada': 'Aguardando Coleta',
    'Aguardando Coleta': 'Aguardando Coleta',
  };

  for (const [estadoAntigo, estadoNovo] of Object.entries(mapeamento)) {
    try {
      const resultado = await prisma.solicitacaoAtivo.updateMany({
        where: { estado: estadoAntigo },
        data: { estado: estadoNovo },
      });

      if (resultado.count > 0) {
        console.log(`✅ ${estadoAntigo} → ${estadoNovo}: ${resultado.count} registros atualizados`);
      }
    } catch (err) {
      console.error(`❌ Erro ao atualizar ${estadoAntigo}:`, err.message);
    }
  }

  console.log('\n✅ Migração concluída!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
