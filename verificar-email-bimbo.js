const XLSX = require('xlsx');

const caminhoArquivo = 'C:\\Temp\\wickbold\\E-mail Bimbo - Colaboradores Wickbold.xlsx';

const workbook = XLSX.readFile(caminhoArquivo);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('📄 Arquivo: E-mail Bimbo - Colaboradores Wickbold.xlsx\n');
console.log(`Total de linhas: ${dados.length}`);
console.log(`Colunas: ${Object.keys(dados[0]).join(', ')}\n`);

// Verificar valores únicos em STATUS
const statusUnicos = new Set();
const statusComContagem = new Map();

dados.forEach(d => {
  const status = d['STATUS']?.toString().trim() || 'SEM STATUS';
  statusUnicos.add(status);
  statusComContagem.set(status, (statusComContagem.get(status) || 0) + 1);
});

console.log('📊 Valores únicos em STATUS:');
statusComContagem.forEach((qtd, status) => {
  console.log(`   • "${status}": ${qtd} colaboradores`);
});

console.log('\n📋 Primeiras 5 linhas:\n');

dados.slice(0, 5).forEach((linha, idx) => {
  console.log(`${idx + 1}. ${linha.NOME}`);
  console.log(`   Email: ${linha['E-MAIL']}`);
  console.log(`   Cargo: ${linha.CARGO}`);
  console.log(`   Status: ${linha.STATUS}`);
  console.log(`   Coligada: ${linha.COLIGADA}`);
  console.log();
});

// Verificar se tem UNIDADE
const temUnidade = Object.keys(dados[0]).some(col => col.toUpperCase().includes('UNIDADE'));
console.log(`Tem coluna UNIDADE? ${temUnidade}`);

// Listar todas as colunas
console.log('\nTodas as colunas:');
Object.keys(dados[0]).forEach(col => console.log(`  • ${col}`));
