const prisma = require('./src/config/prisma');

async function fix() {
  try {
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }

    // Encontrar equipamentos com 'Softwares Instalados' que têm vinculação entregue
    const equipamentosComSoftwaresInstalados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Softwares Instalados',
        vinculacoes: {
          some: {
            statusEntrega: 'ENTREGUE'
          }
        }
      },
      include: {
        vinculacoes: {
          where: { statusEntrega: 'ENTREGUE' },
          select: { id: true, statusEntrega: true }
        }
      },
      take: 1
    });

    console.log(`Encontrados ${equipamentosComSoftwaresInstalados.length} equipamentos com Softwares Instalados e vinculação ENTREGUE`);

    if (equipamentosComSoftwaresInstalados.length > 0) {
      const equipamento = equipamentosComSoftwaresInstalados[0];
      
      console.log(`Equipamento: ${equipamento.serialNumber}`);
      console.log(`Status atual: ${equipamento.statusProcesso}`);

      const resultado = await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { statusProcesso: 'Entregue ao Usuário' }
      });

      console.log(`Equipamento atualizado para: ${resultado.statusProcesso}`);
    }

    // Verificar os novos valores
    const disponiveis = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Softwares Instalados'
      }
    });

    const entregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    console.log('\n=== NOVOS VALORES ===');
    console.log('Disponíveis:', disponiveis);
    console.log('Entregues:', entregues);
    console.log('Faltam Entregar:', Math.max(0, totalProjeto - entregues));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
