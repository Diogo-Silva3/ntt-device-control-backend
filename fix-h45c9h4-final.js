const prisma = require('./src/config/prisma');

async function fix() {
  try {
    // Restaurar H45C9H4 e colocar em 'Agendado para Entrega'
    const resultado = await prisma.equipamento.update({
      where: { serialNumber: 'H45C9H4' },
      data: { 
        status: 'DISPONIVEL',
        statusProcesso: 'Agendado para Entrega'
      }
    });

    console.log(`Equipamento restaurado: ${resultado.serialNumber}`);
    console.log(`Status: ${resultado.status}`);
    console.log(`Status Processo: ${resultado.statusProcesso}`);

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    // Verificar os novos valores
    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    const agendados = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega'
      }
    });

    const entregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    const disponiveis = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Softwares Instalados'
      }
    });

    console.log('\n=== NOVOS VALORES ===');
    console.log('Total do Projeto:', totalProjeto);
    console.log('Agendados:', agendados);
    console.log('Entregues:', entregues);
    console.log('Disponíveis:', disponiveis);
    console.log('Faltam Entregar:', disponiveis);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
