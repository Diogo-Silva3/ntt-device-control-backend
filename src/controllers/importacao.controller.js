const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Mapa de conversão de nomes abreviados para nomes originais
const estadoMap = {
  'Aguard.Definição': 'Aguardando NF',
  'Aguard.Entrega': 'Aguardando Entrega',
};

// Função para converter string de data DD/MM/YYYY para Date
function converterData(dataVal) {
  if (dataVal === undefined || dataVal === null) return null;

  // 1. Se já for objeto Date
  if (dataVal instanceof Date) {
    return isNaN(dataVal.getTime()) ? null : dataVal;
  }

  // 2. Se for número ou string numérica (Data serial do Excel)
  if (typeof dataVal === 'number' || (typeof dataVal === 'string' && /^\d+(\.\d+)?$/.test(dataVal.trim()))) {
    const num = parseFloat(dataVal);
    const data = new Date((num - 25569) * 86400 * 1000);
    return isNaN(data.getTime()) ? null : data;
  }

  if (typeof dataVal !== 'string') return null;
  const trimmed = dataVal.trim();
  if (!trimmed) return null;

  // 3. Se for formato ISO ou similar
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const data = new Date(trimmed);
    return isNaN(data.getTime()) ? null : data;
  }

  // 4. Se for formato DD/MM/YYYY
  const partes = trimmed.split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes.map(p => parseInt(p, 10));
  
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
  
  const data = new Date(ano, mes - 1, dia);
  
  if (data.getDate() !== dia || data.getMonth() !== mes - 1 || data.getFullYear() !== ano) {
    return null;
  }
  
  return data;
}

// Função para determinar o estado baseado nas datas preenchidas
function determinarEstado(dados) {
  // Se tem data de entrega, está entregue
  if (dados.dataEntrega) return 'Entregue';
  
  // Se tem data de chegada, está em trânsito ou chegou
  if (dados.dataChegada) return 'Em Trânsito';
  
  // Se tem previsão de chegada, está em trânsito
  if (dados.previsaoChegada) return 'Em Trânsito';
  
  // Se tem data de coleta, está aguardando entrega
  if (dados.dataColeta) return 'Aguardando Entrega';
  
  // Se tem data de solicitação de coleta, está aguardando coleta
  if (dados.dataSolicitacaoColeta) return 'Aguardando Coleta';
  
  // Se tem data de emissão NF, está aguardando coleta
  if (dados.dataEmissaoNF) return 'Aguardando Coleta';
  
  // Se tem data de solicitação NF, está em NF solicitada
  if (dados.dataSolicitacaoNF) return 'NF Solicitada';
  
  // Se tem data de definição, está aguardando NF
  if (dados.dataDefinicao) return 'Aguardando NF';
  
  // Padrão: Aberto
  return 'Aberto';
}

// Validar dados da linha
function validarLinha(linha, empresaId, tecnicos, unidades) {
  const erros = [];
  
  // Validar Nº Chamado (obrigatório)
  if (!linha.numeroChamado || typeof linha.numeroChamado !== 'string') {
    erros.push('Nº Chamado é obrigatório');
  } else if (linha.numeroChamado.trim().length === 0) {
    erros.push('Nº Chamado não pode estar vazio');
  }
  
  // Validar Tipo (obrigatório)
  const tiposValidos = ['NOVO', 'TROCA', 'RETORNO', 'ENVIO'];
  if (!linha.tipo || !tiposValidos.includes(linha.tipo.toUpperCase())) {
    erros.push(`Tipo inválido. Use: ${tiposValidos.join(', ')}`);
  }
  
  // Validar Status
  if (linha.status) {
    const statusValidos = ['ABERTO', 'ATIVO', 'ENCERRADO'];
    if (!statusValidos.includes(linha.status.toUpperCase())) {
      erros.push(`Status inválido. Use: ${statusValidos.join(', ')}`);
    }
  }
  
  // Validar Técnico (obrigatório)
  if (!linha.tecnico || typeof linha.tecnico !== 'string') {
    erros.push('Técnico é obrigatório');
  } else {
    const tecnicoEncontrado = tecnicos.find(t => 
      t.nome.toLowerCase() === linha.tecnico.toLowerCase()
    );
    if (!tecnicoEncontrado) {
      erros.push(`Técnico "${linha.tecnico}" não encontrado`);
    }
  }
  
  // Validar Unidade (obrigatória)
  if (!linha.unidade || typeof linha.unidade !== 'string') {
    erros.push('Unidade é obrigatória');
  } else {
    const unidadeEncontrada = unidades.find(u => 
      u.nome.toLowerCase() === linha.unidade.toLowerCase()
    );
    if (!unidadeEncontrada) {
      erros.push(`Unidade "${linha.unidade}" não encontrada`);
    }
  }
  
  // Validar datas
  const camposDatas = [
    'dataDefinicao', 'dataSolicitacaoNF', 'dataEmissaoNF', 
    'dataSolicitacaoColeta', 'dataColeta', 'previsaoChegada', 
    'dataChegada', 'dataEntrega'
  ];
  
  camposDatas.forEach(campo => {
    if (linha[campo] && typeof linha[campo] === 'string' && linha[campo].trim()) {
      if (!converterData(linha[campo])) {
        erros.push(`${campo}: formato de data inválido (use DD/MM/YYYY)`);
      }
    }
  });
  
  return erros;
}

// Controller para importar solicitações
// Helper para extrair campo em planilhas com colunas variáveis
const extrairCampo = (linha, aliases) => {
  for (const alias of aliases) {
    const keyFound = Object.keys(linha).find(k => k.trim().toLowerCase() === alias.toLowerCase());
    if (keyFound !== undefined && linha[keyFound] !== undefined && linha[keyFound] !== null) {
      return linha[keyFound].toString().trim();
    }
  }
  return '';
};

// Mapeador de campos de solicitações de colunas da planilha para chaves camelCase do banco de dados
const mapSolicitacaoLinha = (linha) => {
  return {
    numeroChamado: extrairCampo(linha, ['Número', 'Numero', 'Nº Chamado *', 'Nº Chamado', 'Chamado', 'Ticket', 'Nº do Chamado']),
    descricao: extrairCampo(linha, ['Descrição', 'Descricao', ' DESCRIÇÃO  CHAMADO ', 'Resumo']),
    tipo: extrairCampo(linha, ['Tipo *', 'Tipo', 'Type']),
    status: extrairCampo(linha, ['Status', 'STATUS', 'Situação', 'Estado']),
    tecnico: extrairCampo(linha, ['Técnico *', 'Técnico', 'Tecnico', 'Atribuído a', 'Responsável']),
    unidade: extrairCampo(linha, ['Unidade *', 'Unidade', 'Unit', 'Filial']),
    dataDefinicao: extrairCampo(linha, ['Data Definição', 'Data Definicao', 'Solicitação da definição', 'Data da definição']),
    dataSolicitacaoNF: extrairCampo(linha, ['Data Solicitação NF', 'Data Solicitacao NF', 'Data da solicitação da nota']),
    dataEmissaoNF: extrairCampo(linha, ['Data Emissão NF', 'Data Emissao NF', 'Data da emissão da nota']),
    dataSolicitacaoColeta: extrairCampo(linha, ['Data Solicitação Coleta', 'Data Solicitacao Coleta', 'Data da solicitação de coleta']),
    dataColeta: extrairCampo(linha, ['Data Coleta', 'Data da coleta']),
    previsaoChegada: extrairCampo(linha, ['Previsão Chegada', 'Previsao Chegada', 'Previsão de chegada']),
    dataChegada: extrairCampo(linha, ['Data Chegada', 'Data de chegada']),
    dataEntrega: extrairCampo(linha, ['Data Entrega', 'Data da Entrega']),
    serialOrigem: extrairCampo(linha, ['Serial Origem', 'Serial de Origem', 'Serial antigo']),
    observacoes: extrairCampo(linha, ['Observações', 'Observacoes', 'OBS', 'Comentários']),
  };
};

// Controller para importar solicitações
exports.importarSolicitacoes = async (req, res) => {
  let tempFilePath = null;
  try {
    const empresaId = req.usuario.empresaId;
    let dados = req.body.dados;
    
    if (req.file) {
      tempFilePath = req.file.path;
      const workbook = XLSX.readFile(tempFilePath);
      const sheetName = workbook.Sheets['DADOS'] ? 'DADOS' : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dados = XLSX.utils.sheet_to_json(worksheet);
    }
    
    if (!Array.isArray(dados) || dados.length === 0) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        erro: 'Nenhum dado para importar',
        detalhes: 'O arquivo deve conter pelo menos uma linha de dados'
      });
    }
    
    // Buscar técnicos e unidades da empresa
    const [tecnicos, unidades] = await Promise.all([
      prisma.usuario.findMany({
        where: { empresaId, role: 'TECNICO', ativo: true },
        select: { id: true, nome: true }
      }),
      prisma.unidade.findMany({
        where: { empresaId },
        select: { id: true, nome: true }
      })
    ]);
    
    if (tecnicos.length === 0) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        erro: 'Nenhum técnico cadastrado',
        detalhes: 'Cadastre técnicos antes de importar solicitações'
      });
    }
    
    if (unidades.length === 0) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        erro: 'Nenhuma unidade cadastrada',
        detalhes: 'Cadastre unidades antes de importar solicitações'
      });
    }
    
    // Validar e processar cada linha
    const resultados = {
      sucesso: [],
      erros: [],
      total: dados.length
    };
    
    for (let idx = 0; idx < dados.length; idx++) {
      const linhaBruta = dados[idx];
      const linha = mapSolicitacaoLinha(linhaBruta);
      const numeroLinha = idx + 2; // +2 porque começa em linha 2 (depois do header)
      
      // Pular linhas vazias
      if (!linha.numeroChamado) {
        continue;
      }
      
      // Validar linha
      const errosValidacao = validarLinha(linha, empresaId, tecnicos, unidades);
      
      if (errosValidacao.length > 0) {
        resultados.erros.push({
          linha: numeroLinha,
          numeroChamado: linha.numeroChamado,
          erros: errosValidacao
        });
        continue;
      }
      
      try {
        // Encontrar técnico e unidade
        const tecnico = tecnicos.find(t => 
          t.nome.toLowerCase() === linha.tecnico.toLowerCase()
        );
        const unidade = unidades.find(u => 
          u.nome.toLowerCase() === linha.unidade.toLowerCase()
        );
        
        // Converter datas
        const dadosConvertidos = {
          dataDefinicao: linha.dataDefinicao ? converterData(linha.dataDefinicao) : null,
          dataSolicitacaoNF: linha.dataSolicitacaoNF ? converterData(linha.dataSolicitacaoNF) : null,
          dataEmissaoNF: linha.dataEmissaoNF ? converterData(linha.dataEmissaoNF) : null,
          dataSolicitacaoColeta: linha.dataSolicitacaoColeta ? converterData(linha.dataSolicitacaoColeta) : null,
          dataColeta: linha.dataColeta ? converterData(linha.dataColeta) : null,
          previsaoChegada: linha.previsaoChegada ? converterData(linha.previsaoChegada) : null,
          dataChegada: linha.dataChegada ? converterData(linha.dataChegada) : null,
          dataEntrega: linha.dataEntrega ? converterData(linha.dataEntrega) : null,
        };
        
        // Determinar estado
        const estado = determinarEstado(dadosConvertidos);
        
        // Criar solicitação
        const solicitacao = await prisma.solicitacaoAtivo.create({
          data: {
            numeroChamado: linha.numeroChamado.trim(),
            descricao: linha.descricao || null,
            tipo: linha.tipo ? linha.tipo.toUpperCase() : 'NOVO',
            status: linha.status ? linha.status.toUpperCase() : 'ABERTO',
            estado,
            observacoes: linha.observacoes || null,
            serialOrigem: linha.serialOrigem || null,
            tecnicoId: tecnico.id,
            unidadeId: unidade.id,
            empresaId,
            importado: true,
            ...dadosConvertidos
          }
        });
        
        resultados.sucesso.push({
          linha: numeroLinha,
          numeroChamado: solicitacao.numeroChamado,
          id: solicitacao.id
        });
        
      } catch (erro) {
        // Verificar se é erro de duplicação
        if (erro.code === 'P2002') {
          resultados.erros.push({
            linha: numeroLinha,
            numeroChamado: linha.numeroChamado,
            erros: ['Nº Chamado já existe para esta empresa']
          });
        } else {
          resultados.erros.push({
            linha: numeroLinha,
            numeroChamado: linha.numeroChamado,
            erros: [erro.message]
          });
        }
      }
    }
    
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // Retornar resultado
    res.json({
      mensagem: `Importação concluída: ${resultados.sucesso.length} sucesso, ${resultados.erros.length} erros`,
      resultados
    });
    
  } catch (erro) {
    console.error('Erro ao importar solicitações:', erro);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    res.status(500).json({ 
      erro: 'Erro ao importar solicitações',
      detalhes: erro.message 
    });
  }
};

// Controller para validar arquivo antes de importar
exports.validarArquivo = async (req, res) => {
  let tempFilePath = null;
  try {
    const empresaId = req.usuario.empresaId;
    let dados = req.body.dados;

    if (req.file) {
      tempFilePath = req.file.path;
      const workbook = XLSX.readFile(tempFilePath);
      const sheetName = workbook.Sheets['DADOS'] ? 'DADOS' : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dados = XLSX.utils.sheet_to_json(worksheet);
    }
    
    if (!Array.isArray(dados) || dados.length === 0) {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ 
        erro: 'Nenhum dado para validar',
        detalhes: 'O arquivo deve conter pelo menos uma linha de dados'
      });
    }
    
    // Buscar técnicos e unidades da empresa
    const [tecnicos, unidades, solicitacoesExistentes] = await Promise.all([
      prisma.usuario.findMany({
        where: { empresaId, role: 'TECNICO', ativo: true },
        select: { id: true, nome: true }
      }),
      prisma.unidade.findMany({
        where: { empresaId },
        select: { id: true, nome: true }
      }),
      prisma.solicitacaoAtivo.findMany({
        where: { empresaId },
        select: { numeroChamado: true }
      })
    ]);
    
    const chamadosExistentes = solicitacoesExistentes.map(s => s.numeroChamado);
    
    // Validar cada linha
    const validacoes = {
      validas: [],
      invalidas: [],
      avisos: [],
      total: dados.length
    };
    
    for (let idx = 0; idx < dados.length; idx++) {
      const linhaBruta = dados[idx];
      const linha = mapSolicitacaoLinha(linhaBruta);
      const numeroLinha = idx + 2;
      
      // Pular linhas vazias
      if (!linha.numeroChamado) {
        continue;
      }
      
      const erros = validarLinha(linha, empresaId, tecnicos, unidades);
      const avisos = [];
      
      // Verificar se chamado já existe
      if (chamadosExistentes.includes(linha.numeroChamado)) {
        avisos.push('Nº Chamado já existe (será pulado)');
      }
      
      if (erros.length > 0) {
        validacoes.invalidas.push({
          linha: numeroLinha,
          numeroChamado: linha.numeroChamado,
          erros,
          avisos
        });
      } else {
        validacoes.validas.push({
          linha: numeroLinha,
          numeroChamado: linha.numeroChamado,
          avisos: avisos.length > 0 ? avisos : undefined
        });
      }
    }
    
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    res.json({
      mensagem: `Validação concluída: ${validacoes.validas.length} válidas, ${validacoes.invalidas.length} inválidas`,
      validacoes
    });
    
  } catch (erro) {
    console.error('Erro ao validar arquivo:', erro);
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    res.status(500).json({ 
      erro: 'Erro ao validar arquivo',
      detalhes: erro.message 
    });
  }
};


// Controller para gerar preview rápido de uma planilha antes de importar
exports.preview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(worksheet);
    
    let colunas = [];
    if (dados.length > 0) {
      colunas = Object.keys(dados[0]);
    } else {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        if (cell && cell.v !== undefined) colunas.push(cell.v);
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      total: dados.length,
      colunas
    });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erro ao gerar preview da planilha' });
  }
};

// Controller para importar equipamentos em lote via planilha
exports.importarEquipamentos = async (req, res) => {
  const QRCode = require('qrcode');
  try {
    const empresaId = req.usuario.empresaId;
    const projetoIdBody = req.body.projetoId ? parseInt(req.body.projetoId) : null;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    if (dados.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Planilha de equipamentos vazia' });
    }

    const [unidades, projetos] = await Promise.all([
      prisma.unidade.findMany({ where: { empresaId }, select: { id: true, nome: true } }),
      prisma.projeto.findMany({ where: { empresaId }, select: { id: true, nome: true } }),
    ]);

    const unidadeMap = {};
    unidades.forEach(u => {
      unidadeMap[u.nome.toUpperCase().trim()] = u.id;
    });

    const projetoMap = {};
    projetos.forEach(p => {
      projetoMap[p.nome.toUpperCase().trim()] = p.id;
    });

    let criados = 0;
    let atualizados = 0;
    let erros = 0;
    const detalhes = [];

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;

      const serialNumber = extrairCampo(linha, ['Serial Number', 'Serial', 'N° Serie', 'N° Série', 'Número de Série', 'Numero de Serie', 'S/N', 'SN']);
      const marca = extrairCampo(linha, ['Marca', 'Brand', 'Fabricante']);
      const modelo = extrairCampo(linha, ['Modelo', 'Model']);
      const tipo = extrairCampo(linha, ['Tipo', 'Type', 'Categoria']);
      const unidadeNome = extrairCampo(linha, ['Unidade', 'Unit', 'Filial', 'Localidade']);
      const projetoNome = extrairCampo(linha, ['Projeto', 'Project']);
      const patrimonio = extrairCampo(linha, ['Patrimônio', 'Patrimonio', 'Asset Tag', 'Asset', 'Tag']) || null;
      const statusFisico = extrairCampo(linha, ['Status', 'Situação', 'Situacao']) || 'DISPONIVEL';
      const observacao = extrairCampo(linha, ['Observação', 'Observacao', 'Observações', 'Observacoes', 'Comments', 'Notes', 'Nota']) || null;

      if (!serialNumber || !marca || !modelo) {
        erros++;
        detalhes.push({
          linha: numeroLinha,
          serialNumber: serialNumber || 'N/A',
          status: 'ERRO',
          motivo: 'Número de série, marca e modelo são obrigatórios.'
        });
        continue;
      }

      let unidadeId = null;
      if (unidadeNome) {
        unidadeId = unidadeMap[unidadeNome.toUpperCase().trim()] || null;
        if (!unidadeId && unidadeNome) {
          erros++;
          detalhes.push({
            linha: numeroLinha,
            serialNumber,
            status: 'ERRO',
            motivo: `Unidade "${unidadeNome}" não cadastrada no sistema.`
          });
          continue;
        }
      }

      let projetoId = projetoIdBody;
      if (!projetoId && projetoNome) {
        projetoId = projetoMap[projetoNome.toUpperCase().trim()] || null;
      }

      try {
        const existe = await prisma.equipamento.findFirst({
          where: { serialNumber, empresaId }
        });

        if (existe) {
          await prisma.equipamento.update({
            where: { id: existe.id },
            data: {
              marca,
              modelo,
              tipo: tipo || existe.tipo,
              patrimonio: patrimonio || existe.patrimonio,
              status: statusFisico || existe.status,
              observacao: observacao || existe.observacao,
              unidadeId: unidadeId || existe.unidadeId,
              projetoId: projetoId || existe.projetoId
            }
          });
          atualizados++;
          detalhes.push({
            linha: numeroLinha,
            serialNumber,
            status: 'ATUALIZADO',
            id: existe.id
          });
        } else {
          const novo = await prisma.equipamento.create({
            data: {
              serialNumber,
              marca,
              modelo,
              tipo: tipo || 'Laptop',
              patrimonio,
              status: statusFisico || 'DISPONIVEL',
              statusProcesso: 'Novo',
              observacao,
              unidadeId,
              projetoId,
              empresaId
            }
          });

          const frontendUrl = process.env.FRONTEND_URL || 'https://tech-refresh.cloud';
          const qrData = `${frontendUrl}/equipamentos/${novo.id}`;
          const qrCode = await QRCode.toDataURL(qrData);
          await prisma.equipamento.update({
            where: { id: novo.id },
            data: { qrCode }
          });

          criados++;
          detalhes.push({
            linha: numeroLinha,
            serialNumber,
            status: 'CRIADO',
            id: novo.id
          });
        }
      } catch (err) {
        erros++;
        detalhes.push({
          linha: numeroLinha,
          serialNumber,
          status: 'ERRO',
          motivo: err.message
        });
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      mensagem: `Importação concluída: ${criados} criados, ${atualizados} atualizados, ${erros} erros.`,
      criados,
      atualizados,
      erros,
      detalhes
    });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erro ao importar equipamentos' });
  }
};



// Validar dados de usuário para importação
function validarUsuario(linha, emailsExistentes, unidades) {
  const erros = [];
  
  const nome = linha['NOME']?.toString().trim();
  const email = linha['E-MAIL']?.toString().trim().toLowerCase();
  const funcao = linha['FUNCAO']?.toString().trim();
  const unidade = linha['UNIDADE']?.toString().trim();
  const role = linha['ROLE']?.toString().trim().toUpperCase() || 'TECNICO';
  
  // Validar nome
  if (!nome || nome.length === 0) {
    erros.push('Nome é obrigatório');
  }
  
  // Validar email
  if (!email || email.length === 0) {
    erros.push('Email é obrigatório');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push('Email inválido');
  } else if (emailsExistentes.has(email)) {
    // Verificar se email já existe (em qualquer empresa)
    erros.push('Email já existe no sistema');
  }
  
  // Validar role
  const rolesValidas = ['TECNICO', 'ADMIN', 'GERENTE'];
  if (!rolesValidas.includes(role)) {
    erros.push(`Role inválido. Use: ${rolesValidas.join(', ')}`);
  }
  
  // Validar unidade se fornecida
  if (unidade && unidade.length > 0) {
    const unidadeEncontrada = unidades.find(u => 
      u.nome.toLowerCase() === unidade.toLowerCase()
    );
    if (!unidadeEncontrada) {
      erros.push(`Unidade "${unidade}" não encontrada`);
    }
  }
  
  return { erros, nome, email, funcao, unidade, role };
}

// Controller para validar arquivo de colaboradores antes de importar
exports.validarColaboradores = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Ler arquivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Arquivo Excel vazio' });
    }

    const worksheet = workbook.Sheets[sheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    if (dados.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Nenhum dado encontrado no arquivo' });
    }

    // Buscar dados existentes - VERIFICAR EM TODA A PLATAFORMA
    const [usuariosExistentes, unidades] = await Promise.all([
      prisma.usuario.findMany({
        select: { email: true, id: true, nome: true, empresaId: true }
      }),
      prisma.unidade.findMany({
        where: { empresaId },
        select: { id: true, nome: true }
      })
    ]);

    // Criar mapa de emails existentes (case-insensitive)
    const emailsExistentes = new Map();
    usuariosExistentes.forEach(u => {
      if (u.email) {
        emailsExistentes.set(u.email.toLowerCase(), {
          id: u.id,
          nome: u.nome,
          empresaId: u.empresaId
        });
      }
    });

    // Validar cada linha
    const validacoes = {
      validas: [],
      invalidas: [],
      duplicadas: [],
      total: dados.length
    };

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;
      
      // Pular linhas vazias
      if (!linha.NOME && !linha['E-MAIL']) {
        continue;
      }

      const { erros, nome, email, funcao, unidade, role } = validarUsuario(linha, emailsExistentes, unidades);

      if (erros.length > 0) {
        validacoes.invalidas.push({
          linha: numeroLinha,
          nome: nome || 'SEM NOME',
          email: email || 'SEM EMAIL',
          erros
        });
      } else {
        // Verificar se é duplicado no arquivo
        const emailLower = email.toLowerCase();
        const jaExiste = emailsExistentes.has(emailLower);
        
        if (jaExiste) {
          const usuarioExistente = emailsExistentes.get(emailLower);
          validacoes.duplicadas.push({
            linha: numeroLinha,
            nome,
            email,
            motivo: `Email já existe no sistema (ID: ${usuarioExistente.id}, Usuário: ${usuarioExistente.nome})`
          });
        } else {
          validacoes.validas.push({
            linha: numeroLinha,
            nome,
            email,
            funcao: funcao || '—',
            unidade: unidade || '—',
            role
          });
          // Adicionar ao mapa para detectar duplicatas no próprio arquivo
          emailsExistentes.set(emailLower, { id: 0, nome, empresaId });
        }
      }
    }

    // Limpar arquivo temporário
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      mensagem: `Validação concluída: ${validacoes.validas.length} válidos, ${validacoes.duplicadas.length} duplicados, ${validacoes.invalidas.length} inválidos`,
      validacoes
    });

  } catch (erro) {
    console.error('Erro ao validar colaboradores:', erro);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Erro ao validar arquivo',
      detalhes: erro.message
    });
  }
};

// Controller para importar usuários (colaboradores)
exports.importarColaboradores = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Ler arquivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    
    if (sheetNames.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Arquivo Excel vazio' });
    }

    const worksheet = workbook.Sheets[sheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    if (dados.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Nenhum dado encontrado no arquivo' });
    }

    // Buscar dados existentes - VERIFICAR EM TODA A PLATAFORMA (não apenas empresa)
    const [usuariosExistentes, unidades] = await Promise.all([
      prisma.usuario.findMany({
        select: { email: true, id: true, nome: true, empresaId: true }
      }),
      prisma.unidade.findMany({
        where: { empresaId },
        select: { id: true, nome: true }
      })
    ]);

    // Criar mapa de emails existentes (case-insensitive)
    const emailsExistentes = new Map();
    usuariosExistentes.forEach(u => {
      if (u.email) {
        emailsExistentes.set(u.email.toLowerCase(), {
          id: u.id,
          nome: u.nome,
          empresaId: u.empresaId
        });
      }
    });

    const resultado = {
      criados: 0,
      pulados: 0,
      erros: 0,
      detalhes: []
    };

    // Processar cada linha
    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;

      try {
        // Pular linhas vazias
        if (!linha.NOME && !linha['E-MAIL']) {
          continue;
        }

        const { erros, nome, email, funcao, unidade, role } = validarUsuario(linha, emailsExistentes, unidades);

        if (erros.length > 0) {
          resultado.erros++;
          resultado.detalhes.push({
            linha: numeroLinha,
            nome: nome || 'SEM NOME',
            email: email || 'SEM EMAIL',
            status: 'ERRO',
            motivo: erros.join('; ')
          });
          continue;
        }

        // VERIFICAR SE EMAIL JÁ EXISTE NO SISTEMA (em qualquer empresa)
        const emailLower = email.toLowerCase();
        if (emailsExistentes.has(emailLower)) {
          const usuarioExistente = emailsExistentes.get(emailLower);
          resultado.pulados++;
          resultado.detalhes.push({
            linha: numeroLinha,
            nome: nome,
            email: email,
            status: 'PULADO',
            motivo: `Email já existe no sistema (ID: ${usuarioExistente.id}, Usuário: ${usuarioExistente.nome})`
          });
          continue;
        }

        // Encontrar unidade se fornecida
        let unidadeId = null;
        if (unidade) {
          const unidadeEncontrada = unidades.find(u => 
            u.nome.toLowerCase() === unidade.toLowerCase()
          );
          if (unidadeEncontrada) {
            unidadeId = unidadeEncontrada.id;
          }
        }

        // Criar novo usuário
        const novoUsuario = await prisma.usuario.create({
          data: {
            nome: nome.toUpperCase(),
            email: emailLower,
            funcao: funcao || null,
            role,
            ativo: true,
            empresaId,
            unidadeId
          },
          include: { unidade: true }
        });

        resultado.criados++;
        // Adicionar ao mapa para evitar duplicatas na mesma importação
        emailsExistentes.set(emailLower, {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          empresaId: novoUsuario.empresaId
        });

        resultado.detalhes.push({
          linha: numeroLinha,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          status: 'CRIADO',
          id: novoUsuario.id
        });

        // Registrar log
        const { registrarLog } = require('./auditoria.controller');
        registrarLog({
          usuarioId: req.usuario.id,
          empresaId,
          acao: 'COLABORADOR_IMPORTADO',
          detalhes: `Colaborador importado: ${nome} (${email}) - Role: ${role}`,
          ip: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
        });

      } catch (erro) {
        resultado.erros++;
        console.error('Erro ao processar linha:', erro);
        resultado.detalhes.push({
          linha: numeroLinha,
          nome: linha.NOME || 'SEM NOME',
          email: linha['E-MAIL'] || 'SEM EMAIL',
          status: 'ERRO',
          motivo: erro.message
        });
      }
    }

    // Limpar arquivo temporário
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      mensagem: `Importação concluída: ${resultado.criados} criados, ${resultado.pulados} pulados (duplicados), ${resultado.erros} erros`,
      resultado
    });

  } catch (erro) {
    console.error('Erro ao importar colaboradores:', erro);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Erro ao importar colaboradores',
      detalhes: erro.message
    });
  }
};

// Controller para importar usuários (colaboradores) - LEGADO
exports.importarUsuarios = async (req, res) => {
  // Redirecionar para novo endpoint
  return exports.importarColaboradores(req, res);
};

// Controller para baixar template
exports.baixarTemplate = async (req, res) => {
  try {
    const caminhoTemplate = path.join(__dirname, '../../template-importacao-solicitacoes.xlsx');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoTemplate)) {
      return res.status(404).json({ 
        erro: 'Template não encontrado',
        detalhes: 'Execute: npm run gerar-template'
      });
    }
    
    // Enviar arquivo
    res.download(caminhoTemplate, 'template-importacao-solicitacoes.xlsx');
    
  } catch (erro) {
    console.error('Erro ao baixar template:', erro);
    res.status(500).json({ 
      erro: 'Erro ao baixar template',
      detalhes: erro.message 
    });
  }
};
