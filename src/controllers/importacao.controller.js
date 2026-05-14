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
function converterData(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') return null;
  
  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes.map(p => parseInt(p, 10));
  
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
  
  const data = new Date(ano, mes - 1, dia);
  
  // Validar se a data é válida
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
exports.importarSolicitacoes = async (req, res) => {
  try {
    const { empresaId } = req.user;
    const { dados } = req.body;
    
    if (!Array.isArray(dados) || dados.length === 0) {
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
      return res.status(400).json({ 
        erro: 'Nenhum técnico cadastrado',
        detalhes: 'Cadastre técnicos antes de importar solicitações'
      });
    }
    
    if (unidades.length === 0) {
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
      const linha = dados[idx];
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
            tipo: linha.tipo.toUpperCase(),
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
    
    // Retornar resultado
    res.json({
      mensagem: `Importação concluída: ${resultados.sucesso.length} sucesso, ${resultados.erros.length} erros`,
      resultados
    });
    
  } catch (erro) {
    console.error('Erro ao importar solicitações:', erro);
    res.status(500).json({ 
      erro: 'Erro ao importar solicitações',
      detalhes: erro.message 
    });
  }
};

// Controller para validar arquivo antes de importar
exports.validarArquivo = async (req, res) => {
  try {
    const { empresaId } = req.user;
    const { dados } = req.body;
    
    if (!Array.isArray(dados) || dados.length === 0) {
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
      const linha = dados[idx];
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
    
    res.json({
      mensagem: `Validação concluída: ${validacoes.validas.length} válidas, ${validacoes.invalidas.length} inválidas`,
      validacoes
    });
    
  } catch (erro) {
    console.error('Erro ao validar arquivo:', erro);
    res.status(500).json({ 
      erro: 'Erro ao validar arquivo',
      detalhes: erro.message 
    });
  }
};


// Controller para importar usuários (colaboradores)
exports.importarUsuarios = async (req, res) => {
  try {
    const { empresaId } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Ler arquivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets['Ativos'];
    
    if (!worksheet) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Planilha "Ativos" não encontrada' });
    }

    const dados = XLSX.utils.sheet_to_json(worksheet);

    // Buscar usuários existentes
    const usuariosExistentes = await prisma.usuario.findMany({
      where: { empresaId },
      select: { email: true }
    });

    const emailsExistentes = new Set(
      usuariosExistentes
        .filter(u => u.email)
        .map(u => u.email.toLowerCase())
    );

    const resultado = {
      criados: 0,
      erros: 0,
      message: '',
      detalhes: []
    };

    // Processar cada linha
    for (const linha of dados) {
      try {
        const nome = linha['NOME']?.toString().trim();
        const email = linha['E-MAIL']?.toString().trim().toLowerCase();
        const cargo = linha['CARGO']?.toString().trim();
        const status = linha['STATUS']?.toString().trim();

        // Validações
        if (!nome || !email) {
          resultado.erros++;
          resultado.detalhes.push({
            nome: nome || 'SEM NOME',
            email: email || 'SEM EMAIL',
            motivo: 'Nome ou Email vazio'
          });
          continue;
        }

        // Pular DEMITIDO
        if (status === 'DEMITIDO') {
          continue;
        }

        // Verificar duplicata por EMAIL
        if (emailsExistentes.has(email)) {
          resultado.detalhes.push({
            nome,
            email,
            motivo: 'Email já existe (pulado)'
          });
          continue;
        }

        // Criar novo usuário
        await prisma.usuario.create({
          data: {
            nome: nome.toUpperCase(),
            email,
            funcao: cargo || null,
            role: 'TECNICO',
            ativo: true,
            empresaId
          }
        });

        resultado.criados++;
        emailsExistentes.add(email);

      } catch (erro) {
        resultado.erros++;
        console.error('Erro ao processar linha:', erro);
      }
    }

    resultado.message = `Importação concluída: ${resultado.criados} criados, ${resultado.erros} erros`;

    // Limpar arquivo temporário
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json(resultado);

  } catch (erro) {
    console.error('Erro ao importar usuários:', erro);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Erro ao importar usuários' });
  }
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
