// Script para corrigir vinculações que ficaram ativas quando não deveriam
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigirVinculacoes() {
  try {
    console.log('🔧 Corrigindo vinculações ativas em equipamentos fora de "Entregue ao Usuário"...\n');

    // Buscar equipamentos que NÃO estão em "Entregue ao Usuário" mas têm vinculações ativas
    const equipamentosComProblema = await prisma.equipamento.findMany({
      where: {
        NOT: {
          statusProcesso: 'Entregue ao Usuário'
        },
        vinculacoes: {
          some: {
            ativa: true
          }
        }
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          where: { ativa: true },
          select: {
            id: true,
            usuarioId: true,
            usuario: { select: { nome: true } },
            statusEntrega: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${equipamentosComProblema.length} equipamentos com vinculações ativas incorretas\n`);

    let desativadas = 0;

    for (const eq of equipamentosComProblema) {
      console.log(`\n📦 ${eq.serialNumber} (ID: ${eq.id})`);
      console.log(`   Status: ${eq.statusProcesso}`);
      console.log(`   Vinculações ativas: ${eq.vinculacoes.length}`);

      for (const v of eq.vinculacoes) {
        console.log(`     - ${v.usuario.nome} (${v.statusEntrega})`);
      }

      // Desativar todas as vinculações ativas
      const resultado = await prisma.vinculacao.updateMany({
        where: {
          equipamentoId: eq.id,
          ativa: true
        },
        data: {
          ativa: false,
          dataFim: new Date()
        }
      });

      desativadas += resultado.count;
      console.log(`   ✓ ${resultado.count} vinculação(ões) desativada(s)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✓ Correção concluída: ${desativadas} vinculações desativadas`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

corrigirVinculacoes();
