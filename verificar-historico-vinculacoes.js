require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO HISTÓRICO DE VINCULAÇÕES ===\n');

    // Verificar estrutura da tabela historicos
    const colunas = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'historicos'
      ORDER BY ordinal_position
    `;

    console.log('Estrutura da tabela historicos:\n');
    colunas.forEach(c => {
      console.log(`- ${c.column_name}: ${c.data_type}`);
    });

    // Buscar registros recentes de vinculações
    const historicos = await prisma.$queryRaw`
      SELECT * FROM historicos 
      WHERE tipo LIKE '%vincula%' OR tipo LIKE '%entrega%'
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    console.log(`\n\nRegistros de vinculações no histórico: ${historicos.length}\n`);

    if (historicos.length > 0) {
      historicos.forEach((h, i) => {
        console.log(`${i + 1}. Tipo: ${h.tipo || 'N/A'}`);
        console.log(`   Data: ${h.created_at || h.data || 'N/A'}`);
        console.log(`   Dados: ${JSON.stringify(h).substring(0, 200)}`);
        console.log('');
      });
    }

    console.log('\n=== FIM ===');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
