const XLSX = require('xlsx');

// Apenas cabeçalhos, sem dados
const dados = [];

// Criar workbook
const ws = XLSX.utils.json_to_sheet(dados, {
  header: ['N° Série', 'Marca', 'Modelo', 'Tipo', 'Unidade', 'Projeto', 'Patrimônio', 'Status', 'Observação']
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Celulares');

// Formatar coluna N° Série como texto
ws['A1'].t = 's';

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
XLSX.writeFile(wb, 'template-celulares-2026.xlsx');
console.log('✅ Template vazio criado: template-celulares-2026.xlsx');
