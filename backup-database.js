const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(__dirname, `backup-tech-refresh-${timestamp}.sql`);

const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${backupFile}"`;

console.log('🔄 Criando backup do banco de dados...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao criar backup:', error.message);
    return;
  }

  if (fs.existsSync(backupFile)) {
    const stats = fs.statSync(backupFile);
    console.log(`✅ Backup criado com sucesso!`);
    console.log(`   Arquivo: ${path.basename(backupFile)}`);
    console.log(`   Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error('❌ Arquivo de backup não foi criado');
  }
});
