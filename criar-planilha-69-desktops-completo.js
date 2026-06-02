const XLSX = require('xlsx');

// Todos os 69 desktops com as séries que você passou
const series = [
  'BFMYDJ4', 'J4MYDJ4', '6DMYDJ4', '2FMYDJ4', '8FMYDJ4', '3HMYDJ4', 'C5MYDJ4', '4K7HDJ4', 'H5MYDJ4', 'D4MYDJ4',
  '35MYDJ4', '484MYDJ4', '485MYDJ4', '2K7HDJ4', '426MYDJ4', '495MYDJ4', '9K7HDJ4', '494MYDJ4', '7GMYDJ4', '1JMYDJ4',
  'HFMYDJ4', '4DMYDJ4', '7DMYDJ4', 'DDMYDJ4', '8DMYDJ4', 'FDMYDJ4', 'D5MYDJ4', 'JFMYDJ4', 'BGMYDJ4', 'B5MYDJ4',
  'B4MYDJ4', '5GMYDJ4', '5CMYDJ4', '3CMYDJ4', 'GDMYDJ4', 'G4MYDJ4', '5K7HDJ4', '415MYDJ4', '7J7HDJ4', 'GCMYDJ4',
  'CGMYDJ4', '474MYDJ4', 'HDMYDJ4', 'BDMYDJ4', 'JDMYDJ4', '44FMYDJ4', '46GMYDJ4', '45FMYDJ4', '47FMYDJ4', 'FFMYDJ4',
  '44GMYDJ4', 'CDMYDJ4', '46HMYDJ4', 'DFMYDJ4', '43GMYDJ4', 'FHMYDJ4', '41FMYDJ4', 'DCMYDJ4', '41GMYDJ4', '43DMYDJ4',
  '49FMYDJ4', 'GFMYDJ4', 'FCMYDJ4', 'FGMYDJ4', '44CMYDJ4', '42DMYDJ4', '41BMYDJ4', 'F8MYDJ4', '465MYDJ4'
];

// Preparar dados para planilha
const dados = series.map((serie, idx) => ({
  'N° Série': serie,
  'Marca': 'DELL',
  'Modelo': 'DESKTOP',
  'Tipo': 'DESKTOP',
  'Unidade': 'WB - RJ',
  'Projeto': 'TECH REFRESH DESKTOP 2026',
  'Patrimônio': `DESK-${String(idx + 1).padStart(3, '0')}`,
  'Status': 'DISPONIVEL',
  'Observação': ''
}));

// Criar workbook
const ws = XLSX.utils.json_to_sheet(dados);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Desktops');

// Formatar coluna N° Série como texto
for (let i = 2; i <= dados.length + 1; i++) {
  const cellRef = `A${i}`;
  if (ws[cellRef]) {
    ws[cellRef].t = 's';
  }
}

// Ajustar largura das colunas
ws['!cols'] = [
  { wch: 15 }, // N° Série
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
XLSX.writeFile(wb, 'template-69-desktops-completo.xlsx');
console.log('✅ Planilha criada: template-69-desktops-completo.xlsx');
console.log(`📊 Total de desktops: ${dados.length}`);
console.log('\n📋 Primeiros 5 desktops:');
dados.slice(0, 5).forEach((d, i) => {
  console.log(`${i + 1}. ${d['N° Série']} - ${d.Marca} ${d.Modelo}`);
});
console.log('...');
