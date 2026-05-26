const XLSX = require('xlsx');

const caminhoArquivo = 'C:\\Temp\\wickbold\\Colaboradores.xlsx';

const workbook = XLSX.readFile(caminhoArquivo);

console.log('📄 Arquivo: Colaboradores.xlsx\n');
console.log(`Abas encontradas: ${workbook.SheetNames.join(', ')}\n`);

workbook.SheetNames.forEach(sheetName => {
  console.log('='.repeat(80));
  console.log(`📋 Aba: "${sheetName}"`);
  console.log('='.repeat(80) + '\n');

  const worksheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  console.log(`Total de linhas: ${dados.length}`);
  console.log(`Colunas: ${Object.keys(dados[0]).join(', ')}\n`);

  // Verificar valores únicos em cada coluna
  const colunas = Object.keys(dados[0]);
  
  colunas.forEach(coluna => {
    const valoresUnicos = new Set();
    const valoresComContagem = new Map();

    dados.forEach(d => {
      const valor = d[coluna]?.toString().trim() || 'VAZIO';
      valoresUnicos.add(valor);
      valoresComContagem.set(valor, (valoresComContagem.get(valor) || 0) + 1);
    });

    console.log(`📊 Coluna "${coluna}" (${valoresUnicos.size} valores únicos):`);
    
    // Mostrar top 10 valores
    const top10 = Array.from(valoresComContagem.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    top10.forEach(([valor, qtd]) => {
      const display = valor.length > 50 ? valor.substring(0, 50) + '...' : valor;
      console.log(`   • "${display}": ${qtd}`);
    });

    if (valoresUnicos.size > 10) {
      console.log(`   ... e mais ${valoresUnicos.size - 10} valores`);
    }
    console.log();
  });

  console.log('📋 Primeiras 3 linhas completas:\n');

  dados.slice(0, 3).forEach((linha, idx) => {
    console.log(`Linha ${idx + 2}:`);
    Object.entries(linha).forEach(([col, val]) => {
      const display = val.length > 60 ? val.substring(0, 60) + '...' : val;
      console.log(`  ${col}: "${display}"`);
    });
    console.log();
  });

  console.log('\n');
});

console.log('✨ Verificação concluída!');
