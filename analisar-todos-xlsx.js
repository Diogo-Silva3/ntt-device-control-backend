const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const caminhoBase = 'C:\\Temp\\wickbold';

console.log('📂 Analisando TODOS os arquivos .xlsx\n');
console.log('='.repeat(80) + '\n');

const arquivos = fs.readdirSync(caminhoBase).filter(f => f.endsWith('.xlsx'));

arquivos.forEach(arquivo => {
  try {
    const caminhoCompleto = path.join(caminhoBase, arquivo);
    const workbook = XLSX.readFile(caminhoCompleto);
    
    console.log(`📄 ${arquivo}`);
    console.log(`   Abas: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      
      if (dados.length === 0) {
        console.log(`   ├─ Aba "${sheetName}": vazia`);
        return;
      }
      
      const colunas = Object.keys(dados[0]);
      console.log(`   ├─ Aba "${sheetName}": ${dados.length} linhas`);
      console.log(`   │  Colunas: ${colunas.join(', ')}`);
      
      // Verificar se tem coluna ATIVO
      const temAtivo = colunas.some(col => col.toUpperCase().includes('ATIVO'));
      if (temAtivo) {
        console.log(`   │  ✅ TEM COLUNA ATIVO!`);
        
        // Mostrar valores únicos em ATIVO
        const colAtivo = colunas.find(col => col.toUpperCase().includes('ATIVO'));
        const valoresAtivo = new Set(dados.map(d => d[colAtivo]?.toString().trim()).filter(v => v));
        console.log(`   │  Valores em "${colAtivo}": ${Array.from(valoresAtivo).join(', ')}`);
      }
      
      // Mostrar primeiras 2 linhas
      console.log(`   │  Primeiras 2 linhas:`);
      dados.slice(0, 2).forEach((linha, idx) => {
        const resumo = Object.entries(linha)
          .slice(0, 3)
          .map(([k, v]) => `${k}="${v}"`)
          .join(', ');
        console.log(`   │    ${idx + 1}. ${resumo}...`);
      });
    });
    
    console.log();
  } catch (erro) {
    console.log(`❌ ${arquivo}: ${erro.message}\n`);
  }
});

console.log('='.repeat(80));
console.log('✨ Análise concluída!');
