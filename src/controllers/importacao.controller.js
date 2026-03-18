const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const QRCode = require('qrcode');

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar colaboradores' });
  }
};

const importarEquipamentos = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const empresaId = req.usuario.empresaId;
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
      const nova = await prisma.unidade.create({ data: { nome: nomeUnidade.trim(), empresaId } });
      unidadeMap.set(key, nova);
      return nova.id;
    };

    const buscarColaborador = (nomeColaborador) => {
      if (!nomeColaborador) return null;
      const key = norm(nomeColaborador);
      if (colaboradorMap.has(key)) return colaboradorMap.get(key);
      for (const [k, v] of colaboradorMap) {
        if (k.includes(key) || key.includes(k)) return v;
      }
      return null;
    };

    const criarVinculacao = async (equipamentoId, nomeColaborador, numeroChamado) => {
      if (!nomeColaborador) return false;
      if (vinculadosSet.has(equipamentoId)) return false;
      const colaborador = buscarColaborador(nomeColaborador);
      if (!colaborador) return false;
      await prisma.vinculacao.create({
        data: {
          usuarioId: colaborador.id,
          equipamentoId,
          numeroChamado: numeroChamado || null,
          tipoOperacao: 'Importacao',
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
                unidadeId,
                ...(serial && { serialNumber: serial }),
                ...(patrimonio && { patrimonio }),
              },
            });
            if (colaborador && status === 'EM_USO') {
              const ok = await criarVinculacao(existente.id, colaborador, chamado || null);
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
              unidadeId,
              empresaId,
              ...(patrimonio && { patrimonio }),
            },
          });

          if (serial) equipPorSerial.set(serial, equip);
          if (patrimonio) equipPorPatrimonio.set(patrimonio, equip);

          QRCode.toDataURL(JSON.stringify({ id: equip.id, serial, empresa: empresaId }))
            .then(qrCode => prisma.equipamento.update({ where: { id: equip.id }, data: { qrCode } }))
            .catch(() => {});

          if (colaborador && status === 'EM_USO') {
            const ok = await criarVinculacao(equip.id, colaborador, chamado || null);
            if (ok) vinculados++;
          }

          criados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }));
    }

    res.json({ message: 'Importacao concluida', criados, atualizados, vinculados, erros: erros.length, detalhesErros: erros.slice(0, 10) });
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

module.exports = { importarUsuarios, importarEquipamentos, previewPlanilha };