/**
 * Middleware para validar integridade de agendamentos
 * Garante que equipamentos agendados sempre têm statusProcesso correto
 */

const prisma = require('../config/prisma');

const validarAgendamento = async (req, res, next) => {
  try {
    const { agendamento, statusProcesso } = req.body;
    
    // Se está agendando, validar que statusProcesso é 'Agendado para Entrega'
    if (agendamento && statusProcesso !== 'Agendado para Entrega') {
      return res.status(400).json({
        error: 'Erro de validação: Quando agendando, statusProcesso deve ser "Agendado para Entrega"'
      });
    }
    
    // Se statusProcesso é 'Agendado para Entrega', deve ter agendamento
    if (statusProcesso === 'Agendado para Entrega' && !agendamento) {
      return res.status(400).json({
        error: 'Erro de validação: statusProcesso "Agendado para Entrega" requer agendamento'
      });
    }
    
    // NOVO: Se tem agendamento, DEVE ter colaboradorId
    if (agendamento && !agendamento.colaboradorId) {
      return res.status(400).json({
        error: 'Erro de validação: Agendamento requer um colaborador selecionado'
      });
    }
    
    // NOVO: Se tem agendamento, DEVE ter data
    if (agendamento && !agendamento.data) {
      return res.status(400).json({
        error: 'Erro de validação: Agendamento requer uma data'
      });
    }
    
    next();
  } catch (err) {
    console.error('Erro no middleware de validação:', err);
    res.status(500).json({ error: 'Erro ao validar agendamento' });
  }
};

/**
 * Função para verificar e corrigir inconsistências
 */
const corrigirInconsistencias = async (empresaId) => {
  try {
    console.log(`[VALIDAÇÃO] Verificando inconsistências para empresa ${empresaId}...`);
    
    // Encontrar equipamentos com agendamento mas sem statusProcesso correto
    const problemas = await prisma.equipamento.findMany({
      where: {
        empresaId,
        agendamento: { not: null },
        statusProcesso: { not: 'Agendado para Entrega' }
      }
    });
    
    if (problemas.length > 0) {
      console.log(`[VALIDAÇÃO] Encontrados ${problemas.length} equipamento(s) com inconsistência`);
      
      // Corrigir automaticamente
      for (const eq of problemas) {
        await prisma.equipamento.update({
          where: { id: eq.id },
          data: { statusProcesso: 'Agendado para Entrega' }
        });
        console.log(`[VALIDAÇÃO] Corrigido: ${eq.serialNumber}`);
      }
    }
    
    // Encontrar equipamentos com statusProcesso 'Agendado para Entrega' mas sem agendamento
    const semAgendamento = await prisma.equipamento.findMany({
      where: {
        empresaId,
        statusProcesso: 'Agendado para Entrega',
        agendamento: null
      }
    });
    
    if (semAgendamento.length > 0) {
      console.log(`[VALIDAÇÃO] Encontrados ${semAgendamento.length} equipamento(s) agendado(s) sem dados de agendamento`);
      // Isso é um problema mais grave - logar para investigação manual
      semAgendamento.forEach(eq => {
        console.warn(`[VALIDAÇÃO] ALERTA: ${eq.serialNumber} está marcado como agendado mas sem dados`);
      });
    }
    
  } catch (err) {
    console.error('[VALIDAÇÃO] Erro ao corrigir inconsistências:', err.message);
  }
};

module.exports = { validarAgendamento, corrigirInconsistencias };
