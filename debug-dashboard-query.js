const prisma = require('./src/config/prisma');

async function debug() {
  try {
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = null; // Sem projeto
    
    // Query exata do dashboard
    const whereEq = {
      empresaId,
      ...(projetoId && { projetoId }),
    };
    
    console.log('=== Query do Dashboard ===');
    console.log('whereEq:', JSON.stringify(whereEq, null, 2));
    
    const agendados = await prisma.equipamento.count({
      where: { 
        ...whereEq, 
        status: { not: 'DESCARTADO' }, 
        statusProcesso: 'Agendado para Entrega' 
      }
    });
    
    console.log('\nAgendados (sem projeto):', agendados);
    
    // Verificar se H45C9H4 tem projeto
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });
    
    console.log('\nH45C9H4 ProjetoId:', eq.projetoId);
    
    // Se tem projeto, contar com projeto
    if (eq.projetoId) {
      const agendadosComProjeto = await prisma.equipamento.count({
        where: { 
          ...whereEq,
          projetoId: eq.projetoId,
          status: { not: 'DESCARTADO' }, 
          statusProcesso: 'Agendado para Entrega' 
        }
      });
      
      console.log('Agendados (com projeto):', agendadosComProjeto);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
