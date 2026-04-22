const prisma = require('./src/config/prisma');

async function fix() {
  try {
    // Encontrar H55C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        serialNumber: 'H55C9H4'
      }
    });

    if (!equipamento) {
      console.log('Equipamento H55C9H4 não encontrado');
      return;
    }

    console.log('Equipamento encontrado:', equipamento.serialNumber);
    console.log('Status atual:', equipamento.statusProcesso);

    // Mudar para 'Agendado para Entrega'
    const resultado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { statusProcesso: 'Agendado para Entrega' }
    });

    console.log('Equipamento atualizado para:', resultado.statusProcesso);

    // Verificar os novos valores
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
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

    const atribuidos = await prisma.equipamento.count({
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
    console.log('Agendados:', agendados);
    console.log('Entregues:', entregues);
    console.log('Atribuídos:', atribuidos);
    console.log('Disponíveis:', disponiveis);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
