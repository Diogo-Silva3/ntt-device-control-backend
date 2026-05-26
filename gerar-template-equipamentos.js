const XLSX = require('xlsx');
const path = require('path');

const seriais = [
  '1ZNT8K4', '6ZNT8K4', '4TNT8K4', 'BXNT8K4', '4QNT8K4', '91PT8K4', 'F0PT8K4', '31PT8K4', 'GQNT8K4', 'BZNT8K4',
  'CPNT8K4', '21PT8K4', 'GXNT8K4', 'GTNT8K4', '4VNT8K4', 'FWNT8K4', '1YNT8K4', '4SNT8K4', 'HZNT8K4', 'BYNT8K4',
  '9YNT8K4', '4XNT8K4', 'D0PT8K4', '8TNT8K4', '1QNT8K4', 'JXNT8K4', '5SNT8K4', '7SNT8K4', 'HVNT8K4', 'CYNT8K4',
  'HQNT8K4', 'GZNT8K4', '20PT8K4', 'JYNT8K4', 'DYNT8K4', 'GYNT8K4', 'BRNT8K4', 'BQNT8K4', '90PT8K4', 'HWNT8K4',
  '4RNT8K4', 'JRNT8K4', 'FYNT8K4', 'FRNT8K4', '3ZNT8K4', '1WNT8K4', 'DWNT8K4', '22PT8K4', 'DRNT8K4', '51PT8K4',
  'J0PT8K4', '9QNT8K4', 'H1PT8K4', 'JZNT8K4', '9PNT8K4'
];

// Criar dados com template
const dados = seriais.map((serial, index) => ({
  'Serial Number': serial,
  'Marca': 'Dell', // Padrão
  'Modelo': 'Pro 14 Plus PB14250', // Padrão
  'Tipo': 'Laptop', // Padrão
  'Unidade': 'WICKBOLD RJ', // Padrão - você edita
  'Projeto': 'TECH REFRESH LAPTOP 2026', // Padrão
  'Patrimônio': '', // Deixar em branco para preencher
  'Status': 'DISPONIVEL', // Padrão
  'Observações': '' // Opcional
}));

// Criar workbook
const ws = XLSX.utils.json_to_sheet(dados);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');

// Ajustar largura das colunas
ws['!cols'] = [
  { wch: 15 }, // Serial Number
  { wch: 12 }, // Marca
  { wch: 25 }, // Modelo
  { wch: 12 }, // Tipo
  { wch: 20 }, // Unidade
  { wch: 25 }, // Projeto
  { wch: 12 }, // Patrimônio
  { wch: 15 }, // Status
  { wch: 30 }  // Observações
];

// Salvar arquivo
const filePath = path.join('C:\\Temp\\wickbold', 'template-equipamentos-importacao.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Planilha gerada com sucesso!`);
console.log(`📁 Arquivo: ${filePath}`);
console.log(`📊 Total de equipamentos: ${seriais.length}`);
console.log(`\n📝 Instruções:`);
console.log(`1. Abra o arquivo no Excel`);
console.log(`2. Edite as colunas conforme necessário:`);
console.log(`   - Marca: Dell, HP, Lenovo, etc`);
console.log(`   - Modelo: Pro 14, EliteBook, etc`);
console.log(`   - Tipo: Laptop, Desktop, Tablet, etc`);
console.log(`   - Unidade: DIADEMA, WICKBOLD RJ, HORTOLÂNDIA, etc`);
console.log(`   - Projeto: TECH REFRESH LAPTOP 2026, etc`);
console.log(`   - Patrimônio: número ou deixar em branco`);
console.log(`   - Status: DISPONIVEL, EM_USO, MANUTENCAO, DESCARTADO`);
console.log(`3. Salve o arquivo`);
console.log(`4. Me avisa quando terminar para eu importar!`);
