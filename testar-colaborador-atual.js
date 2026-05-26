// Script para testar se o colaborador atual está sendo retornado corretamente
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testar() {
  try {
    console.log('🔍 Testando retorno de colaborador atual...\n');

    // Buscar um equipamento que estava em "Entregue ao Usuário" e foi movido
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        statusProcesso: { not: 'Entregue ao Usuário' }
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          select: {
            id: true,
            usuarioId: true,
            usuario: { select: { nome: true } },
            statusEntrega: true,
            ativa: true,
            dataInicio: true,
            dataFim: true
          }
        }
      },
      take: 3
    });

    for (const eq of equipamentos) {
      console.log(`\n📦 ${eq.serialNumber} (ID: ${eq.id})`);
      console.log(`   Status: ${eq.statusProcesso}`);
      console.log(`   Total de vinculações: ${eq.vinculacoes.length}`);
      
      // Simular o que o frontend faz
      const vinculacaoAtiva = eq.vinculacoes.find(v => v.ativa && v.statusEntrega === 'ENTREGUE');
      
      if (vinculacaoAtiva) {
        console.log(`   ❌ PROBLEMA: Encontrou vinculação ENTREGUE ativa!`);
        console.log(`      - Usuário: ${vinculacaoAtiva.usuario.nome}`);
        console.log(`      - Status: ${vinculacaoAtiva.statusEntrega}`);
      } else {
        console.log(`   ✓ OK: Nenhuma vinculação ENTREGUE ativa`);
      }

      // Mostrar todas as vinculações
      if (eq.vinculacoes.length > 0) {
        console.log(`   Todas as vinculações:`);
        for (const v of eq.vinculacoes) {
          console.log(`     - ${v.usuario.nome} (${v.statusEntrega}, ativa: ${v.ativa})`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testar();
