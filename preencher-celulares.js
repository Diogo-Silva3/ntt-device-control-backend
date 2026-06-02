const XLSX = require('xlsx');

// Números de série fornecidos
const numerosRaw = `3586808126471853586808126472013586808126533323586808126539933586808126545793586808126534643586808126531913586808126542313586808126533813586808126537793586808126361473586808126528133,58681E+143586808126430933586808126766303,58681E+143,58681E+143586808126926033586808126331853586808126761843586808126497023586808126416593,58681E+143586808126473593586808126544963586808126747753586808126465423,58681E+143586808126667303586808126347613586808126680583,58681E+143,58681E+14358680812654587358680812666763358680812654249358680812679907`;

// Limpar e separar os números
const numeros = numerosRaw
  .split(',')
  .map(n => n.trim())
  .filter(n => n && n !== '58681E+14')
  .map(n => n.replace(/,/g, '').trim());

console.log(`Total de números encontrados: ${numeros.length}`);

// Criar dados
const dados = numeros.map((serie, idx) => ({
  'N° Série': serie,
  'Marca': 'Samsung',
  'Modelo': 'Galaxy A13',
  'Tipo': 'Celular',
  'Unidade': 'RAPOSO',
  'Projeto': 'TECH REFRESH CELULARES 2026',
  'Patrimônio': `CEL-${String(idx + 1).padStart(4, '0')}`,
  'Status': 'DISPONIVEL',
  'Observação': ''
}));

// Criar workbook
const ws = XLSX.utils.json_to_sheet(dados);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Celulares');

// Formatar coluna N° Série como texto
for (let i = 2; i <= dados.length + 1; i++) {
  const cellRef = `A${i}`;
  if (ws[cellRef]) {
    ws[cellRef].t = 's';
  }
}

// Ajustar largura das colunas
ws['!cols'] = [
  { wch: 20 }, // N° Série
  { wch: 15 }, // Marca
  { wch: 20 }, // Modelo
  { wch: 12 }, // Tipo
  { wch: 15 }, // Unidade
  { wch: 30 }, // Projeto
  { wch: 12 }, // Patrimônio
  { wch: 12 }, // Status
  { wch: 30 }  // Observação
];

// Salvar arquivo
XLSX.writeFile(wb, 'template-celulares-2026.xlsx');
console.log(`✅ Planilha criada com ${dados.length} celulares!`);
