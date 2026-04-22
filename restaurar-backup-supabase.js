require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function restaurar() {
  try {
    console.log('=== RESTAURANDO BACKUP DO SUPABASE ===\n');
    
    const backupFile = '/var/backups/postgres/backup_20260418_020001.sql.gz';
    const backupPath = backupFile;
    
    console.log(`Backup: ${backupFile}`);
    console.log('Data: 18/04/2026 às 02:00\n');
    
    // Extrair informações da DATABASE_URL
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL não encontrada no .env');
      return;
    }
    
    console.log('Descompactando backup...');
    await execAsync(`gunzip -c ${backupPath} > /tmp/restore.sql`);
    
    console.log('Restaurando no banco de dados...');
    await execAsync(`psql "${dbUrl}" < /tmp/restore.sql`);
    
    console.log('\n✅ Backup restaurado com sucesso!');
    console.log('Recarregue o dashboard para verificar.');
    
    // Limpar arquivo temporário
    await execAsync('rm /tmp/restore.sql');
    
  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error.message);
  }
}

restaurar();
