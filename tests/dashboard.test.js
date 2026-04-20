const prisma = require('../src/config/prisma');

/**
 * Testes para garantir que as queries do dashboard estão sincronizadas
 */

async function testarSincronizacaoDashboard() {
  console.log('=== Testando Sincronização do Dashboard ===\n');
  
  try {
    const empresaId = 1; // Ajustar conforme necessário
    
    // Query 1: Agendados (Pipeline)
    const agendados = await prisma.equipamento.count({
      where: {
        empresaId,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega'
      }
    });
    
    // Query 2: Máquinas Agendadas (Tech Refresh)
    const maquinasAgendadas = await prisma.equipamento.count({
      where: {
        empresaId,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega'
      }
    });
    
    console.log(`Pipeline (agendados): ${agendados}`);
    console.log(`Tech Refresh (maquinasAgendadas): ${maquinasAgendadas}`);
    
    if (agendados === maquinasAgendadas) {
      console.log('✓ PASSOU: Valores sincronizados!\n');
    } else {
      console.log('✗ FALHOU: Valores dessincronizados!\n');
      console.log('Equipamentos agendados:');
      const eqs = await prisma.equipamento.findMany({
        where: {
          empresaId,
          statusProcesso: 'Agendado para Entrega'
        },
        select: { id: true, serialNumber: true, status: true, statusProcesso: true }
      });
      console.log(JSON.stringify(eqs, null, 2));
    }
    
    // Teste 2: Verificar se há equipamentos com agendamento mas sem statusProcesso correto
    console.log('\n=== Verificando Equipamentos com Agendamento ===\n');
    const comAgendamento = await prisma.equipamento.findMany({
      where: {
        empresaId,
        agendamento: { not: null }
      },
      select: { id: true, serialNumber: true, statusProcesso: true, agendamento: true }
    });
    
    console.log(`Total com agendamento: ${comAgendamento.length}`);
    comAgendamento.forEach(eq => {
      const agend = JSON.parse(eq.agendamento);
      console.log(`- ${eq.serialNumber}: statusProcesso=${eq.statusProcesso}, data=${agend.data}`);
    });
    
    // Teste 3: Verificar integridade de dados
    console.log('\n=== Verificando Integridade de Dados ===\n');
    const problemas = await prisma.equipamento.findMany({
      where: {
        empresaId,
        OR: [
          { statusProcesso: 'Agendado para Entrega', agendamento: null },
          { agendamento: { not: null }, statusProcesso: { not: 'Agendado para Entrega' } }
        ]
      },
      select: { id: true, serialNumber: true, statusProcesso: true, agendamento: true }
    });
    
    if (problemas.length === 0) {
      console.log('✓ PASSOU: Nenhum problema de integridade encontrado!\n');
    } else {
      console.log(`✗ FALHOU: ${problemas.length} equipamento(s) com problema(s):\n`);
      problemas.forEach(eq => {
        console.log(`- ${eq.serialNumber}: statusProcesso=${eq.statusProcesso}, agendamento=${eq.agendamento ? 'SIM' : 'NÃO'}`);
      });
    }
    
  } catch (err) {
    console.error('Erro ao testar:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testarSincronizacaoDashboard();
