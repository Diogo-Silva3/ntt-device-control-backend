require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function restaurar() {
  try {
    console.log('=== RESTAURANDO BACKUP DO SUPABASE ===\n');
    
    const backupFile = 'db_20260419_190228.sql.gz';
    const backupPath = `/var/backups/sistema/${backupFile}`;
    
    console.log(`Backup: ${backupFile}`);
    console.log('Data: 19/04/2026 às 19:02 (SÁBADO)\n');
    
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
