const prisma = require('./src/config/prisma');

async function corrigir() {
  try {
    console.log('=== Corrigindo histórico do H45C9H4 ===\n');
    
    // Buscar PEDRO SEVERO
    const pedro = await prisma.usuario.findFirst({
      where: { 
        nome: { contains: 'PEDRO SEVERO' }
      }
    });
    
    if (!pedro) {
      console.log('PEDRO SEVERO não encontrado');
      return;
    }
    
    console.log(`PEDRO SEVERO encontrado - ID: ${pedro.id}\n`);
    
    // Buscar H45C9H4
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    if (!eq) {
      console.log('H45C9H4 não encontrado');
      return;
    }
    
    console.log(`H45C9H4 encontrado - ID: ${eq.id}\n`);
    
    // Atualizar histórico de etapas para colocar PEDRO SEVERO
    let etapasLog = [];
    try {
      etapasLog = eq.historicoEtapas ? JSON.parse(eq.historicoEtapas) : [];
    } catch {
      etapasLog = [];
    }
    
    if (!Array.isArray(etapasLog)) etapasLog = [];
    
    // Atualizar todos os registros de histórico para PEDRO SEVERO
    etapasLog = etapasLog.map(log => ({
      ...log,
      tecnicoId: pedro.id,
      tecnicoNome: pedro.nome
    }));
    
    await prisma.equipamento.update({
      where: { id: eq.id },
      data: { historicoEtapas: JSON.stringify(etapasLog) }
    });
    
    console.log('✓ Histórico de etapas atualizado para PEDRO SEVERO');
    
    // Atualizar logs de auditoria
    const logs = await prisma.historico.findMany({
      where: { equipamentoId: eq.id }
    });
    
    console.log(`\nAtualizando ${logs.length} registros de auditoria...`);
    
    for (const log of logs) {
      await prisma.historico.update({
        where: { id: log.id },
        data: { usuarioId: pedro.id }
      });
    }
    
    console.log(`✓ ${logs.length} registros de auditoria atualizados para PEDRO SEVERO`);
    
    console.log('\n✓ Histórico corrigido com sucesso!');
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
