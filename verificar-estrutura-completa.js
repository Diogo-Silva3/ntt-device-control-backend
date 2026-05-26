const XLSX = require('xlsx');

const caminhoArquivo = 'C:\\Temp\\wickbold\\Colaboradores.xlsx';

const workbook = XLSX.readFile(caminhoArquivo);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

console.log('📄 Verificando estrutura completa do arquivo Colaboradores.xlsx\n');

// Ler com opção de manter valores vazios
const dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('Colunas encontradas:', Object.keys(dados[0]));
console.log('\nPrimeiras 5 linhas completas:\n');

dados.slice(0, 5).forEach((linha, idx) => {
  console.log(`Linha ${idx + 2}:`);
  Object.entries(linha).forEach(([col, val]) => {
    console.log(`  ${col}: "${val}"`);
  });
  console.log();
});

// Verificar se tem coluna ATIVO
const temAtivoCol = Object.keys(dados[0]).some(col => col.toUpperCase().includes('ATIVO'));
console.log(`Tem coluna ATIVO? ${temAtivoCol}`);

// Listar todas as colunas
console.log('\nTodas as colunas:');
Object.keys(dados[0]).forEach(col => console.log(`  • ${col}`));
