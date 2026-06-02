const prisma = require('./src/config/prisma');

const verificar = async () => {
  try {
    console.log('Verificando total de equipamentos - TECH REFRESH LAPTOP 2026...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    
    // Buscar o projeto TECH REFRESH LAPTOP 2026
    const projeto = await prisma.projeto.findFirst({
      where: { 
        empresaId,
        nome: { contains: 'LAPTOP', mode: 'insensitive' }
      }
    });
    
    if (!projeto) {
      console.log('❌ Projeto TECH REFRESH LAPTOP não encontrado');
      return;
    }
    
    console.log(`📦 Projeto encontrado: ${projeto.nome} (ID: ${projeto.id})\n`);
    
    // Total do projeto
    const totalProjeto = await prisma.equipamento.count({
      where: { empresaId, projetoId: projeto.id }
    });
    console.log(`Total de equipamentos: ${totalProjeto}`);
    
    // Breakdown por status
    console.log('\n📋 BREAKDOWN POR STATUS:');
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: { empresaId, projetoId: projeto.id },
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
      where: { empresaId, projetoId: projeto.id },
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
      where: { empresaId, projetoId: projeto.id, status: 'DESCARTADO' }
    });
    console.log(`   Descartados: ${descartados}`);
    
    const naoDescartados = await prisma.equipamento.count({
      where: { empresaId, projetoId: projeto.id, status: { not: 'DESCARTADO' } }
    });
    console.log(`   Não descartados: ${naoDescartados}`);
    
    console.log('\n✅ RESUMO:');
    console.log(`   Dashboard mostra: 235`);
    console.log(`   Total do projeto: ${totalProjeto}`);
    console.log(`   Não descartados: ${naoDescartados}`);
    
    if (totalProjeto === 235) {
      console.log(`   ✅ CORRETO!`);
    } else {
      console.log(`   ❌ DIFERENÇA: ${totalProjeto - 235}`);
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

verificar();
