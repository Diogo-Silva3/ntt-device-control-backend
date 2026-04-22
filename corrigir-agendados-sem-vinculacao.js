require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO AGENDADOS SEM VINCULAÇÃO ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar equipamentos "Agendado para Entrega" SEM vinculação ativa
    const equipamentosSemVinculacao = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
        vinculacoes: {
          none: { ativa: true },
        },
      },
    });

    console.log(`Equipamentos sem vinculação: ${equipamentosSemVinculacao.length}\n`);

    for (const eq of equipamentosSemVinculacao) {
      console.log(`${eq.serialNumber}:`);
      console.log(`  De: Agendado para Entrega`);
      console.log(`  Para: Softwares Instalados`);

      await prisma.equipamento.update({
        where: { id: eq.id },
        data: {
          statusProcesso: 'Softwares Instalados',
          status: 'DISPONIVEL',
        },
      });

      console.log(`  ✓ Corrigido\n`);
    }

    console.log(`✅ CORREÇÃO CONCLUÍDA!`);
    console.log(`   ${equipamentosSemVinculacao.length} equipamentos corrigidos`);
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
