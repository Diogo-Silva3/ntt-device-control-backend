const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join('C:\\Temp\\wickbold', 'Colaboradores.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  console.log('📋 Abas disponíveis:', workbook.SheetNames);
  
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const dados = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('\n📊 Primeiras 3 linhas:');
  console.log(JSON.stringify(dados.slice(0, 3), null, 2));
  
  console.log('\n🔑 Colunas encontradas:');
  if (dados.length > 0) {
    console.log(Object.keys(dados[0]));
  }
  
} catch (err) {
  console.error('❌ Erro:', err.message);
}
