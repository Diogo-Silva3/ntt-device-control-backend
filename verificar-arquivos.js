const XLSX = require('xlsx');
const path = require('path');

const caminhoBase = 'C:\\Temp\\wickbold';

const arquivos = [
  'Colaboradores.xlsx',
  'Relação usuários por unidade.xlsx',
  'modelo_colaboradores.xlsx'
];

console.log('📂 Verificando arquivos...\n');

arquivos.forEach(arquivo => {
  try {
    const caminhoCompleto = path.join(caminhoBase, arquivo);
    const workbook = XLSX.readFile(caminhoCompleto);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📄 ${arquivo}`);
    console.log(`   Linhas: ${dados.length}`);
    console.log(`   Colunas: ${Object.keys(dados[0] || {}).join(', ')}`);
    console.log(`   Primeiras 2 linhas:`);
    
    dados.slice(0, 2).forEach((linha, idx) => {
      console.log(`     ${idx + 1}: ${JSON.stringify(linha).substring(0, 100)}...`);
    });
    console.log();
  } catch (erro) {
    console.log(`❌ ${arquivo}: ${erro.message}\n`);
  }
});
