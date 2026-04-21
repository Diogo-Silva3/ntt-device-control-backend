const prisma = require('./src/config/prisma');

async function debug() {
  try {
    // Simular técnico PEDRO SEVERO
    const usuario = await prisma.usuario.findFirst({
      where: { nome: { contains: 'PEDRO SEVERO' } }
    });
    
    console.log('=== Simulando Dashboard do Técnico ===');
    console.log('Usuário:', usuario.nome);
    console.log('Role:', usuario.role);
    console.log('EmpresaId:', usuario.empresaId);
    
    const empresaId = usuario.empresaId;
    const projetoId = null; // Técnico não envia projeto
    const isAdmin = usuario.role === 'ADMIN' || usuario.role === 'SUPERADMIN';
    const tecnicoId = !isAdmin ? usuario.id : null;
    
    console.log('\nFiltros:');
    console.log('isAdmin:', isAdmin);
    console.log('tecnicoId:', tecnicoId);
    console.log('projetoId:', projetoId);
    
    // Query exata do dashboard
    const whereEq = {
      empresaId,
      ...(projetoId && { projetoId }),
    };
    
    console.log('\nwhereEq:', JSON.stringify(whereEq, null, 2));
    
    const agendados = await prisma.equipamento.count({
      where: { 
        ...whereEq, 
        status: { not: 'DESCARTADO' }, 
        statusProcesso: 'Agendado para Entrega' 
      }
    });
    
    console.log('\nAgendados (dashboard):', agendados);
    
    // Verificar equipamentos agendados
    const eqs = await prisma.equipamento.findMany({
      where: { 
        ...whereEq, 
        status: { not: 'DESCARTADO' }, 
        statusProcesso: 'Agendado para Entrega' 
      },
      select: { serialNumber: true, tecnicoId: true }
    });
    
    console.log('\nEquipamentos agendados:');
    eqs.forEach(eq => {
      console.log(`- ${eq.serialNumber} (tecnicoId: ${eq.tecnicoId})`);
    });
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
