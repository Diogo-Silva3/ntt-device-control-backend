const XLSX = require('xlsx');

// 22 desktops que faltam
const desktops = [
  { serie: '484MYDJ4' },
  { serie: '485MYDJ4' },
  { serie: '426MYDJ4' },
  { serie: '495MYDJ4' },
  { serie: '494MYDJ4' },
  { serie: '415MYDJ4' },
  { serie: '474MYDJ4' },
  { serie: '44FMYDJ4' },
  { serie: '46GMYDJ4' },
  { serie: '45FMYDJ4' },
  { serie: '47FMYDJ4' },
  { serie: '44GMYDJ4' },
  { serie: '46HMYDJ4' },
  { serie: '43GMYDJ4' },
  { serie: '41FMYDJ4' },
  { serie: '41GMYDJ4' },
  { serie: '43DMYDJ4' },
  { serie: '49FMYDJ4' },
  { serie: '44CMYDJ4' },
  { serie: '42DMYDJ4' },
  { serie: '41BMYDJ4' },
  { serie: '465MYDJ4' }
];

// Preparar dados para planilha
const dados = desktops.map((item, idx) => ({
  'N° Série': item.serie,
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
XLSX.writeFile(wb, 'template-22-desktops.xlsx');
console.log('✅ Planilha criada: template-22-desktops.xlsx');
console.log(`📊 Total de desktops: ${dados.length}`);
