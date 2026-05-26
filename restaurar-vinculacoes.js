// Script para restaurar as vinculações que foram desativadas incorretamente
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restaurarVinculacoes() {
  try {
    console.log('🔄 Restaurando vinculações que foram desativadas incorretamente...\n');

    // Lista dos equipamentos que foram desativados incorretamente
    const equipamentosParaRestaurar = [
      { id: 631, serie: '715C9H4', usuarioId: null }, // EVERTON ALVES PEREIRA VIANNA
      { id: 684, serie: '875C9H4', usuarioId: null }, // VANESSA DE ALMEIDA DUARTE
      { id: 549, serie: '635C9H4', usuarioId: null }, // GABRIELLY COSTA DA SILVA SANTANA
      { id: 635, serie: 'H15C9H4', usuarioId: null }, // LORENA ALVES DE ALCANTARA
      { id: 640, serie: 'F15C9H4', usuarioId: null }, // GLADYS DA COSTA REZENDE AIGNER
      { id: 641, serie: '725C9H4', usuarioId: null }, // RENATO LACERDA MAFFRA
      { id: 639, serie: 'H65C9H4', usuarioId: null }, // FERNANDA PESSANHA DA SILVA
      { id: 637, serie: '175C9H4', usuarioId: null }, // ANTONIO RICARDO ALVES HIR
      { id: 620, serie: '8X3C9H4', usuarioId: null }, // FATIMA CRISTINA MATTOS DE BESSA
      { id: 679, serie: '785C9H4', usuarioId: null }, // SIMONE BREZINSCK TEIXEIRA
      { id: 558, serie: '965C9H4', usuarioId: null }, // LARISSA PECCIN MELO
      { id: 560, serie: 'J45C9H4', usuarioId: null }, // KARINE CHRISTINE MONTEIRO DE ARRUDA
    ];

    let restauradas = 0;

    for (const eq of equipamentosParaRestaurar) {
      // Buscar a vinculação desativada
      const vinculacao = await prisma.vinculacao.findFirst({
        where: {
          equipamentoId: eq.id,
          ativa: false,
          statusEntrega: 'PENDENTE'
        },
        orderBy: { dataFim: 'desc' }
      });

      if (vinculacao) {
        // Restaurar a vinculação
        await prisma.vinculacao.update({
          where: { id: vinculacao.id },
          data: {
            ativa: true,
            dataFim: null
          }
        });

        console.log(`✓ ${eq.serie} (ID: ${eq.id}) - Vinculação restaurada`);
        restauradas++;
      } else {
        console.log(`⚠️ ${eq.serie} (ID: ${eq.id}) - Vinculação não encontrada`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✓ Restauração concluída: ${restauradas} vinculações restauradas`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restaurarVinculacoes();
