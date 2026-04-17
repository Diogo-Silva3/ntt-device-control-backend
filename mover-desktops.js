/**
 * mover-desktops.js
 * Move todos os equipamentos do tipo Desktop para o projeto "TECH REFRESH DESKTOP"
 * Roda uma vez: node mover-desktops.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Lista projetos disponíveis
  const projetos = await prisma.projeto.findMany({ select: { id: true, nome: true, empresaId: true } });
  console.log('Projetos encontrados:');
  projetos.forEach(p => console.log(`  #${p.id} — ${p.nome} (empresa ${p.empresaId})`));

  // Busca o projeto TECH REFRESH DESKTOP
  const projeto = projetos.find(p => p.nome.toUpperCase().includes('DESKTOP'));
  if (!projeto) {
    console.error('\n❌ Projeto "TECH REFRESH DESKTOP" não encontrado!');
    console.log('Projetos disponíveis:', projetos.map(p => p.nome).join(', '));
    process.exit(1);
  }
  console.log(`\n✅ Projeto alvo: #${projeto.id} — ${projeto.nome}`);

  // Conta desktops antes
  const tipos = await prisma.equipamento.groupBy({
    by: ['tipo'],
    where: { empresaId: projeto.empresaId },
    _count: { id: true },
  });
  console.log('\nTipos de equipamentos:');
  tipos.forEach(t => console.log(`  ${t.tipo || '(sem tipo)'}: ${t._count.id}`));

  // Move todos os desktops
  const result = await prisma.equipamento.updateMany({
    where: {
      empresaId: projeto.empresaId,
      tipo: { contains: 'Desktop', mode: 'insensitive' },
    },
    data: { projetoId: projeto.id },
  });

  console.log(`\n✅ ${result.count} desktops movidos para o projeto "${projeto.nome}"`);

  // Confirma
  const confirmacao = await prisma.equipamento.count({
    where: { projetoId: projeto.id, tipo: { contains: 'Desktop', mode: 'insensitive' } },
  });
  console.log(`📊 Total de desktops no projeto agora: ${confirmacao}`);
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
