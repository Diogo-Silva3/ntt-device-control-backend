require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function restaurar() {
  try {
    console.log('=== RESTAURANDO BACKUP DO POSTGRES ===\n');

    const backupFile = '/var/backups/postgres/backup_20260421_020001.sql.gz';
    
    console.log(`Backup a ser restaurado: ${backupFile}`);
    console.log('Data do backup: 21/04/2026 às 02:00 (ANTES das deleções)\n');

    console.log('⚠️  ATENÇÃO: Este processo vai:');
    console.log('   1. Extrair o backup');
    console.log('   2. Restaurar APENAS a tabela vinculacoes');
    console.log('   3. Manter todas as outras tabelas intactas\n');

    // Extrair o backup
    console.log('📦 Extraindo backup...');
    await execPromise(`gunzip -c ${backupFile} > /tmp/backup_temp.sql`);
    console.log('✓ Backup extraído\n');

    // Extrair apenas os dados da tabela vinculacoes
    console.log('🔍 Extraindo dados da tabela vinculacoes...');
    await execPromise(`grep -A 10000 "COPY public.vinculacoes" /tmp/backup_temp.sql | grep -B 10000 "^\\\\\\." > /tmp/vinculacoes_backup.sql`);
    console.log('✓ Dados extraídos\n');

    console.log('📋 Verificando dados extraídos...');
    const { stdout } = await execPromise('wc -l /tmp/vinculacoes_backup.sql');
    console.log(`   Linhas no arquivo: ${stdout.trim()}\n`);

    console.log('⚠️  PRÓXIMO PASSO:');
    console.log('   Execute manualmente na VPS:');
    console.log('   1. psql -U postgres -d tech_refresh -c "TRUNCATE TABLE vinculacoes RESTART IDENTITY CASCADE;"');
    console.log('   2. psql -U postgres -d tech_refresh < /tmp/vinculacoes_backup.sql');
    console.log('\n   OU execute o script: restaurar-vinculacoes-manual.sh');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

restaurar();
