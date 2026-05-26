const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('📊 Verificando resultado da importação...\n');

    // Contar usuários por unidade
    const usuariosPorUnidade = await prisma.usuario.groupBy({
      by: ['unidadeId'],
      where: { ativo: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20
    });

    console.log('👥 Usuários por unidade (top 20):');
    for (const item of usuariosPorUnidade) {
      const unidade = await prisma.unidade.findUnique({
        where: { id: item.unidadeId },
        select: { nome: true }
      });
      console.log(`   ${unidade?.nome || 'Sem unidade'}: ${item._count.id} usuários`);
    }

    // Total de usuários
    const totalUsuarios = await prisma.usuario.count({ where: { ativo: true } });
    console.log(`\n📈 Total de usuários ativos: ${totalUsuarios}`);

    // Usuários criados hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const usuariosCriados = await prisma.usuario.count({
      where: {
        ativo: true,
        createdAt: { gte: hoje }
      }
    });
    console.log(`✨ Usuários criados hoje: ${usuariosCriados}`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
