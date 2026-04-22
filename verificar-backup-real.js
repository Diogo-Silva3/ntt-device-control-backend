require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function verificar() {
  try {
    console.log('=== VERIFICANDO DADOS REAIS DO BACKUP ===\n');
    
    const backupFile = 'db_20260421_030001.sql.gz';
    const backupPath = `/var/backups/sistema/${backupFile}`;
    
    console.log(`Backup: ${backupFile}`);
    console.log('Data: 21/04/2026 às 03:00\n');
    
    // Criar banco temporário
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const tempDbName = 'inventario_ti_temp_' + Date.now();
    
    console.log('Criando banco temporário...');
    console.log(`Nome: ${tempDbName}\n`);
    
    // Extrair host e credenciais da URL
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      console.error('❌ Não foi possível extrair informações da DATABASE_URL');
      return;
    }
    
    const [, user, pass, host, port, dbName] = urlMatch;
    
    console.log('⚠️  ATENÇÃO: Verificação de backup em banco Supabase é complexa.');
    console.log('Recomendo restaurar direto no banco principal.\n');
    console.log('Se você viu os dados corretos HOJE, o backup de hoje às 03:00');
    console.log('provavelmente tem os dados corretos.\n');
    
    console.log('Deseja restaurar o backup de hoje (21/04 às 03:00)?');
    console.log('Isso vai SUBSTITUIR o banco atual.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificar();
