require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function encontrar() {
  try {
    console.log('=== ENCONTRANDO EQUIPAMENTO EM_USO EXTRA ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Listar todos os equipamentos EM_USO
    const emUso = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: 'EM_USO',
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: true,
          },
        },
      },
      orderBy: { serialNumber: 'asc' },
    });

    console.log(`📊 Total EM_USO: ${emUso.length}\n`);

    console.log('📋 EQUIPAMENTOS EM_USO:');
    emUso.forEach((eq, idx) => {
      console.log(`${idx + 1}. ${eq.serialNumber}`);
      console.log(`   StatusProcesso: ${eq.statusProcesso}`);
      console.log(`   Vinculações ativas: ${eq.vinculacoes.length}`);
      if (eq.vinculacoes.length > 0) {
        eq.vinculacoes.forEach(v => {
          console.log(`     - ${v.usuario.nome} (${v.statusEntrega})`);
        });
      } else {
        console.log(`     - SEM VINCULAÇÃO ATIVA`);
      }
      console.log();
    });

    // Encontrar equipamentos EM_USO sem vinculação ENTREGUE
    const emUsoSemEntregue = emUso.filter(eq => 
      !eq.vinculacoes.some(v => v.statusEntrega === 'ENTREGUE')
    );

    if (emUsoSemEntregue.length > 0) {
      console.log('⚠️  EQUIPAMENTOS EM_USO SEM VINCULAÇÃO ENTREGUE:');
      emUsoSemEntregue.forEach(eq => {
        console.log(`   ${eq.serialNumber} - StatusProcesso: ${eq.statusProcesso}`);
      });
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

encontrar();
