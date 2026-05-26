const XLSX = require('xlsx');

const caminhoArquivo = 'C:\\Temp\\wickbold\\Colaboradores.xlsx';

const workbook = XLSX.readFile(caminhoArquivo);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

console.log('📄 Verificando TODAS as colunas do arquivo\n');

// Ler range completo
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log(`Range: ${worksheet['!ref']}`);
console.log(`Colunas: A até ${String.fromCharCode(65 + range.e.c)}`);
console.log(`Linhas: 1 até ${range.e.r + 1}\n`);

// Ler primeira linha para ver headers
const headers = [];
for (let c = range.s.c; c <= range.e.c; c++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: c });
  const cell = worksheet[cellAddress];
  headers.push(cell ? cell.v : `Col${c}`);
}

console.log('Headers encontrados:');
headers.forEach((h, idx) => {
  console.log(`  Coluna ${String.fromCharCode(65 + idx)}: "${h}"`);
});

console.log('\nPrimeiras 3 linhas de dados:');
for (let r = 1; r <= 3; r++) {
  console.log(`\nLinha ${r + 1}:`);
  for (let c = 0; c < headers.length; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
    const cell = worksheet[cellAddress];
    const valor = cell ? cell.v : '';
    console.log(`  ${headers[c]}: "${valor}"`);
  }
}
