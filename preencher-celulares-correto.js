const XLSX = require('xlsx');

// Dados fornecidos (copiei exatamente como você passou)
const dadosRaw = [
  { usuario: 'RENATO LACERDA MAFFRA', serie: '358680812647185', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'SERGIO ALVES CARDOSO JUNIOR', serie: '358680812647201', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'LORENA ALVES DE ALCANTARA', serie: '358680812653332', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'RAFAEL CORREIA SILVA', serie: '358680812653993', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'YAGO CARVALHO ROCHA', serie: '358680812654579', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'ANDERSON FERREIRA DE OLIVEIRA', serie: '358680812653464', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'FATIMA CRISTINA MATTOS DE BESSA', serie: '358680812653191', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'SANDRA CORREA DE CARVALHO SOUZA', serie: '358680812654231', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'THIAGO GUIMARAES VIANNA', serie: '358680812653381', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'MONIQUE HELLEN DO ROSARIO DE CARVALHO', serie: '358680812653779', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'CLEBER DE CARVALHO DIAS', serie: '358680812636147', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'ANTONIO RICARDO ALVES HIR', serie: '358680812652813', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'ALINE CAMARA SOUZA', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'NADJA HELENA DA SILVA', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'DANIEL MACHADO AZEVEDO', serie: '358680812676630', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'SORAYA CRISTIANE SILVA DE ANDRADE', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'EVERTON ALVES PEREIRA VIANNA', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'DANIEL PEIXOTO DA SILVA', serie: '358680812692603', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'ANA CELIA CAVALCANTI', serie: '358680812633185', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'CARLOS HENRIQUE SILVA DOS SANTOS', serie: '358680812676184', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'CAROLINE GOMES DA SILVA', serie: '358680812649702', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'CASSIO PIMENTA', serie: '358680812641659', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'CLARISSE VICTORIA MORAES', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'ESTHEFANY CRISTINA MAIA MAGALHAES', serie: '358680812647359', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'GABRIELA BENJAMIN PIMENTEL', serie: '358680812654496', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'GABRIELLY COSTA DA SILVA SANTANA', serie: '358680812674775', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'GUSTAVO NUNES DOS SANTOS', serie: '358680812646542', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'JULIA SIQUEIRA THIMOTHEO', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'KARINE CHRISTINE MONTEIRO DE ARRUDA', serie: '358680812666730', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'LARISSA PECCIN MELO', serie: '358680812634761', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'LETICIA MENDONCA QUEIROZ LEITE', serie: '358680812668058', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'RAYANNE NICOLI DE SOUZA', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'RENATA DOS SANTOS PACHECO', serie: '358680812643093', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'SIMONE BREZINSCK TEIXEIRA', serie: '358680812654587', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'SPARTACUS F FERREIRA SIMOES', serie: '358680812666763', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'VANESSA DE ALMEIDA DUARTE', serie: '358680812654249', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'VICTORIA CRISTINA DE BRITO DA SILVA', serie: '358680812679907', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' },
  { usuario: 'VITOR DA SILVA FERREIRA', serie: '358680812671797', marca: 'Samsung', modelo: 'A17 256GB', status: 'Samsung', unidade: 'Rio de Janeiro' }
];

// Transformar para formato de importação
const dados = dadosRaw.map((item, idx) => ({
  'N° Série': item.serie,
  'Marca': 'Samsung',
  'Modelo': 'Galaxy A17 256GB',
  'Tipo': 'Celular',
  'Unidade': 'RAPOSO',
  'Projeto': 'TECH REFRESH CELULARES 2026',
  'Patrimônio': `CEL-${String(idx + 1).padStart(4, '0')}`,
  'Status': 'DISPONIVEL',
  'Observação': `Usuário: ${item.usuario}`
}));

console.log(`Total de celulares: ${dados.length}`);

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
  { wch: 40 }  // Observação
];

// Salvar arquivo
XLSX.writeFile(wb, 'template-celulares-2026.xlsx');
console.log(`✅ Planilha criada com ${dados.length} celulares!`);
