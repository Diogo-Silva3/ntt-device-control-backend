const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const ARQUIVO = path.join(__dirname, '..', 'template-celulares-2026.xlsx');

// Ler arquivo
const workbook = XLSX.readFile(ARQUIVO);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

console.log('📊 ANÁLISE DE UNIDADES NA PLANILHA\n');

// Agrupar por unidade
const unidades = {};
dados.forEach((linha, idx) => {
  const unidade = linha['Unidade'] || 'SEM UNIDADE';
  if (!unidades[unidade]) {
    unidades[unidade] = [];
  }
  unidades[unidade].push(idx + 2);
});

console.log('Unidades encontradas na planilha:\n');
Object.entries(unidades).forEach(([unidade, linhas]) => {
  console.log(`${unidade}: ${linhas.length} equipamentos`);
  console.log(`  Linhas: ${linhas.slice(0, 5).join(', ')}${linhas.length > 5 ? '...' : ''}\n`);
});
