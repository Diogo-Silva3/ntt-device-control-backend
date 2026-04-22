require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function verDados() {
  try {
    console.log('=== VISUALIZANDO DADOS DO BACKUP (SEM RESTAURAR) ===\n');
    
    const backupFile = 'db_20260420_030001.sql.gz';
    const backupPath = `/var/backups/sistema/${backupFile}`;
    
    console.log(`Backup: ${backupFile}`);
    console.log('Data: 20/04/2026 às 03:00\n');
    
    console.log('Descompactando backup temporariamente...');
    await execAsync(`gunzip -c ${backupPath} > /tmp/backup_temp.sql`);
    
    console.log('\n=== CONTANDO VINCULAÇÕES NO BACKUP ===\n');
    
    // Contar vinculações ENTREGUES do projeto LAPTOP no backup
    const { stdout: entregues } = await execAsync(`
      grep -i "INSERT INTO.*vinculacao" /tmp/backup_temp.sql | 
      grep -i "ENTREGUE" | 
      wc -l
    `);
    
    console.log(`Vinculações ENTREGUES (aproximado): ${entregues.trim()}`);
    
    // Contar vinculações PENDENTES
    const { stdout: pendentes } = await execAsync(`
      grep -i "INSERT INTO.*vinculacao" /tmp/backup_temp.sql | 
      grep -i "PENDENTE" | 
      grep -i "true" | 
      wc -l
    `);
    
    console.log(`Vinculações PENDENTES ativas (aproximado): ${pendentes.trim()}`);
    
    console.log('\n⚠️  NOTA: Estes são números aproximados baseados no arquivo SQL.');
    console.log('Para ter certeza, seria necessário restaurar em um banco temporário.\n');
    
    // Limpar arquivo temporário
    await execAsync('rm /tmp/backup_temp.sql');
    
    console.log('=== FIM DA VISUALIZAÇÃO ===');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verDados();
