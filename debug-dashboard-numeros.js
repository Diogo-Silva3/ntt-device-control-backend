const prisma = require('./src/config/prisma');

const debug = async () => {
  try {
    console.log('Debugando números do dashboard...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 1; // TECH REFRESH
    
    // Equipamentos
    console.log('📦 EQUIPAMENTOS:');
    const agendadosEq = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: 'Agendado para Entrega'
      }
    });
    console.log(`   Agendado para Entrega: ${agendadosEq}`);
    
    const entreguesEq = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });
    console.log(`   Entregue ao Usuário + Em Uso: ${entreguesEq}`);
    
    // Vinculações
    console.log('\n🔗 VINCULAÇÕES:');
    const agendadosVinc = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'PENDENTE',
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   PENDENTE: ${agendadosVinc}`);
    
    const entreguesVinc = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'ENTREGUE',
        ativa: true,
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   ENTREGUE (ativa): ${entreguesVinc}`);
    
    const entreguesVincTodas = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'ENTREGUE',
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   ENTREGUE (todas): ${entreguesVincTodas}`);
    
    // Atribuído (vinculações ativas)
    console.log('\n✅ ATRIBUÍDO:');
    const atribuido = await prisma.vinculacao.count({
      where: {
        ativa: true,
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   Vinculações ativas: ${atribuido}`);
    
    console.log('\n📊 RESUMO:');
    console.log(`   Dashboard mostra: Agendadas=42, Entregas=59, Atribuído=59`);
    console.log(`   Equipamentos: Agendado=${agendadosEq}, Entregue=${entreguesEq}`);
    console.log(`   Vinculações: Pendente=${agendadosVinc}, Entregue=${entreguesVinc}, Ativas=${atribuido}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

debug();
