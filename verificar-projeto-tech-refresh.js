const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    console.log('=== Verificando projeto Tech Refresh ===\n');
    
    const projeto = await prisma.projeto.findFirst({
      where: { 
        nome: { contains: 'TECH REFRESH' }
      }
    });
    
    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }
    
    console.log('Projeto encontrado:');
    console.log(`- ID: ${projeto.id}`);
    console.log(`- Nome: ${projeto.nome}`);
    console.log(`- Empresa: ${projeto.empresaId}`);
    
    // Contar equipamentos agendados neste projeto
    const agendados = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
        status: { not: 'DESCARTADO' }
      }
    });
    
    console.log(`\nEquipamentos agendados neste projeto: ${agendados}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
