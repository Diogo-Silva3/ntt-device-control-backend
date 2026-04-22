const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const QRCode = require('qrcode');
const { registrarLog } = require('./auditoria.controller');

function lerPlanilha(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const comHeader = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const semHeader = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
  const primeiraLinha = semHeader[0] || [];
  const temHeader = primeiraLinha.some(c =>
    /nome|serial|marca|modelo|tipo|unidade|email|funcao|cargo/i.test(String(c))
  );
  return { comHeader, semHeader, temHeader };
}

function norm(str) {
  return String(str || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function resolverStatus(raw) {
  const s = norm(raw).replace(/\s/g, '');
  if (s === 'emuso' || s === 'uso') return 'EM_USO';
  if (s === 'manutencao') return 'MANUTENCAO';
  if (s === 'descartado') return 'DESCARTADO';
  if (s === 'emprestado') return 'EMPRESTADO';
  return 'DISPONIVEL';
}

const importarUsuarios = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const empresaId = req.usuario.empresaId;
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);
    let criados = 0, atualizados = 0, erros = [];

    const processarColaborador = async (nome, funcao, email, nomeUnidade) => {
      if (!nome) return;
      let unidadeId = null;
      if (nomeUnidade) {
        const unidade = await prisma.unidade.upsert({
          where: { nome_empresaId: { nome: nomeUnidade, empresaId } },
          update: {},
          create: { nome: nomeUnidade, empresaId },
        });
        unidadeId = unidade.id;
      }
      let existente = null;
      if (email && email.includes('@')) {
        existente = await prisma.usuario.findFirst({ where: { email, empresaId } });
      }
      if (!existente) {
        existente = await prisma.usuario.findFirst({
          where: { nome: { equals: nome, mode: 'insensitive' }, empresaId, role: 'COLABORADOR' },
        });
      }
      if (existente) {
        await prisma.usuario.update({
          where: { id: existente.id },
          data: { nome, funcao: funcao || existente.funcao, unidadeId: unidadeId || existente.unidadeId, role: 'COLABORADOR' },
        });
        atualizados++;
      } else {
        await prisma.usuario.create({
          data: { nome, email: (email && email.includes('@')) ? email : null, funcao, unidadeId, empresaId, role: 'COLABORADOR' },
        });
        criados++;
      }
    };

    if (temHeader) {
      for (const row of comHeader) {
        try {
          const nome = String(row['Nome'] || row['NOME'] || row['nome'] || '').trim();
          const funcao = String(row['Funcao'] || row['Cargo'] || row['CARGO'] || '').trim();
          const email = String(row['Email'] || row['EMAIL'] || row['email'] || '').trim();
          const nomeUnidade = String(row['Unidade'] || row['UNIDADE'] || row['Local'] || '').trim();
          await processarColaborador(nome, funcao, email, nomeUnidade);
        } catch (e) { erros.push({ linha: JSON.stringify(row), erro: e.message }); }
      }
    } else {
      const linhasValidas = semHeader.filter(r => r.some(c => String(c).trim() !== ''));
      for (const row of linhasValidas) {
        try {
          await processarColaborador(
            String(row[0] || '').trim(),
            String(row[1] || '').trim(),
            String(row[8] || row[2] || '').trim(),
            String(row[7] || row[3] || '').trim()
          );
        } catch (e) { erros.push({ linha: JSON.stringify(row), erro: e.message }); }
      }
    }

    res.json({ message: 'Importacao concluida', criados, atualizados, erros: erros.length, detalhesErros: erros.slice(0, 10) });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'IMPORTACAO_USUARIOS',
      detalhes: `Planilha de colaboradores importada — criados: ${criados}, atualizados: ${atualizados}, erros: ${erros.length}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar colaboradores' });
  }
};

const importarEquipamentos = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const empresaId = req.usuario.empresaId;
    const projetoId = req.body.projetoId ? parseInt(req.body.projetoId) : null;
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);
    let criados = 0, atualizados = 0, vinculados = 0, erros = [];

    const unidadesExistentes = await prisma.unidade.findMany({ where: { empresaId } });
    const unidadeMap = new Map(unidadesExistentes.map(u => [norm(u.nome), u]));

    const equipamentosExistentes = await prisma.equipamento.findMany({
      where: { empresaId },
      select: { id: true, serialNumber: true, patrimonio: true, tipo: true, marca: true, modelo: true },
    });
    const equipPorSerial = new Map(equipamentosExistentes.filter(e => e.serialNumber).map(e => [e.serialNumber, e]));
    const equipPorPatrimonio = new Map(equipamentosExistentes.filter(e => e.patrimonio).map(e => [e.patrimonio, e]));

    const colaboradoresExistentes = await prisma.usuario.findMany({
      where: { empresaId, role: 'COLABORADOR', ativo: true },
      select: { id: true, nome: true },
    });
    const colaboradorMap = new Map(colaboradoresExistentes.map(c => [norm(c.nome), c]));

    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: { ativa: true, equipamento: { empresaId } },
      select: { equipamentoId: true },
    });
    const vinculadosSet = new Set(vinculacoesAtivas.map(v => v.equipamentoId));

    const getOrCreateUnidade = async (nomeUnidade) => {
      if (!nomeUnidade || !nomeUnidade.trim()) return null;
      const key = norm(nomeUnidade);
      if (unidadeMap.has(key)) return unidadeMap.get(key).id;
      const nova = await prisma.unidade.create({ data: { nome: nomeUnidade.trim().toUpperCase(), empresaId } });
      unidadeMap.set(key, nova);
      return nova.id;
    };

    const buscarColaborador = (nomeColaborador) => {
      if (!nomeColaborador) return null;
      const key = norm(nomeColaborador);
      // 1. match exato
      if (colaboradorMap.has(key)) return colaboradorMap.get(key);
      // 2. um contém o outro
      for (const [k, v] of colaboradorMap) {
        if (k.includes(key) || key.includes(k)) return v;
      }
      // 3. busca por palavras: pelo menos 3 palavras do nome batem
      const palavras = key.split(/\s+/).filter(p => p.length > 2);
      let melhor = null, melhorScore = 0;
      for (const [k, v] of colaboradorMap) {
        const score = palavras.filter(p => k.includes(p)).length;
        if (score >= 3 && score > melhorScore) { melhor = v; melhorScore = score; }
      }
      if (melhor) return melhor;
      // 4. primeiro e último nome batem
      if (palavras.length >= 2) {
        const primeiro = palavras[0], ultimo = palavras[palavras.length - 1];
        for (const [k, v] of colaboradorMap) {
          if (k.includes(primeiro) && k.includes(ultimo)) return v;
        }
      }
      return null;
    };

    const criarVinculacao = async (equipamentoId, nomeColaborador, numeroChamado, unidadeId, statusEntrega = 'PENDENTE') => {
      if (!nomeColaborador) return false;
      if (vinculadosSet.has(equipamentoId)) return false;
      let colaborador = buscarColaborador(nomeColaborador);
      // Se não encontrou, cria automaticamente
      if (!colaborador) {
        colaborador = await prisma.usuario.create({
          data: {
            nome: nomeColaborador.trim().toUpperCase(),
            role: 'COLABORADOR',
            ativo: true,
            empresaId,
            ...(unidadeId && { unidadeId }),
          }
        });
        colaboradorMap.set(norm(colaborador.nome), colaborador);
      }
      await prisma.vinculacao.create({
        data: {
          usuarioId: colaborador.id,
          equipamentoId,
          numeroChamado: numeroChamado || null,
          tipoOperacao: 'Importacao',
          statusEntrega,
          ativa: true,
        },
      });
      vinculadosSet.add(equipamentoId);
      return true;
    };

    const normalizarLinhas = () => {
      if (temHeader) {
        return comHeader.map(row => ({
          tipo: String(row['Tipo'] || row['TIPO'] || row['tipo'] || row['Categoria'] || '').trim(),
          marca: String(row['Marca'] || row['MARCA'] || row['marca'] || '').trim(),
          modelo: String(row['Modelo'] || row['MODELO'] || row['modelo'] || '').trim(),
          serial: String(row['Serial'] || row['SERIAL'] || row['Serial Number'] || row['serial_number'] || '').trim(),
          statusRaw: String(row['Status'] || row['STATUS'] || '').trim(),
          unidade: String(row['Unidade'] || row['UNIDADE'] || row['Local'] || '').trim(),
          patrimonio: String(row['Patrimonio'] || row['PATRIMONIO'] || row['patrimonio'] || '').trim(),
          colaborador: String(row['Colaborador'] || row['COLABORADOR'] || row['Usuario'] || '').trim(),
          chamado: String(row['Numero do Chamado'] || row['Chamado'] || row['chamado'] || '').trim(),
        }));
      } else {
        return semHeader
          .filter(r => r.some(c => String(c).trim() !== ''))
          .map(row => ({
            tipo: String(row[0] || '').trim(),
            marca: String(row[1] || '').trim(),
            modelo: String(row[2] || '').trim(),
            serial: String(row[3] || '').trim(),
            statusRaw: String(row[4] || '').trim(),
            unidade: String(row[5] || '').trim(),
            patrimonio: '',
            colaborador: '',
            chamado: '',
          }));
      }
    };

    const linhas = normalizarLinhas().filter(r => r.tipo || r.marca || r.modelo || r.serial);

    const BATCH = 20;
    for (let i = 0; i < linhas.length; i += BATCH) {
      const lote = linhas.slice(i, i + BATCH);
      await Promise.all(lote.map(async (row) => {
        try {
          const { tipo, marca, modelo, serial, statusRaw, unidade, patrimonio, colaborador, chamado } = row;
          const status = resolverStatus(statusRaw);
          const unidadeId = await getOrCreateUnidade(unidade);

          const existente = (serial && equipPorSerial.get(serial)) || (patrimonio && equipPorPatrimonio.get(patrimonio)) || null;

          if (existente) {
            await prisma.equipamento.update({
              where: { id: existente.id },
              data: {
                tipo: tipo || existente.tipo,
                marca: marca || existente.marca,
                modelo: modelo || existente.modelo,
                status,
                statusProcesso: status === 'EM_USO' ? 'Entregue ao Usuário' : (status === 'DISPONIVEL' ? 'Novo' : undefined),
                unidadeId,
                ...(projetoId && { projetoId }),
                ...(serial && { serialNumber: serial }),
                ...(patrimonio && { patrimonio }),
              },
            });
            if (colaborador) {
              const ok = await criarVinculacao(existente.id, colaborador, chamado || null, unidadeId, status === 'EM_USO' ? 'ENTREGUE' : 'PENDENTE');
              if (ok) vinculados++;
            }
            atualizados++;
            return;
          }

          const equip = await prisma.equipamento.create({
            data: {
              tipo: tipo || null,
              marca: marca || null,
              modelo: modelo || null,
              serialNumber: serial || null,
              status,
              statusProcesso: status === 'EM_USO' ? 'Entregue ao Usuário' : 'Novo',
              unidadeId,
              empresaId,
              ...(projetoId && { projetoId }),
              ...(patrimonio && { patrimonio }),
            },
          });

          if (serial) equipPorSerial.set(serial, equip);
          if (patrimonio) equipPorPatrimonio.set(patrimonio, equip);

          QRCode.toDataURL(JSON.stringify({ id: equip.id, serial, empresa: empresaId }))
            .then(qrCode => prisma.equipamento.update({ where: { id: equip.id }, data: { qrCode } }))
            .catch(() => {});

          if (colaborador) {
            const ok = await criarVinculacao(equip.id, colaborador, chamado || null, unidadeId, status === 'EM_USO' ? 'ENTREGUE' : 'PENDENTE');
            if (ok) vinculados++;
          }

          criados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }));
    }

    res.json({ message: 'Importacao concluida', criados, atualizados, vinculados, erros: erros.length, detalhesErros: erros.slice(0, 10) });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'IMPORTACAO_EQUIPAMENTOS',
      detalhes: `Planilha de equipamentos importada — criados: ${criados}, atualizados: ${atualizados}, vinculados: ${vinculados}, erros: ${erros.length}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar equipamentos' });
  }
};

const previewPlanilha = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);
    if (temHeader) {
      res.json({ colunas: comHeader.length > 0 ? Object.keys(comHeader[0]) : [], preview: comHeader.slice(0, 5), total: comHeader.length, temHeader: true });
    } else {
      const linhasValidas = semHeader.filter(r => r.some(c => String(c).trim() !== ''));
      res.json({ colunas: [], preview: linhasValidas.slice(0, 5), total: linhasValidas.length, temHeader: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler planilha' });
  }
};

const parseData = (dataStr) => {
  if (!dataStr || typeof dataStr !== 'string') return null;
  const trimmed = dataStr.trim();
  if (!trimmed) return null;
  
  // Tenta formato DD/MM/YYYY
  const match = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, dia, mes, ano] = match;
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }
  
  // Tenta formato ISO
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
};

const importarSolicitacoes = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const empresaId = req.usuario.empresaId;
    const projetoId = req.body.projetoId ? parseInt(req.body.projetoId) : null;
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);
    let criadas = 0, atualizadas = 0, erros = [];

    // Buscar técnicos e unidades
    const tecnicos = await prisma.usuario.findMany({
      where: { empresaId, role: { in: ['TECNICO', 'ADMIN'] } },
      select: { id: true, nome: true },
    });
    const tecnicoMap = new Map(tecnicos.map(t => [norm(t.nome), t]));

    const unidades = await prisma.unidade.findMany({
      where: { empresaId },
      select: { id: true, nome: true },
    });
    const unidadeMap = new Map(unidades.map(u => [norm(u.nome), u]));

    const buscarTecnico = (nomeTecnico) => {
      if (!nomeTecnico) return null;
      const key = norm(nomeTecnico);
      if (tecnicoMap.has(key)) return tecnicoMap.get(key);
      for (const [k, v] of tecnicoMap) {
        if (k.includes(key) || key.includes(k)) return v;
      }
      return null;
    };

    const buscarUnidade = (nomeUnidade) => {
      if (!nomeUnidade) return null;
      const key = norm(nomeUnidade);
      if (unidadeMap.has(key)) return unidadeMap.get(key);
      for (const [k, v] of unidadeMap) {
        if (k.includes(key) || key.includes(k)) return v;
      }
      return null;
    };

    const normalizarLinhas = () => {
      if (temHeader) {
        return comHeader.map(row => ({
          numero: String(row['Número'] || row['numero'] || '').trim(),
          dataCriacao: parseData(String(row['Criado'] || row['criado'] || '')),
          descricao: String(row['DESCRIÇÃO'] || row['Descricao'] || row['descricao'] || '').trim(),
          numeroChamado: String(row['CHAMADO'] || row['Chamado'] || row['chamado'] || '').trim(),
          atribuidoA: String(row['Atribuído a'] || row['atribuido_a'] || '').trim(),
          status: String(row['STATUS'] || row['Status'] || row['status'] || 'ABERTO').trim(),
          dataDefinicao: parseData(String(row['Solicitação da definição'] || row['data_definicao'] || '')),
          dataDefinicaoConfirmada: parseData(String(row['Data da definição'] || row['data_definicao_confirmada'] || '')),
          dataSolicitacaoNF: parseData(String(row['Data da solicitação da nota'] || row['data_solicitacao_nf'] || '')),
          dataEmissaoNF: parseData(String(row['Data da emissão da nota'] || row['data_emissao_nf'] || '')),
          dataSolicitacaoColeta: parseData(String(row['Data da solicitação de coleta'] || row['data_solicitacao_coleta'] || '')),
          dataColeta: parseData(String(row['Data da coleta'] || row['data_coleta'] || '')),
          previsaoChegada: parseData(String(row['Previsão de chegada'] || row['previsao_chegada'] || '')),
          dataChegada: parseData(String(row['Data de chegada'] || row['data_chegada'] || '')),
          dataEntrega: parseData(String(row['Data da Entrega'] || row['data_entrega'] || '')),
          observacoes: String(row['OBS'] || row['Observacoes'] || row['observacoes'] || '').trim(),
        }));
      } else {
        return semHeader
          .filter(r => r.some(c => String(c).trim() !== ''))
          .map(row => ({
            numero: String(row[0] || '').trim(),
            dataCriacao: parseData(String(row[1] || '')),
            descricao: String(row[2] || '').trim(),
            numeroChamado: String(row[3] || '').trim(),
            atribuidoA: String(row[4] || '').trim(),
            status: String(row[5] || 'ABERTO').trim(),
            dataDefinicao: parseData(String(row[6] || '')),
            dataDefinicaoConfirmada: parseData(String(row[7] || '')),
            dataSolicitacaoNF: parseData(String(row[8] || '')),
            dataEmissaoNF: parseData(String(row[9] || '')),
            dataSolicitacaoColeta: parseData(String(row[10] || '')),
            dataColeta: parseData(String(row[11] || '')),
            previsaoChegada: parseData(String(row[12] || '')),
            dataChegada: parseData(String(row[13] || '')),
            dataEntrega: parseData(String(row[14] || '')),
            observacoes: String(row[15] || '').trim(),
          }));
      }
    };

    const linhas = normalizarLinhas().filter(r => r.numeroChamado || r.numero);

    for (const row of linhas) {
      try {
        const { numero, numeroChamado, descricao, atribuidoA, status, observacoes, 
                dataCriacao, dataDefinicao, dataDefinicaoConfirmada, dataSolicitacaoNF,
                dataEmissaoNF, dataSolicitacaoColeta, dataColeta, previsaoChegada,
                dataChegada, dataEntrega } = row;

        const chamado = numeroChamado || numero;
        if (!chamado) continue;

        // Buscar técnico
        const tecnicoObj = buscarTecnico(atribuidoA);
        if (!tecnicoObj) {
          erros.push({ linha: chamado, erro: `Técnico "${atribuidoA}" não encontrado` });
          continue;
        }

        // Buscar unidade (usar a unidade do técnico)
        let unidadeId = tecnicoObj.unidadeId;
        if (!unidadeId) {
          const unidades = await prisma.usuario.findUnique({
            where: { id: tecnicoObj.id },
            select: { unidadeId: true },
          });
          unidadeId = unidades?.unidadeId;
        }

        // Verificar se já existe
        const existente = await prisma.solicitacaoAtivo.findUnique({
          where: { numeroChamado_empresaId: { numeroChamado: chamado, empresaId } },
        });

        const dataAtualizado = new Date();
        const diasAtraso = dataChegada && previsaoChegada 
          ? Math.floor((dataChegada - previsaoChegada) / (1000 * 60 * 60 * 24))
          : null;

        if (existente) {
          // Atualizar
          await prisma.solicitacaoAtivo.update({
            where: { id: existente.id },
            data: {
              descricao: descricao || existente.descricao,
              status: status || existente.status,
              estado: status || existente.estado,
              tecnicoId: tecnicoObj.id,
              unidadeId: unidadeId || existente.unidadeId,
              observacoes: observacoes || existente.observacoes,
              dataCriacao: dataCriacao || existente.dataCriacao,
              dataDefinicao: dataDefinicao || existente.dataDefinicao,
              dataDefinicaoConfirmada: dataDefinicaoConfirmada || existente.dataDefinicaoConfirmada,
              dataSolicitacaoNF: dataSolicitacaoNF || existente.dataSolicitacaoNF,
              dataEmissaoNF: dataEmissaoNF || existente.dataEmissaoNF,
              dataSolicitacaoColeta: dataSolicitacaoColeta || existente.dataSolicitacaoColeta,
              dataColeta: dataColeta || existente.dataColeta,
              previsaoChegada: previsaoChegada || existente.previsaoChegada,
              dataChegada: dataChegada || existente.dataChegada,
              dataEntrega: dataEntrega || existente.dataEntrega,
              diasAtrasoChegada: diasAtraso || existente.diasAtrasoChegada,
              ...(projetoId && { projetoId }),
            },
          });
          atualizadas++;
        } else {
          // Criar
          await prisma.solicitacaoAtivo.create({
            data: {
              numeroChamado: chamado,
              descricao: descricao || null,
              status: status || 'ABERTO',
              estado: status || 'Aberto',
              tecnicoId: tecnicoObj.id,
              unidadeId: unidadeId || null,
              observacoes: observacoes || null,
              dataCriacao: dataCriacao || new Date(),
              dataDefinicao: dataDefinicao || null,
              dataDefinicaoConfirmada: dataDefinicaoConfirmada || null,
              dataSolicitacaoNF: dataSolicitacaoNF || null,
              dataEmissaoNF: dataEmissaoNF || null,
              dataSolicitacaoColeta: dataSolicitacaoColeta || null,
              dataColeta: dataColeta || null,
              previsaoChegada: previsaoChegada || null,
              dataChegada: dataChegada || null,
              dataEntrega: dataEntrega || null,
              diasAtrasoChegada: diasAtraso || null,
              empresaId,
              ...(projetoId && { projetoId }),
              importado: true,
            },
          });
          criadas++;
        }
      } catch (e) {
        erros.push({ linha: row.numeroChamado || row.numero, erro: e.message });
      }
    }

    res.json({ message: 'Importacao concluida', criadas, atualizadas, erros: erros.length, detalhesErros: erros.slice(0, 10) });

    registrarLog({
      usuarioId: req.usuario.id,
      empresaId: req.usuario.empresaId,
      projetoId: req.usuario?.projetoIdAtivo || null,
      acao: 'IMPORTACAO_SOLICITACOES',
      detalhes: `Planilha de solicitações importada — criadas: ${criadas}, atualizadas: ${atualizadas}, erros: ${erros.length}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar solicitações' });
  }
};

module.exports = { importarUsuarios, importarEquipamentos, importarSolicitacoes, previewPlanilha };