const XLSX = require('xlsx');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'template-celulares-2026.xlsx');

// Ler arquivo
const workbook = XLSX.readFile(ARQUIVO);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

console.log('📊 ANÁLISE DA PLANILHA');
console.log(`Total de linhas: ${dados.length}\n`);

// Mostrar primeiras 5 linhas
console.log('Primeiras 5 linhas:');
dados.slice(0, 5).forEach((linha, idx) => {
  console.log(`\nLinha ${idx + 2}:`);
  Object.entries(linha).forEach(([chave, valor]) => {
    console.log(`  ${chave}: ${valor}`);
  });
});

// Analisar coluna de Projeto
console.log('\n\n📋 ANÁLISE DE PROJETOS:');
const projetos = {};
dados.forEach((linha, idx) => {
  const projeto = linha['Projeto'] || 'SEM PROJETO';
  if (!projetos[projeto]) {
    projetos[projeto] = [];
  }
  projetos[projeto].push(idx + 2);
});

Object.entries(projetos).forEach(([projeto, linhas]) => {
  console.log(`\n${projeto}: ${linhas.length} equipamentos`);
  console.log(`  Linhas: ${linhas.slice(0, 5).join(', ')}${linhas.length > 5 ? '...' : ''}`);
});

// Mostrar colunas disponíveis
console.log('\n\n📝 COLUNAS DISPONÍVEIS:');
if (dados.length > 0) {
  Object.keys(dados[0]).forEach(col => {
    console.log(`  - ${col}`);
  });
}
