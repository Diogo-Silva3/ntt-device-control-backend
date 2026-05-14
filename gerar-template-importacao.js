const ExcelJS = require('exceljs');
const path = require('path');

async function gerarTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // ========== SHEET 1: INSTRUÇÕES ==========
  const sheetInstrucoes = workbook.addWorksheet('INSTRUÇÕES', { state: 'visible' });
  
  sheetInstrucoes.columns = [
    { header: 'GUIA DE IMPORTAÇÃO', width: 50 }
  ];
  
  sheetInstrucoes.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0070C0' } };
  sheetInstrucoes.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
  
  const instrucoes = [
    '',
    '📋 COMO USAR ESTE TEMPLATE:',
    '',
    '1. Acesse a aba "DADOS" para preencher as informações',
    '2. Preencha apenas os campos OBRIGATÓRIOS (marcados com *)',
    '3. Siga o formato exato de cada coluna',
    '4. Não altere os nomes das colunas',
    '5. Não adicione ou remova colunas',
    '',
    '⚠️ CAMPOS OBRIGATÓRIOS:',
    '  • Nº Chamado (único por empresa)',
    '  • Tipo (NOVO, TROCA, RETORNO, ENVIO)',
    '  • Técnico (nome exato do técnico cadastrado)',
    '  • Unidade (nome exato da unidade cadastrada)',
    '',
    '📅 FORMATO DE DATAS:',
    '  • Use o formato: DD/MM/YYYY',
    '  • Exemplo: 15/05/2026',
    '',
    '✅ TIPOS VÁLIDOS:',
    '  • NOVO - Novo equipamento',
    '  • TROCA - Troca de equipamento',
    '  • RETORNO - Retorno de equipamento',
    '  • ENVIO - Envio de equipamento',
    '',
    '📊 STATUS VÁLIDOS:',
    '  • ABERTO - Solicitação aberta',
    '  • ATIVO - Solicitação em andamento',
    '  • ENCERRADO - Solicitação finalizada',
    '',
    '💡 DICAS:',
    '  • Deixe em branco os campos que não tem informação',
    '  • Verifique os nomes de técnicos e unidades antes de importar',
    '  • Faça backup antes de importar dados em massa',
    '',
    '❌ ERROS COMUNS:',
    '  • Nº Chamado duplicado',
    '  • Técnico ou Unidade não encontrado',
    '  • Formato de data incorreto',
    '  • Tipo inválido',
  ];
  
  instrucoes.forEach((instr, idx) => {
    const cell = sheetInstrucoes.getCell(`A${idx + 2}`);
    cell.value = instr;
    if (instr.includes('COMO USAR') || instr.includes('CAMPOS OBRIGATÓRIOS') || 
        instr.includes('FORMATO DE DATAS') || instr.includes('TIPOS VÁLIDOS') ||
        instr.includes('STATUS VÁLIDOS') || instr.includes('DICAS') || instr.includes('ERROS COMUNS')) {
      cell.font = { bold: true, color: { argb: 'FF0070C0' } };
    }
  });
  
  // ========== SHEET 2: DADOS ==========
  const sheetDados = workbook.addWorksheet('DADOS', { state: 'visible' });
  
  sheetDados.columns = [
    { header: 'Nº Chamado *', width: 15, key: 'numeroChamado' },
    { header: 'Descrição', width: 30, key: 'descricao' },
    { header: 'Tipo *', width: 12, key: 'tipo' },
    { header: 'Status', width: 12, key: 'status' },
    { header: 'Técnico *', width: 20, key: 'tecnico' },
    { header: 'Unidade *', width: 20, key: 'unidade' },
    { header: 'Data Definição', width: 15, key: 'dataDefinicao' },
    { header: 'Data Solicitação NF', width: 18, key: 'dataSolicitacaoNF' },
    { header: 'Data Emissão NF', width: 18, key: 'dataEmissaoNF' },
    { header: 'Data Solicitação Coleta', width: 22, key: 'dataSolicitacaoColeta' },
    { header: 'Data Coleta', width: 15, key: 'dataColeta' },
    { header: 'Previsão Chegada', width: 18, key: 'previsaoChegada' },
    { header: 'Data Chegada', width: 15, key: 'dataChegada' },
    { header: 'Data Entrega', width: 15, key: 'dataEntrega' },
    { header: 'Serial Origem', width: 20, key: 'serialOrigem' },
    { header: 'Observações', width: 30, key: 'observacoes' },
  ];
  
  // Formatar header
  const headerRow = sheetDados.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
  
  // Adicionar linhas de exemplo
  const exemplos = [
    {
      numeroChamado: 'CH-001',
      descricao: 'Novo notebook para gerente',
      tipo: 'NOVO',
      status: 'ABERTO',
      tecnico: 'João Silva',
      unidade: 'São Paulo',
      dataDefinicao: '15/05/2026',
      dataSolicitacaoNF: '16/05/2026',
      dataEmissaoNF: '17/05/2026',
      dataSolicitacaoColeta: '18/05/2026',
      dataColeta: '19/05/2026',
      previsaoChegada: '22/05/2026',
      dataChegada: '22/05/2026',
      dataEntrega: '23/05/2026',
      serialOrigem: 'SN123456',
      observacoes: 'Equipamento com garantia de 2 anos',
    },
    {
      numeroChamado: 'CH-002',
      descricao: 'Troca de monitor',
      tipo: 'TROCA',
      status: 'ATIVO',
      tecnico: 'Maria Santos',
      unidade: 'Rio de Janeiro',
      dataDefinicao: '14/05/2026',
      dataSolicitacaoNF: '',
      dataEmissaoNF: '',
      dataSolicitacaoColeta: '',
      dataColeta: '',
      previsaoChegada: '25/05/2026',
      dataChegada: '',
      dataEntrega: '',
      serialOrigem: 'SN789012',
      observacoes: 'Substituir monitor antigo',
    },
  ];
  
  exemplos.forEach((exemplo, idx) => {
    const row = sheetDados.addRow(exemplo);
    row.alignment = { horizontal: 'left', vertical: 'center' };
    
    // Formatar datas
    ['dataDefinicao', 'dataSolicitacaoNF', 'dataEmissaoNF', 'dataSolicitacaoColeta', 
     'dataColeta', 'previsaoChegada', 'dataChegada', 'dataEntrega'].forEach(campo => {
      const cellIdx = sheetDados.columns.findIndex(c => c.key === campo) + 1;
      const cell = row.getCell(cellIdx);
      if (cell.value) {
        cell.numFmt = 'dd/mm/yyyy';
      }
    });
  });
  
  // Adicionar 8 linhas vazias para preenchimento
  for (let i = 0; i < 8; i++) {
    sheetDados.addRow({});
  }
  
  // ========== SHEET 3: REFERÊNCIA ==========
  const sheetRef = workbook.addWorksheet('REFERÊNCIA', { state: 'visible' });
  
  sheetRef.columns = [
    { header: 'Técnicos Cadastrados', width: 25 },
    { header: 'Unidades Cadastradas', width: 25 },
    { header: 'Tipos Válidos', width: 20 },
    { header: 'Status Válidos', width: 20 },
  ];
  
  const refHeaderRow = sheetRef.getRow(1);
  refHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  refHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
  
  // Dados de referência
  const tecnicos = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
  const unidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília'];
  const tipos = ['NOVO', 'TROCA', 'RETORNO', 'ENVIO'];
  const status = ['ABERTO', 'ATIVO', 'ENCERRADO'];
  
  const maxRows = Math.max(tecnicos.length, unidades.length, tipos.length, status.length);
  
  for (let i = 0; i < maxRows; i++) {
    sheetRef.addRow({
      0: tecnicos[i] || '',
      1: unidades[i] || '',
      2: tipos[i] || '',
      3: status[i] || '',
    });
  }
  
  // Salvar arquivo
  const caminhoSaida = path.join(__dirname, 'template-importacao-solicitacoes.xlsx');
  await workbook.xlsx.writeFile(caminhoSaida);
  
  console.log(`✅ Template gerado com sucesso: ${caminhoSaida}`);
}

gerarTemplate().catch(err => {
  console.error('❌ Erro ao gerar template:', err);
  process.exit(1);
});
