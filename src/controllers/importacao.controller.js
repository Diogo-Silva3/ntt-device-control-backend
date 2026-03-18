const XLSX = require('xlsx');
const prisma = require('../config/prisma');
const QRCode = require('qrcode');

// Lê planilha e retorna linhas não vazias (com ou sem cabeçalho)
function lerPlanilha(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Tenta com cabeçalho primeiro
  const comHeader = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  // Sem cabeçalho (array de arrays)
  const semHeader = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });

  // Se a primeira linha parece ser cabeçalho (tem texto reconhecível), usa com header
  const primeiraLinha = semHeader[0] || [];
  const temHeader = primeiraLinha.some(c =>
    /nome|serial|marca|modelo|tipo|unidade|email|função|funcao|cargo/i.test(String(c))
  );

  return { comHeader, semHeader, temHeader };
}

const importarUsuarios = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

    const empresaId = req.usuario.empresaId;
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);

    let criados = 0, atualizados = 0, erros = [];

    if (temHeader) {
      // Planilha com cabeçalho — mapeia por nome de coluna
      for (const row of comHeader) {
        try {
          const nome = String(row['Nome'] || row['NOME'] || row['nome'] || '').trim();
          const funcao = String(row['Nome Funcão'] || row['Função'] || row['FUNÇÃO'] || row['Cargo'] || row['CARGO'] || row['funcao'] || '').trim();
          const email = String(row['Email'] || row['EMAIL'] || row['E-mail'] || row['email'] || '').trim();
          const nomeUnidade = String(row['Unidade'] || row['UNIDADE'] || row['Local'] || row['LOCAL'] || '').trim();

          if (!nome) continue;

          let unidadeId = null;
          if (nomeUnidade) {
            const unidade = await prisma.unidade.upsert({
              where: { nome_empresaId: { nome: nomeUnidade, empresaId } },
              update: {},
              create: { nome: nomeUnidade, empresaId },
            });
            unidadeId = unidade.id;
          }

          if (email) {
            const existente = await prisma.usuario.findFirst({ where: { email, empresaId } });
            if (existente) {
              await prisma.usuario.update({ where: { id: existente.id }, data: { nome, funcao, unidadeId, role: 'COLABORADOR' } });
              atualizados++;
              continue;
            }
          }

          await prisma.usuario.create({
            data: { nome, email: email || null, funcao, unidadeId, empresaId, role: 'COLABORADOR' },
          });
          criados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }
    } else {
      // Sem cabeçalho — tenta mapear por posição
      const linhasValidas = semHeader.filter(r => r.some(c => String(c).trim() !== ''));
      for (const row of linhasValidas) {
        try {
          const nome = String(row[0] || '').trim();
          const funcao = String(row[1] || '').trim();
          const nomeUnidade = String(row[7] || row[3] || '').trim();
          const email = String(row[8] || row[2] || '').trim();

          if (!nome) continue;

          let unidadeId = null;
          if (nomeUnidade) {
            const unidade = await prisma.unidade.upsert({
              where: { nome_empresaId: { nome: nomeUnidade, empresaId } },
              update: {},
              create: { nome: nomeUnidade, empresaId },
            });
            unidadeId = unidade.id;
          }

          if (email && email.includes('@')) {
            const existente = await prisma.usuario.findFirst({ where: { email, empresaId } });
            if (existente) {
              await prisma.usuario.update({ where: { id: existente.id }, data: { nome, funcao, unidadeId, role: 'COLABORADOR' } });
              atualizados++;
              continue;
            }
          }

          await prisma.usuario.create({
            data: { nome, email: (email && email.includes('@')) ? email : null, funcao, unidadeId, empresaId, role: 'COLABORADOR' },
          });
          criados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }
    }

    res.json({ message: 'Importação concluída', criados, atualizados, erros: erros.length, detalhesErros: erros.slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar usuários' });
  }
};

const importarEquipamentos = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

    const empresaId = req.usuario.empresaId;
    const { comHeader, semHeader, temHeader } = lerPlanilha(req.file.buffer);

    let criados = 0, atualizados = 0, erros = [];

    const statusMap = {
      'DISPONIVEL': 'DISPONIVEL', 'DISPONÍVEL': 'DISPONIVEL',
      'EM USO': 'EM_USO', 'EM_USO': 'EM_USO', 'EMUSO': 'EM_USO', 'USO': 'EM_USO',
      'MANUTENÇÃO': 'MANUTENCAO', 'MANUTENCAO': 'MANUTENCAO',
      'DESCARTADO': 'DESCARTADO', 'EMPRESTADO': 'EMPRESTADO',
      'NOVO': 'DISPONIVEL', 'NEW': 'DISPONIVEL',
    };

    const processarLinha = async (tipo, marca, modelo, serialNumber, statusRaw, nomeUnidade) => {
      const status = statusMap[String(statusRaw).trim().toUpperCase()] || 'DISPONIVEL';

      let unidadeId = null;
      if (nomeUnidade && nomeUnidade.trim()) {
        const unidade = await prisma.unidade.upsert({
          where: { nome_empresaId: { nome: nomeUnidade.trim(), empresaId } },
          update: {},
          create: { nome: nomeUnidade.trim(), empresaId },
        });
        unidadeId = unidade.id;
      }

      if (serialNumber) {
        const existente = await prisma.equipamento.findFirst({ where: { serialNumber, empresaId } });
        if (existente) {
          await prisma.equipamento.update({
            where: { id: existente.id },
            data: { tipo: tipo || existente.tipo, marca: marca || existente.marca, modelo: modelo || existente.modelo, status, unidadeId },
          });
          return 'atualizado';
        }
      }

      const equip = await prisma.equipamento.create({
        data: { tipo: tipo || null, marca: marca || null, modelo: modelo || null, serialNumber: serialNumber || null, status, unidadeId, empresaId },
      });

      const qrData = JSON.stringify({ id: equip.id, serial: serialNumber, empresa: empresaId });
      const qrCode = await QRCode.toDataURL(qrData);
      await prisma.equipamento.update({ where: { id: equip.id }, data: { qrCode } });

      return 'criado';
    };

    if (temHeader) {
      for (const row of comHeader) {
        try {
          const tipo = String(row['Tipo'] || row['TIPO'] || row['tipo'] || row['Categoria'] || '').trim();
          const marca = String(row['Marca'] || row['MARCA'] || row['marca'] || '').trim();
          const modelo = String(row['Modelo'] || row['MODELO'] || row['modelo'] || '').trim();
          const serial = String(row['Serial'] || row['SERIAL'] || row['Serial Number'] || row['Número de Série'] || row['N° Serie'] || row['serial_number'] || '').trim();
          const statusRaw = String(row['Status'] || row['STATUS'] || 'Novo').trim();
          const unidade = String(row['Unidade'] || row['UNIDADE'] || row['Local'] || '').trim();

          if (!tipo && !marca && !modelo && !serial) continue;

          const resultado = await processarLinha(tipo, marca, modelo, serial, statusRaw, unidade);
          resultado === 'criado' ? criados++ : atualizados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }
    } else {
      // Sem cabeçalho: [tipo, marca, modelo, serial, status, empresa/unidade]
      const linhasValidas = semHeader.filter(r => r.some(c => String(c).trim() !== ''));
      for (const row of linhasValidas) {
        try {
          const tipo = String(row[0] || '').trim();
          const marca = String(row[1] || '').trim();
          const modelo = String(row[2] || '').trim();
          const serial = String(row[3] || '').trim();
          const statusRaw = String(row[4] || 'Novo').trim();
          const unidade = String(row[5] || '').trim();

          if (!tipo && !marca && !modelo && !serial) continue;

          const resultado = await processarLinha(tipo, marca, modelo, serial, statusRaw, unidade);
          resultado === 'criado' ? criados++ : atualizados++;
        } catch (e) {
          erros.push({ linha: JSON.stringify(row), erro: e.message });
        }
      }
    }

    res.json({ message: 'Importação concluída', criados, atualizados, erros: erros.length, detalhesErros: erros.slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao importar equipamentos' });
  }
};

const previewPlanilha = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
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
