const XLSX = require('xlsx');

const caminhoArquivo = 'C:\\Temp\\wickbold\\Colaboradores.xlsx';

const workbook = XLSX.readFile(caminhoArquivo);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

console.log('📄 Verificando coluna ATIVO...\n');
console.log('Colunas encontradas:', Object.keys(dados[0]));
console.log('\nPrimeiras 10 linhas:\n');

dados.slice(0, 10).forEach((linha, idx) => {
  console.log(`${idx + 1}. ${linha.NOME} - ATIVO: "${linha.ATIVO}"`);
});

console.log('\n\nValores únicos na coluna ATIVO:');
const valoresUnicos = new Set(dados.map(d => d.ATIVO));
valoresUnicos.forEach(v => console.log(`  • "${v}"`));

console.log(`\nTotal de colaboradores: ${dados.length}`);
console.log(`Demitidos: ${dados.filter(d => d.ATIVO === 'DEMITIDO').length}`);
console.log(`Ativos: ${dados.filter(d => d.ATIVO !== 'DEMITIDO').length}`);
