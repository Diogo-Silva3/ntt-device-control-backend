require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO TODOS OS PROJETOS ===\n');

    const projetos = await prisma.projeto.findMany({
      include: {
        equipamentos: {
          where: { status: { not: 'DESCARTADO' } },
          include: {
            vinculacoes: {
              where: { ativa: true },
            },
          },
        },
      },
    });

    for (const projeto of projetos) {
      const vinculacoesAtivas = projeto.equipamentos.flatMap(e => e.vinculacoes);
      
      const porStatus = {};
      vinculacoesAtivas.forEach(v => {
        porStatus[v.statusEntrega] = (porStatus[v.statusEntrega] || 0) + 1;
      });

      const entregues = porStatus['ENTREGUE'] || 0;
      const pendentes = porStatus['PENDENTE'] || 0;

      console.log(`📊 ${projeto.nome} (ID: ${projeto.id})`);
      console.log(`   Total equipamentos: ${projeto.equipamentos.length}`);
      console.log(`   Vinculações ativas: ${vinculacoesAtivas.length}`);
      console.log(`   ENTREGUE: ${entregues}`);
      console.log(`   PENDENTE: ${pendentes}`);
      console.log(`   OUTROS: ${vinculacoesAtivas.length - entregues - pendentes}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
