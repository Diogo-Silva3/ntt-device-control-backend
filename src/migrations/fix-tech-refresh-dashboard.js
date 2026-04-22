const prisma = require('../config/prisma');

async function fixTechRefreshDashboard() {
  try {
    console.log('[MIGRATION] Iniciando correção do dashboard Tech Refresh...');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });
    
    if (!projeto) {
      console.log('[MIGRATION] Projeto não encontrado');
      return;
    }

    console.log('[MIGRATION] Projeto encontrado:', projeto.nome);

    // Corrigir 6 equipamentos com 'Agendado para Entrega' para 'Entregue ao Usuário'
    const resultado = await prisma.equipamento.updateMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega'
      },
      data: { statusProcesso: 'Entregue ao Usuário' }
    });

    console.log(`[MIGRATION] Atualizados ${resultado.count} equipamentos`);

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
        ativa: true,
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

module.exports = { fixTechRefreshDashboard };
