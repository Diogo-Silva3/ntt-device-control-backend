const XLSX = require('xlsx');
const path = require('path');

try {
  const filePath = path.join('C:\\Temp\\wickbold', 'template-equipamentos-importacao.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const dados = XLSX.utils.sheet_to_json(worksheet);

  console.log('📋 Verificando planilha...\n');
  console.log(`✅ Total de equipamentos: ${dados.length}`);
  console.log(`✅ Colunas encontradas: ${Object.keys(dados[0]).join(', ')}\n`);

  // Validações
  let erros = 0;
  const marcas = new Set();
  const modelos = new Set();
  const tipos = new Set();
  const unidades = new Set();
  const projetos = new Set();
  const status = new Set();

  console.log('🔍 Validando dados:\n');

  dados.forEach((eq, index) => {
    const linha = index + 2; // +2 porque começa em linha 2 (header é linha 1)
    
    if (!eq['Serial Number'] || eq['Serial Number'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Serial Number vazio`);
      erros++;
    }
    if (!eq['Marca'] || eq['Marca'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Marca vazia`);
      erros++;
    }
    if (!eq['Modelo'] || eq['Modelo'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Modelo vazio`);
      erros++;
    }
    if (!eq['Tipo'] || eq['Tipo'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Tipo vazio`);
      erros++;
    }
    if (!eq['Unidade'] || eq['Unidade'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Unidade vazia`);
      erros++;
    }
    if (!eq['Projeto'] || eq['Projeto'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Projeto vazio`);
      erros++;
    }
    if (!eq['Status'] || eq['Status'].toString().trim() === '') {
      console.log(`❌ Linha ${linha}: Status vazio`);
      erros++;
    }

    marcas.add(eq['Marca']?.toString().trim());
    modelos.add(eq['Modelo']?.toString().trim());
    tipos.add(eq['Tipo']?.toString().trim());
    unidades.add(eq['Unidade']?.toString().trim());
    projetos.add(eq['Projeto']?.toString().trim());
    status.add(eq['Status']?.toString().trim());
  });

  if (erros === 0) {
    console.log('✅ Nenhum erro encontrado!\n');
  } else {
    console.log(`\n❌ Total de erros: ${erros}\n`);
  }

  console.log('📊 Resumo dos dados:');
  console.log(`   Marcas: ${Array.from(marcas).join(', ')}`);
  console.log(`   Modelos: ${Array.from(modelos).join(', ')}`);
  console.log(`   Tipos: ${Array.from(tipos).join(', ')}`);
  console.log(`   Unidades: ${Array.from(unidades).join(', ')}`);
  console.log(`   Projetos: ${Array.from(projetos).join(', ')}`);
  console.log(`   Status: ${Array.from(status).join(', ')}`);

  console.log('\n' + '='.repeat(80));
  if (erros === 0) {
    console.log('✅ PLANILHA OK! Pronta para importar!');
  } else {
    console.log('❌ PLANILHA COM ERROS! Corrija antes de importar!');
  }
  console.log('='.repeat(80));

} catch (err) {
  console.error('❌ Erro:', err.message);
}
