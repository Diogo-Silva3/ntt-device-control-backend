/**
 * Cron Job para Sincronização de Dados
 * Executa verificação de sincronização regularmente
 * Garante que dados críticos estão sempre corretos
 */

const cron = require('node-cron');
const prisma = require('./prisma');
const { verificarSincronizacao } = require('../middleware/sincronizacao-dados');

/**
 * Inicia cron job de sincronização
 * Executa a cada 6 horas
 */
const iniciarCronSincronizacao = () => {
  console.log('[CRON] Iniciando cron job de sincronização...');
  
  // Executa a cada 6 horas (0 */6 * * *)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Executando verificação de sincronização...');
    
    try {
      // Buscar todas as empresas
      const empresas = await prisma.empresa.findMany({
        select: { id: true, nome: true }
      });
      
      for (const empresa of empresas) {
        console.log(`\n[CRON] Verificando empresa: ${empresa.nome} (ID: ${empresa.id})`);
        
        try {
          const resultado = await verificarSincronizacao(empresa.id);
          
          if (resultado.totalProblemas > 0) {
            console.warn(`[CRON] ⚠ Empresa ${empresa.nome}: ${resultado.totalProblemas} problema(s) encontrado(s), ${resultado.totalCorrigidos} corrigido(s)`);
          } else {
            console.log(`[CRON] ✓ Empresa ${empresa.nome}: Tudo sincronizado!`);
          }
          
          if (resultado.problemasGraves.length > 0) {
            console.error(`[CRON] ⚠ PROBLEMAS GRAVES em ${empresa.nome}:`);
            resultado.problemasGraves.forEach(p => {
              console.error(`  - ${p.equipamento}: ${p.problema}`);
            });
          }
        } catch (err) {
          console.error(`[CRON] Erro ao verificar empresa ${empresa.nome}:`, err.message);
        }
      }
      
      console.log('[CRON] Verificação de sincronização concluída!');
      
    } catch (err) {
      console.error('[CRON] Erro ao executar cron de sincronização:', err.message);
    }
  });
  
  console.log('[CRON] Cron job de sincronização iniciado (a cada 6 horas)');
};

module.exports = { iniciarCronSincronizacao };
