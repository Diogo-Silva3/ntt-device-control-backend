const XLSX = require('xlsx');
const path = require('path');

const caminhoBase = 'C:\\Temp\\wickbold';

console.log('📊 Comparando arquivos Colaboradores.xlsx vs modelo_colaboradores.xlsx\n');

// Ler Colaboradores.xlsx
const workbook1 = XLSX.readFile(path.join(caminhoBase, 'Colaboradores.xlsx'));
const dados1 = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);

// Ler modelo_colaboradores.xlsx
const workbook2 = XLSX.readFile(path.join(caminhoBase, 'modelo_colaboradores.xlsx'));
const dados2 = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]);

console.log(`📄 Colaboradores.xlsx: ${dados1.length} linhas`);
console.log(`   Colunas: ${Object.keys(dados1[0]).join(', ')}\n`);

console.log(`📄 modelo_colaboradores.xlsx: ${dados2.length} linhas`);
console.log(`   Colunas: ${Object.keys(dados2[0]).join(', ')}\n`);

// Criar mapas de emails
const emailsColaboradores = new Map();
const emailsModelo = new Map();

dados1.forEach(d => {
  const email = d['E-MAIL']?.toString().toLowerCase().trim();
  if (email) {
    emailsColaboradores.set(email, {
      nome: d['NOME'],
      cargo: d['CARGO'],
      unidade: d['UNIDADE'],
      ativo: d['ATIVO']
    });
  }
});

dados2.forEach(d => {
  const email = d['E-MAIL']?.toString().toLowerCase().trim();
  if (email) {
    emailsModelo.set(email, {
      nome: d['NOME'],
      funcao: d['FUNCAO']
    });
  }
});

console.log('🔍 ANÁLISE DE CORRESPONDÊNCIA\n');

// Emails em Colaboradores mas não em modelo_colaboradores
const apenasEmColaboradores = [];
emailsColaboradores.forEach((valor, email) => {
  if (!emailsModelo.has(email)) {
    apenasEmColaboradores.push({ email, ...valor });
  }
});

// Emails em modelo_colaboradores mas não em Colaboradores
const apenasEmModelo = [];
emailsModelo.forEach((valor, email) => {
  if (!emailsColaboradores.has(email)) {
    apenasEmModelo.push({ email, ...valor });
  }
});

// Emails em ambos
const emAmbos = [];
emailsColaboradores.forEach((valor, email) => {
  if (emailsModelo.has(email)) {
    emAmbos.push({
      email,
      colaboradores: valor,
      modelo: emailsModelo.get(email)
    });
  }
});

console.log(`✅ Emails em AMBOS os arquivos: ${emAmbos.length}`);
console.log(`❌ Apenas em Colaboradores.xlsx: ${apenasEmColaboradores.length}`);
console.log(`❌ Apenas em modelo_colaboradores.xlsx: ${apenasEmModelo.length}\n`);

if (apenasEmColaboradores.length > 0) {
  console.log('📋 Primeiros 10 que estão APENAS em Colaboradores.xlsx:');
  apenasEmColaboradores.slice(0, 10).forEach(d => {
    console.log(`   • ${d.nome} (${d.email}) - Unidade: ${d.unidade || '—'} - Ativo: ${d.ativo}`);
  });
  console.log();
}

if (apenasEmModelo.length > 0) {
  console.log('📋 Primeiros 10 que estão APENAS em modelo_colaboradores.xlsx:');
  apenasEmModelo.slice(0, 10).forEach(d => {
    console.log(`   • ${d.nome} (${d.email})`);
  });
  console.log();
}

// Verificar localidades
console.log('🏢 ANÁLISE DE LOCALIDADES\n');

const localidadesColaboradores = new Set();
const localidadesComContagem = new Map();

dados1.forEach(d => {
  const unidade = d['UNIDADE']?.toString().trim();
  if (unidade) {
    localidadesColaboradores.add(unidade);
    localidadesComContagem.set(unidade, (localidadesComContagem.get(unidade) || 0) + 1);
  }
});

console.log(`Total de localidades únicas: ${localidadesColaboradores.size}\n`);
console.log('Localidades e quantidade de colaboradores:');

const localidadesOrdenadas = Array.from(localidadesComContagem.entries())
  .sort((a, b) => b[1] - a[1]);

localidadesOrdenadas.forEach(([local, qtd]) => {
  console.log(`   • ${local}: ${qtd} colaboradores`);
});

// Verificar demitidos
console.log('\n\n👥 ANÁLISE DE STATUS (ATIVO)\n');

const statusUnicos = new Set();
const statusComContagem = new Map();

dados1.forEach(d => {
  const status = d['ATIVO']?.toString().trim() || 'SEM STATUS';
  statusUnicos.add(status);
  statusComContagem.set(status, (statusComContagem.get(status) || 0) + 1);
});

console.log('Status e quantidade:');
statusComContagem.forEach((qtd, status) => {
  console.log(`   • ${status}: ${qtd}`);
});

console.log('\n✨ Comparação concluída!');
