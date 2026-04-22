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
      WHERE acao LIKE '%vincula%' OR acao LIKE '%entrega%' OR descricao LIKE '%vincula%' OR descricao LIKE '%entrega%'
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    console.log(`\n\nRegistros de vinculações no histórico: ${historicos.length}\n`);

    if (historicos.length > 0) {
      historicos.forEach((h, i) => {
        console.log(`${i + 1}. Ação: ${h.acao || 'N/A'}`);
        console.log(`   Descrição: ${h.descricao || 'N/A'}`);
        console.log(`   Data: ${h.created_at || h.data_inicio || 'N/A'}`);
        console.log(`   Equipamento ID: ${h.equipamento_id || 'N/A'}`);
        console.log(`   Usuário ID: ${h.usuario_id || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('Nenhum registro de vinculação encontrado no histórico.');
    }

    console.log('\n=== FIM ===');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
