require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO TABELAS DE AUDITORIA ===\n');

    // Verificar se existe tabela de auditoria
    const tabelas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('Tabelas no banco de dados:\n');
    tabelas.forEach(t => {
      console.log(`- ${t.table_name}`);
    });

    console.log('\n=== FIM ===');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
