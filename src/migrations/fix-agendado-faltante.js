const prisma = require('../config/prisma');

async function fixAgendadoFaltante() {
  try {
    console.log('[MIGRATION] Corrigindo equipamento agendado faltante...');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });
    
    if (!projeto) {
      console.log('[MIGRATION] Projeto não encontrado');
      return;
    }

    // Encontrar equipamentos com vinculação PENDENTE (não entregue)
    const equipamentosComVinculacaoPendente = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          some: {
            statusEntrega: 'PENDENTE'
          }
        }
      },
      include: {
        vinculacoes: {
          where: { statusEntrega: 'PENDENTE' },
          select: { id: true, statusEntrega: true }
        }
      }
    });

    console.log(`[MIGRATION] Encontrados ${equipamentosComVinculacaoPendente.length} equipamentos com vinculação PENDENTE`);

    if (equipamentosComVinculacaoPendente.length > 0) {
      // Pegar o primeiro e mudar para 'Agendado para Entrega'
      const equipamento = equipamentosComVinculacaoPendente[0];
      
      const resultado = await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { statusProcesso: 'Agendado para Entrega' }
      });

      console.log(`[MIGRATION] Equipamento ${resultado.serialNumber} atualizado para 'Agendado para Entrega'`);
    }

    // Encontrar 1 equipamento com 'Softwares Instalados' que deveria estar em outro status
    // e mudar para 'Entregue ao Usuário' se tiver vinculação entregue
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
      take: 1
    });

    if (equipamentosComSoftwaresInstalados.length > 0) {
      const equipamento = equipamentosComSoftwaresInstalados[0];
      
      const resultado = await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { statusProcesso: 'Entregue ao Usuário' }
      });

      console.log(`[MIGRATION] Equipamento ${resultado.serialNumber} atualizado de 'Softwares Instalados' para 'Entregue ao Usuário'`);
    }

    // Verificar os novos valores
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

    console.log('[MIGRATION] Valores finais:');
    console.log(`  - Agendados: ${agendados}`);
    console.log(`  - Entregues: ${entregues}`);
    console.log(`  - Atribuídos: ${atribuidos}`);
    console.log(`  - Faltam Entregar: ${Math.max(0, totalProjeto - entregues)}`);

  } catch (err) {
    console.error('[MIGRATION] Erro:', err);
  }
}

module.exports = { fixAgendadoFaltante };
