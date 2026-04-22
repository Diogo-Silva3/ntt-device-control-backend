const prisma = require('./src/config/prisma');

async function debug() {
  try {
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });
    
    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }

    console.log('Projeto:', projeto.nome, 'ID:', projeto.id);

    // Verificar os valores
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

    const atribuidos = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'ENTREGUE',
        equipamento: {
          projetoId: projeto.id
        }
      }
    });

    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    const disponiveis = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Softwares Instalados'
      }
    });

    console.log('\n=== VALORES ATUAIS ===');
    console.log('Total do Projeto:', totalProjeto);
    console.log('Agendados:', agendados);
    console.log('Entregues:', entregues);
    console.log('Atribuídos (vinculações ENTREGUE):', atribuidos);
    console.log('Disponíveis (Softwares Instalados):', disponiveis);
    console.log('Faltam Entregar:', Math.max(0, totalProjeto - entregues));

    console.log('\n=== ESPERADO ===');
    console.log('AGENDADAS: 1');
    console.log('ENTREGAS: 34');
    console.log('ATRIBUÍDO: 34');
    console.log('DISPONÍVEIS: 145');
    console.log('FALTAM ENTREGAR: 145');

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
