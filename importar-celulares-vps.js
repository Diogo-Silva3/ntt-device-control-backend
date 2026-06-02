const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração
const VPS_URL = 'http://187.127.8.112:3000'; // Ajuste a porta se necessário
const TOKEN = process.env.API_TOKEN || ''; // Você precisa fornecer o token
const ARQUIVO = path.join(__dirname, '..', 'template-celulares-2026.xlsx');
const PROJETO_ID = process.env.PROJETO_ID || null; // ID do projeto TECH REFRESH CELULARES 2026

async function importarCelulares() {
  try {
    console.log('📱 Iniciando importação de celulares...');
    console.log(`📁 Arquivo: ${ARQUIVO}`);
    console.log(`🌐 VPS: ${VPS_URL}`);

    // Verificar se arquivo existe
    if (!fs.existsSync(ARQUIVO)) {
      console.error(`❌ Arquivo não encontrado: ${ARQUIVO}`);
      process.exit(1);
    }

    // Criar FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(ARQUIVO));
    if (PROJETO_ID) {
      form.append('projetoId', PROJETO_ID);
    }

    // Fazer requisição
    const response = await axios.post(
      `${VPS_URL}/api/importacao/equipamentos`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${TOKEN}`
        },
        timeout: 30000
      }
    );

    console.log('✅ Importação concluída com sucesso!');
    console.log('📊 Resultado:', response.data);

    if (response.data.detalhes) {
      console.log('\n📋 Detalhes:');
      response.data.detalhes.forEach(d => {
        console.log(`  - Linha ${d.linha}: ${d.status} ${d.motivo || ''}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro na importação:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

importarCelulares();
