const prisma = require('./src/config/prisma');

const verificar = async () => {
  try {
    console.log('Verificando total de equipamentos...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 1; // TECH REFRESH
    
    // Total geral
    console.log('📊 TOTAL GERAL:');
    const totalGeral = await prisma.equipamento.count({
      where: { empresaId }
    });
    console.log(`   Todos os equipamentos (empresa): ${totalGeral}`);
    
    // Total do projeto
    console.log('\n📦 PROJETO TECH REFRESH:');
    const totalProjeto = await prisma.equipamento.count({
      where: { empresaId, projetoId }
    });
    console.log(`   Total do projeto: ${totalProjeto}`);
    
    // Breakdown por status
    console.log('\n📋 BREAKDOWN POR STATUS:');
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: { empresaId, projetoId },
      _count: true
    });
    
    let totalStatus = 0;
    porStatus.forEach(s => {
      console.log(`   ${s.status}: ${s._count}`);
      totalStatus += s._count;
    });
    console.log(`   Total: ${totalStatus}`);
    
    // Breakdown por statusProcesso
    console.log('\n🔄 BREAKDOWN POR STATUS PROCESSO:');
    const porProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: { empresaId, projetoId },
      _count: true
    });
    
    let totalProcesso = 0;
    porProcesso.forEach(p => {
      console.log(`   ${p.statusProcesso}: ${p._count}`);
      totalProcesso += p._count;
    });
    console.log(`   Total: ${totalProcesso}`);
    
    // Verificar descartados
    console.log('\n🗑️ DESCARTADOS:');
    const descartados = await prisma.equipamento.count({
      where: { empresaId, projetoId, status: 'DESCARTADO' }
    });
    console.log(`   Descartados: ${descartados}`);
    
    const naoDescartados = await prisma.equipamento.count({
      where: { empresaId, projetoId, status: { not: 'DESCARTADO' } }
    });
    console.log(`   Não descartados: ${naoDescartados}`);
    
    console.log('\n✅ RESUMO:');
    console.log(`   Dashboard mostra: 235`);
    console.log(`   Total do projeto: ${totalProjeto}`);
    console.log(`   Não descartados: ${naoDescartados}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

verificar();
