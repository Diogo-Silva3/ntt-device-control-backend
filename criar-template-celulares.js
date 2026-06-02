const XLSX = require('xlsx');
const path = require('path');

// Dados do template
const dados = [
  {
    'N° Série': 'EXEMPLO001',
    'Marca': 'Samsung',
    'Modelo': 'Galaxy A13',
    'Tipo': 'Celular',
    'Unidade': 'RAPOSO',
    'Projeto': 'TECH REFRESH CELULARES 2026',
    'Patrimônio': 'CEL-001',
    'Status': 'DISPONIVEL',
    'Observação': 'Exemplo de celular'
  },
  {
    'N° Série': 'EXEMPLO002',
    'Marca': 'Apple',
    'Modelo': 'iPhone 12',
    'Tipo': 'Celular',
    'Unidade': 'RAPOSO',
    'Projeto': 'TECH REFRESH CELULARES 2026',
    'Patrimônio': 'CEL-002',
    'Status': 'DISPONIVEL',
    'Observação': 'Exemplo de celular'
  },
  {
    'N° Série': 'EXEMPLO003',
    'Marca': 'Motorola',
    'Modelo': 'Moto G31',
    'Tipo': 'Celular',
    'Unidade': 'RAPOSO',
    'Projeto': 'TECH REFRESH CELULARES 2026',
    'Patrimônio': 'CEL-003',
    'Status': 'DISPONIVEL',
    'Observação': 'Exemplo de celular'
  }
];

// Criar workbook
const ws = XLSX.utils.json_to_sheet(dados);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Celulares');

// Formatar coluna N° Série como texto
for (let i = 2; i <= dados.length + 1; i++) {
  const cellRef = `A${i}`;
  if (ws[cellRef]) {
    ws[cellRef].t = 's'; // 's' = string/texto
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
XLSX.writeFile(wb, 'template-celulares-2026.xlsx');
console.log('✅ Template criado: template-celulares-2026.xlsx');
