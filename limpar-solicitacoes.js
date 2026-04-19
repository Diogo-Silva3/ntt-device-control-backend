/**
 * Script para apagar TODAS as solicitações de ativos do banco.
 * Apaga primeiro a auditoria (FK), depois as solicitações.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Contar antes
  const total = await prisma.solicitacaoAtivo.count();
  console.log(`Total de solicitações encontradas: ${total}`);

  if (total === 0) {
    console.log('Nada para apagar.');
    return;
  }

  // Apagar auditoria primeiro (FK)
  const auditoria = await prisma.solicitacaoAuditoria.deleteMany({});
  console.log(`Registros de auditoria apagados: ${auditoria.count}`);

  // Apagar todas as solicitações
  const resultado = await prisma.solicitacaoAtivo.deleteMany({});
  console.log(`Solicitações apagadas: ${resultado.count}`);

  console.log('Limpeza concluída com sucesso!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
