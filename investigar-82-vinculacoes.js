const prisma = require('./src/config/prisma');

const investigar = async () => {
  try {
    console.log('Investigando as 82 vinculações ativas...\n');
    
    const empresaId = 1;
    const projetoId = 1;
    
    // Vinculações ativas por status
    console.log('🔗 VINCULAÇÕES ATIVAS POR STATUS:');
    const porStatus = await prisma.vinculacao.groupBy({
      by: ['statusEntrega'],
      where: {
        ativa: true,
        equipamento: { empresaId, projetoId }
      },
      _count: true
    });
    
    let total = 0;
    porStatus.forEach(s => {
      console.log(`   ${s.statusEntrega}: ${s._count}`);
      total += s._count;
    });
    console.log(`   TOTAL: ${total}\n`);
    
    // Verificar equipamentos com múltiplas vinculações ativas
    console.log('⚠️ EQUIPAMENTOS COM MÚLTIPLAS VINCULAÇÕES ATIVAS:');
    const equipamentosComMultiplas = await prisma.equipamento.findMany({
      where: {
        empresaId,
        projetoId,
        vinculacoes: {
          some: { ativa: true }
        }
      },
      include: {
        vinculacoes: {
          where: { ativa: true }
        }
      }
    });
    
    let comMultiplas = 0;
    equipamentosComMultiplas.forEach(eq => {
      if (eq.vinculacoes.length > 1) {
        console.log(`   ${eq.serialNumber}: ${eq.vinculacoes.length} vinculações ativas`);
        comMultiplas++;
      }
    });
    console.log(`   Total com múltiplas: ${comMultiplas}\n`);
    
    console.log('📊 RESUMO:');
    console.log(`   Vinculações ativas: ${total}`);
    console.log(`   Equipamentos com vinculação ativa: ${equipamentosComMultiplas.length}`);
    console.log(`   Equipamentos com múltiplas vinculações: ${comMultiplas}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

investigar();
