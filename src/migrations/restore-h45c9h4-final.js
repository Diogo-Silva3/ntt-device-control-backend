const prisma = require('../config/prisma');

async function restoreH45C9H4() {
  try {
    console.log('[MIGRATION] Restaurando H45C9H4...');

    // Verificar se H45C9H4 está descartado
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });

    if (!equipamento) {
      console.log('[MIGRATION] H45C9H4 não encontrado');
      return;
    }

    if (equipamento.status === 'DESCARTADO') {
      const resultado = await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { status: 'DISPONIVEL' }
      });

      console.log(`[MIGRATION] H45C9H4 restaurado: ${resultado.status}`);
    } else {
      console.log(`[MIGRATION] H45C9H4 já está com status: ${equipamento.status}`);
    }

  } catch (err) {
    console.error('[MIGRATION] Erro:', err);
  }
}

module.exports = { restoreH45C9H4 };
