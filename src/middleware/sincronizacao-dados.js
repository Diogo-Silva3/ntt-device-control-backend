/**
 * Middleware de Sincronização de Dados
 * Garante que dados críticos estão sempre sincronizados
 * Funciona independente do projeto, cliente ou contexto
 */

const prisma = require('../config/prisma');

/**
 * Regras de Sincronização Críticas
 * Se uma regra for violada, o sistema corrige automaticamente
 */
const REGRAS_SINCRONIZACAO = [
  // Regra removida: Agendamento-StatusProcesso (causava reversão automática de dados)
  // Regra removida: StatusProcesso-Agendamento (causava reversão automática de dados)
  {
    nome: 'DataEntrega-Agendamento',
    descricao: 'dataEntrega deve sincronizar com agendamento.data',
    validar: async (eq) => {
      if (eq.agendamento && eq.statusProcesso === 'Agendado para Entrega') {
        const agend = typeof eq.agendamento === 'string' ? JSON.parse(eq.agendamento) : eq.agendamento;
        if (agend.data) {
          const dataAgend = new Date(agend.data).toISOString().split('T')[0];
          const dataEnt = eq.dataEntrega ? new Date(eq.dataEntrega).toISOString().split('T')[0] : null;
          
          if (dataAgend !== dataEnt) {
            return {
              violado: true,
              problema: `Equipamento ${eq.serialNumber}: dataEntrega=${dataEnt} mas agendamento.data=${dataAgend}`,
              correcao: { dataEntrega: new Date(agend.data) }
            };
          }
        }
      }
      return { violado: false };
    }
  },
  {
    nome: 'Status-StatusProcesso',
    descricao: 'status deve estar sincronizado com statusProcesso',
    validar: async (eq) => {
      const statusEsperado = statusParaProcesso(eq.statusProcesso);
      if (statusEsperado && eq.status !== statusEsperado) {
        return {
          violado: true,
          problema: `Equipamento ${eq.serialNumber}: status=${eq.status} mas statusProcesso=${eq.statusProcesso} (esperado: ${statusEsperado})`,
          correcao: { status: statusEsperado }
        };
      }
      return { violado: false };
    }
  }
];

/**
 * Mapeia statusProcesso para status físico
 */
function statusParaProcesso(statusProcesso) {
  if (!statusProcesso) return undefined;
  if (['Entregue ao Usuário', 'Em Uso'].includes(statusProcesso)) return 'EM_USO';
  if (['Baixado'].includes(statusProcesso)) return 'DESCARTADO';
  if (['Em Manutenção'].includes(statusProcesso)) return 'MANUTENCAO';
  return 'DISPONIVEL';
}

/**
 * Verifica e corrige sincronização para uma empresa
 */
const verificarSincronizacao = async (empresaId) => {
  try {
    console.log(`\n[SINCRONIZAÇÃO] Iniciando verificação para empresa ${empresaId}...`);
    
    const equipamentos = await prisma.equipamento.findMany({
      where: { empresaId },
      select: {
        id: true,
        serialNumber: true,
        status: true,
        statusProcesso: true,
        agendamento: true,
        dataEntrega: true
      }
    });
    
    let totalProblemas = 0;
    let totalCorrigidos = 0;
    const problemasGraves = [];
    
    for (const eq of equipamentos) {
      for (const regra of REGRAS_SINCRONIZACAO) {
        const resultado = await regra.validar(eq);
        
        if (resultado.violado) {
          totalProblemas++;
          console.warn(`[SINCRONIZAÇÃO] ✗ ${regra.nome}: ${resultado.problema}`);
          
          if (resultado.correcao) {
            // Corrigir automaticamente
            await prisma.equipamento.update({
              where: { id: eq.id },
              data: resultado.correcao
            });
            totalCorrigidos++;
            console.log(`[SINCRONIZAÇÃO] ✓ Corrigido: ${eq.serialNumber}`);
          } else {
            // Problema grave - requer investigação
            problemasGraves.push({
              equipamento: eq.serialNumber,
              regra: regra.nome,
              problema: resultado.problema
            });
            console.error(`[SINCRONIZAÇÃO] ⚠ PROBLEMA GRAVE: ${resultado.problema}`);
          }
        }
      }
    }
    
    console.log(`\n[SINCRONIZAÇÃO] Resumo:`);
    console.log(`  - Total de equipamentos: ${equipamentos.length}`);
    console.log(`  - Problemas encontrados: ${totalProblemas}`);
    console.log(`  - Problemas corrigidos: ${totalCorrigidos}`);
    console.log(`  - Problemas graves: ${problemasGraves.length}`);
    
    if (problemasGraves.length > 0) {
      console.error(`\n[SINCRONIZAÇÃO] PROBLEMAS GRAVES DETECTADOS:`);
      problemasGraves.forEach(p => {
        console.error(`  - ${p.equipamento}: ${p.problema}`);
      });
    }
    
    return {
      totalProblemas,
      totalCorrigidos,
      problemasGraves
    };
    
  } catch (err) {
    console.error('[SINCRONIZAÇÃO] Erro ao verificar sincronização:', err.message);
    throw err;
  }
};

/**
 * Middleware que verifica sincronização antes de retornar dados
 */
const middlewareSincronizacao = async (req, res, next) => {
  try {
    const empresaId = req.usuario?.empresaId;
    
    if (empresaId) {
      // Executar verificação de forma assíncrona (não bloqueia a requisição)
      verificarSincronizacao(empresaId).catch(err => {
        console.error('[SINCRONIZAÇÃO] Erro em background:', err.message);
      });
    }
    
    next();
  } catch (err) {
    console.error('[SINCRONIZAÇÃO] Erro no middleware:', err.message);
    next(); // Continuar mesmo com erro
  }
};

/**
 * Função para executar verificação manual
 */
const executarVerificacaoManual = async (empresaId) => {
  console.log('\n=== VERIFICAÇÃO MANUAL DE SINCRONIZAÇÃO ===');
  const resultado = await verificarSincronizacao(empresaId);
  console.log('\n=== FIM DA VERIFICAÇÃO ===\n');
  return resultado;
};

module.exports = {
  verificarSincronizacao,
  middlewareSincronizacao,
  executarVerificacaoManual,
  REGRAS_SINCRONIZACAO
};
