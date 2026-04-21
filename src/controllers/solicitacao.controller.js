const prisma = require('../config/prisma');
const { registrarLog } = require('./auditoria.controller');

const TIPOS_VALIDOS = ['TROCA', 'NOVO', 'RETORNO', 'ENVIO'];
const REGEX_CHAMADO = /^(INC|TASK)\d+$/;

/**
 * Função pura que deriva o estado da solicitação com base nas datas preenchidas.
 * A etapa mais avançada preenchida determina o estado.
 */
const derivarEstado = (sol) => {
  if (sol.dataEntrega)          return 'Entregue';
  if (sol.dataChegada)          return 'Aguardando Entrega';
  if (sol.dataColeta)           return 'Em Trânsito';
  if (sol.dataSolicitacaoColeta) return 'Coleta Solicitada';
  if (sol.dataEmissaoNF)        return 'Aguardando Coleta';
  if (sol.dataSolicitacaoNF)    return 'NF Solicitada';
  if (sol.dataDefinicao)        return 'Aguardando NF';
  return 'Aberto';
};

/**
 * Calcula diasAtrasoChegada: diferença em dias entre dataChegada e previsaoChegada.
 * Positivo = atraso, negativo = adiantado.
 */
const calcularDiasAtraso = (previsaoChegada, dataChegada) => {
  if (!previsaoChegada || !dataChegada) return null;
  const prev = new Date(previsaoChegada);
  const real = new Date(dataChegada);
  const diffMs = real.getTime() - prev.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

// GET /api/solicitacoes
const listar = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const {
      status, estado, tipo, tecnicoId, unidadeId,
      dataInicio, dataFim, busca, atraso,
      page = 1, limit = 20,
    } = req.query;

    const take = Math.min(Math.max(parseInt(limit) || 20, 10), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const agora = new Date();

    // Busca inteligente: procura em múltiplos campos
    const buscaWhere = busca ? {
      OR: [
        { numeroChamado: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
        { tecnico: { nome: { contains: busca, mode: 'insensitive' } } },
        { unidade: { nome: { contains: busca, mode: 'insensitive' } } },
      ]
    } : {};

    const where = {
      empresaId,
      ...(status && { status }),
      ...(estado && { estado }),
      ...(tipo && { tipo }),
      ...(tecnicoId && { tecnicoId: parseInt(tecnicoId) }),
      ...(unidadeId && { unidadeId: parseInt(unidadeId) }),
      ...buscaWhere,
      ...((dataInicio || dataFim) && {
        createdAt: {
          ...(dataInicio && { gte: new Date(dataInicio) }),
          ...(dataFim && { lte: new Date(dataFim) }),
        },
      }),
      ...(atraso === '1' && {
        status: { not: 'ENCERRADO' },
        previsaoChegada: { lt: agora },
        dataChegada: null,
      }),
    };

    const [total, data] = await Promise.all([
      prisma.solicitacaoAtivo.count({ where }),
      prisma.solicitacaoAtivo.findMany({
        where,
        include: {
          tecnico: { select: { id: true, nome: true } },
          unidade: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    res.json({ data, total, page: parseInt(page) || 1, limit: take });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
};

// POST /api/solicitacoes
const criar = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const {
      numeroChamado, descricao, observacoes, tipo,
      tecnicoId, unidadeId, projetoId, equipamentoId, serialOrigem,
      dataDefinicao, dataDefinicaoConfirmada, dataSolicitacaoNF, dataEmissaoNF,
      dataSolicitacaoColeta, dataColeta, previsaoChegada, dataChegada, dataEntrega,
    } = req.body;

    // Validações
    if (!numeroChamado || !REGEX_CHAMADO.test(numeroChamado)) {
      return res.status(400).json({ error: 'Número do chamado deve seguir o formato INC{números} ou TASK{números}' });
    }
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Valores aceitos: TROCA, NOVO, RETORNO, ENVIO' });
    }
    if (observacoes && observacoes.length > 2000) {
      return res.status(400).json({ error: 'Observações não podem exceder 2000 caracteres' });
    }

    // Derivar estado inicial
    const dadosEtapas = {
      dataDefinicao, dataDefinicaoConfirmada, dataSolicitacaoNF, dataEmissaoNF,
      dataSolicitacaoColeta, dataColeta, previsaoChegada, dataChegada, dataEntrega,
    };
    const estado = derivarEstado(dadosEtapas);
    const status = estado === 'Entregue' ? 'ENCERRADO' : 'ABERTO';

    const solicitacao = await prisma.solicitacaoAtivo.create({
      data: {
        numeroChamado,
        descricao: descricao || null,
        observacoes: observacoes || null,
        tipo,
        status,
        estado,
        tecnicoId: parseInt(tecnicoId),
        unidadeId: parseInt(unidadeId),
        empresaId,
        projetoId: projetoId ? parseInt(projetoId) : null,
        equipamentoId: equipamentoId ? parseInt(equipamentoId) : null,
        serialOrigem: serialOrigem || null,
        dataDefinicao: dataDefinicao ? new Date(dataDefinicao) : null,
        dataDefinicaoConfirmada: dataDefinicaoConfirmada ? new Date(dataDefinicaoConfirmada) : null,
        dataSolicitacaoNF: dataSolicitacaoNF ? new Date(dataSolicitacaoNF) : null,
        dataEmissaoNF: dataEmissaoNF ? new Date(dataEmissaoNF) : null,
        dataSolicitacaoColeta: dataSolicitacaoColeta ? new Date(dataSolicitacaoColeta) : null,
        dataColeta: dataColeta ? new Date(dataColeta) : null,
        previsaoChegada: previsaoChegada ? new Date(previsaoChegada) : null,
        dataChegada: dataChegada ? new Date(dataChegada) : null,
        dataEntrega: dataEntrega ? new Date(dataEntrega) : null,
        diasAtrasoChegada: calcularDiasAtraso(previsaoChegada, dataChegada),
      },
      include: {
        tecnico: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });

    res.status(201).json(solicitacao);

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId,
      projetoId: projetoId ? parseInt(projetoId) : null,
      acao: 'CRIAR_SOLICITACAO',
      detalhes: `Solicitação criada: ${numeroChamado} — tipo: ${tipo}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe uma solicitação com este número de chamado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar solicitação' });
  }
};

// GET /api/solicitacoes/:id
const buscarPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const solicitacao = await prisma.solicitacaoAtivo.findUnique({
      where: { id },
      include: {
        tecnico: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
        equipamento: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true } },
        auditoria: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (solicitacao.empresaId !== req.usuario.empresaId) return res.status(403).json({ error: 'Acesso não autorizado' });

    res.json(solicitacao);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar solicitação' });
  }
};

// PUT /api/solicitacoes/:id
const atualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const empresaId = req.usuario.empresaId;

    const anterior = await prisma.solicitacaoAtivo.findUnique({ where: { id } });
    if (!anterior) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (anterior.empresaId !== empresaId) return res.status(403).json({ error: 'Acesso não autorizado' });

    const {
      numeroChamado, descricao, observacoes, tipo,
      tecnicoId, unidadeId, projetoId, equipamentoId, serialOrigem,
      dataDefinicao, dataDefinicaoConfirmada, dataSolicitacaoNF, dataEmissaoNF,
      dataSolicitacaoColeta, dataColeta, previsaoChegada, dataChegada, dataEntrega,
    } = req.body;

    // Validações opcionais (só se fornecidos)
    if (numeroChamado !== undefined && !REGEX_CHAMADO.test(numeroChamado)) {
      return res.status(400).json({ error: 'Número do chamado deve seguir o formato INC{números} ou TASK{números}' });
    }
    if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Valores aceitos: TROCA, NOVO, RETORNO, ENVIO' });
    }
    if (observacoes !== undefined && observacoes !== null && observacoes.length > 2000) {
      return res.status(400).json({ error: 'Observações não podem exceder 2000 caracteres' });
    }

    // Montar dados de etapas para derivar estado
    const toDate = (val, fallback) => val !== undefined ? (val ? new Date(val) : null) : fallback;

    const novasEtapas = {
      dataDefinicao:           toDate(dataDefinicao, anterior.dataDefinicao),
      dataDefinicaoConfirmada: toDate(dataDefinicaoConfirmada, anterior.dataDefinicaoConfirmada),
      dataSolicitacaoNF:       toDate(dataSolicitacaoNF, anterior.dataSolicitacaoNF),
      dataEmissaoNF:           toDate(dataEmissaoNF, anterior.dataEmissaoNF),
      dataSolicitacaoColeta:   toDate(dataSolicitacaoColeta, anterior.dataSolicitacaoColeta),
      dataColeta:              toDate(dataColeta, anterior.dataColeta),
      previsaoChegada:         toDate(previsaoChegada, anterior.previsaoChegada),
      dataChegada:             toDate(dataChegada, anterior.dataChegada),
      dataEntrega:             toDate(dataEntrega, anterior.dataEntrega),
    };

    const novoEstado = derivarEstado(novasEtapas);
    const novoStatus = req.body.status !== undefined ? req.body.status : (novoEstado === 'Entregue' ? 'ENCERRADO' : anterior.status);
    const novosDiasAtraso = calcularDiasAtraso(novasEtapas.previsaoChegada, novasEtapas.dataChegada);

    const dataAtualizar = {
      ...(numeroChamado !== undefined && { numeroChamado }),
      ...(descricao !== undefined && { descricao }),
      ...(observacoes !== undefined && { observacoes }),
      ...(tipo !== undefined && { tipo }),
      ...(tecnicoId !== undefined && { tecnicoId: parseInt(tecnicoId) }),
      ...(unidadeId !== undefined && { unidadeId: parseInt(unidadeId) }),
      ...(projetoId !== undefined && { projetoId: projetoId ? parseInt(projetoId) : null }),
      ...(equipamentoId !== undefined && { equipamentoId: equipamentoId ? parseInt(equipamentoId) : null }),
      ...(serialOrigem !== undefined && { serialOrigem }),
      estado: novoEstado,
      status: novoStatus,
      diasAtrasoChegada: novosDiasAtraso,
      ...novasEtapas,
    };

    const solicitacao = await prisma.solicitacaoAtivo.update({
      where: { id },
      data: dataAtualizar,
      include: {
        tecnico: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });

    // Registrar auditoria para campos alterados
    const camposAuditoria = [
      'numeroChamado', 'descricao', 'observacoes', 'tipo', 'status', 'estado',
      'tecnicoId', 'unidadeId', 'serialOrigem', 'equipamentoId',
      'dataDefinicao', 'dataDefinicaoConfirmada', 'dataSolicitacaoNF', 'dataEmissaoNF',
      'dataSolicitacaoColeta', 'dataColeta', 'previsaoChegada', 'dataChegada', 'dataEntrega',
    ];

    const registrosAuditoria = [];
    for (const campo of camposAuditoria) {
      const valAnterior = anterior[campo];
      const valNovo = solicitacao[campo];
      const strAnterior = valAnterior instanceof Date ? valAnterior.toISOString() : String(valAnterior ?? '');
      const strNovo = valNovo instanceof Date ? valNovo.toISOString() : String(valNovo ?? '');
      if (strAnterior !== strNovo) {
        registrosAuditoria.push({
          solicitacaoId: id,
          usuarioId: req.usuario.id,
          campo,
          valorAnterior: valAnterior != null ? strAnterior : null,
          valorNovo: valNovo != null ? strNovo : null,
        });
      }
    }

    if (registrosAuditoria.length > 0) {
      await prisma.solicitacaoAuditoria.createMany({ data: registrosAuditoria });
    }

    res.json(solicitacao);

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId,
      acao: 'EDITAR_SOLICITACAO',
      detalhes: `Solicitação #${id} atualizada por ${req.usuario.nome || req.usuario.email}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe uma solicitação com este número de chamado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar solicitação' });
  }
};

// DELETE /api/solicitacoes/:id — soft delete
const excluir = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const empresaId = req.usuario.empresaId;

    const solicitacao = await prisma.solicitacaoAtivo.findUnique({ where: { id } });
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (solicitacao.empresaId !== empresaId) return res.status(403).json({ error: 'Acesso não autorizado' });

    await prisma.solicitacaoAtivo.update({
      where: { id },
      data: { status: 'ENCERRADO' },
    });

    res.json({ message: 'Solicitação encerrada com sucesso' });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId,
      acao: 'EXCLUIR_SOLICITACAO',
      detalhes: `Solicitação #${id} encerrada (soft delete)`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao encerrar solicitação' });
  }
};

// GET /api/solicitacoes/board
const board = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const isAdmin = req.usuario.role === 'ADMIN' || req.usuario.role === 'SUPERADMIN';
    
    // Se técnico, filtra por projetoId. Se admin, usa do header
    let projetoId = null;
    if (!isAdmin && req.usuario.projetoId) {
      projetoId = req.usuario.projetoId;
    } else if (isAdmin && req.headers['x-projeto-id']) {
      projetoId = parseInt(req.headers['x-projeto-id']);
    }

    const solicitacoes = await prisma.solicitacaoAtivo.findMany({
      where: { 
        empresaId, 
        status: { not: 'ENCERRADO' },
        ...(projetoId && { projetoId })
      },
      include: {
        tecnico: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ESTADOS_ORDEM = [
      'Aberto', 'Aguardando NF', 'NF Solicitada', 'Aguardando Coleta',
      'Coleta Solicitada', 'Em Trânsito', 'Aguardando Entrega', 'Entregue',
    ];

    const resultado = Object.fromEntries(ESTADOS_ORDEM.map(e => [e, []]));
    for (const sol of solicitacoes) {
      const estado = sol.estado || 'Aberto';
      if (resultado[estado]) {
        resultado[estado].push(sol);
      } else {
        resultado['Aberto'].push(sol);
      }
    }

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar board' });
  }
};

// GET /api/solicitacoes/dashboard
const dashboard = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

    const ESTADOS = [
      'Aberto', 'Aguardando NF', 'NF Solicitada', 'Aguardando Coleta',
      'Coleta Solicitada', 'Em Trânsito', 'Aguardando Entrega', 'Entregue',
    ];

    const [totalAbertas, totalEmAndamento, totalEncerradasMes, totalComAtraso, porEstadoRaw, rankingUnidades, porTipoRaw, totalEncerrados] = await Promise.all([
      prisma.solicitacaoAtivo.count({ where: { empresaId, status: { not: 'ENCERRADO' } } }),
      prisma.solicitacaoAtivo.count({ where: { empresaId, status: 'EM_ANDAMENTO' } }),
      prisma.solicitacaoAtivo.count({
        where: { empresaId, status: 'ENCERRADO', updatedAt: { gte: inicioMes, lte: fimMes } },
      }),
      prisma.solicitacaoAtivo.count({
        where: {
          empresaId,
          status: { not: 'ENCERRADO' },
          previsaoChegada: { lt: agora },
          dataChegada: null,
        },
      }),
      prisma.solicitacaoAtivo.groupBy({
        by: ['estado'],
        where: { empresaId, status: { not: 'ENCERRADO' } },
        _count: { id: true },
      }),
      prisma.solicitacaoAtivo.groupBy({
        by: ['unidadeId'],
        where: { empresaId, status: { not: 'ENCERRADO' } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.solicitacaoAtivo.groupBy({
        by: ['tipo'],
        where: { empresaId },
        _count: { id: true },
      }),
      prisma.solicitacaoAtivo.count({
        where: { empresaId, status: 'ENCERRADO' },
      }),
    ]);

    // Montar objeto porEstado com todos os estados zerados
    const porEstado = Object.fromEntries(ESTADOS.map(e => [e, 0]));
    porEstadoRaw.forEach(item => {
      if (item.estado && porEstado.hasOwnProperty(item.estado)) {
        porEstado[item.estado] = item._count.id;
      }
    });

    // Montar objeto porTipo
    const porTipo = {};
    porTipoRaw.forEach(item => {
      if (item.tipo) {
        porTipo[item.tipo] = item._count.id;
      }
    });

    // Total é a soma de todos os tipos
    const totalPorTipo = Object.values(porTipo).reduce((a, b) => a + b, 0);

    // Enriquecer ranking com nomes das unidades
    const unidadeIds = rankingUnidades.map(r => r.unidadeId);
    const unidades = unidadeIds.length > 0
      ? await prisma.unidade.findMany({ where: { id: { in: unidadeIds } }, select: { id: true, nome: true } })
      : [];
    const unidadeMap = Object.fromEntries(unidades.map(u => [u.id, u.nome]));

    const ranking = rankingUnidades.map(r => ({
      unidadeId: r.unidadeId,
      unidadeNome: unidadeMap[r.unidadeId] || `Unidade #${r.unidadeId}`,
      total: r._count.id,
    }));

    const total = totalPorTipo;

    res.json({
      total,
      totalAbertas,
      totalEmAndamento,
      totalEncerradasMes,
      encerradasNoMes: totalEncerradasMes,
      totalComAtraso,
      comAtraso: totalComAtraso,
      totalEncerrados,
      porEstado,
      porTipo,
      rankingUnidades: ranking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
};

// GET /api/solicitacoes/:id/auditoria
const listarAuditoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const empresaId = req.usuario.empresaId;

    const solicitacao = await prisma.solicitacaoAtivo.findUnique({ where: { id }, select: { empresaId: true } });
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (solicitacao.empresaId !== empresaId) return res.status(403).json({ error: 'Acesso não autorizado' });

    const auditoria = await prisma.solicitacaoAuditoria.findMany({
      where: { solicitacaoId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(auditoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
};

module.exports = { derivarEstado, listar, criar, buscarPorId, atualizar, excluir, board, dashboard, listarAuditoria };
