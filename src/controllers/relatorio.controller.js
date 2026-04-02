const prisma = require('../config/prisma');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const getEquipamentosPorUnidade = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const unidades = await prisma.unidade.findMany({
      where: { empresaId },
      include: {
        equipamentos: {
          include: {
            vinculacoes: {
              where: { ativa: true },
              include: { usuario: { select: { nome: true } } },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

const getEquipamentosDisponiveis = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const equipamentos = await prisma.equipamento.findMany({
      where: { empresaId, status: 'DISPONIVEL' },
      include: { unidade: true },
      orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }],
    });
    res.json(equipamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

const exportarPDF = async (req, res) => {
  try {
    const { tipo = 'geral' } = req.query;
    const empresaId = req.usuario.empresaId;
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });

    // Busca dados conforme tipo
    let titulo = 'Relatório';
    let headers = [];
    let colWidths = [];
    let rows = [];

    const statusLabel = s => s === 'DISPONIVEL' ? 'Disponível' : s === 'EM_USO' ? 'Em Uso' : s === 'MANUTENCAO' ? 'Manutenção' : s || '-';
    const trunc = (s, n = 28) => String(s || '-').substring(0, n);

    if (tipo === 'geral' || tipo === 'disponiveis') {
      titulo = tipo === 'disponiveis' ? 'Equipamentos Disponíveis' : 'Todos os Equipamentos';
      headers = ['Marca / Modelo', 'Tipo', 'Serial', 'Unidade', 'Status', 'Colaborador'];
      colWidths = [130, 60, 105, 90, 70, 80];
      const data = await prisma.equipamento.findMany({
        where: { empresaId, ...(tipo === 'disponiveis' && { status: 'DISPONIVEL' }) },
        include: { unidade: true, vinculacoes: { where: { ativa: true }, include: { usuario: { select: { nome: true } } } } },
        orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }],
      });
      rows = data.map(eq => [
        trunc(`${eq.marca || ''} ${eq.modelo || ''}`.trim()),
        trunc(eq.tipo, 12), trunc(eq.serialNumber, 18), trunc(eq.unidade?.nome, 18),
        statusLabel(eq.status), trunc(eq.vinculacoes[0]?.usuario?.nome, 20),
      ]);
    } else if (tipo === 'colaboradores') {
      titulo = 'Todos os Colaboradores';
      headers = ['Nome', 'Função', 'Email', 'Unidade', 'Equipamento'];
      colWidths = [120, 90, 120, 90, 115];
      const data = await prisma.usuario.findMany({
        where: { empresaId, ativo: true },
        include: { unidade: { select: { nome: true } }, vinculacoes: { where: { ativa: true }, include: { equipamento: { select: { marca: true, modelo: true, serialNumber: true } } } } },
        orderBy: { nome: 'asc' },
      });
      rows = data.map(u => [
        trunc(u.nome, 22), trunc(u.funcao, 18), trunc(u.email, 24), trunc(u.unidade?.nome, 18),
        trunc(u.vinculacoes[0] ? `${u.vinculacoes[0].equipamento.marca || ''} ${u.vinculacoes[0].equipamento.modelo || ''}`.trim() : 'Sem equipamento', 22),
      ]);
    } else if (tipo === 'vinculacoes') {
      titulo = 'Vinculações Ativas';
      headers = ['Colaborador', 'Função', 'Unidade', 'Equipamento', 'Serial', 'Desde'];
      colWidths = [110, 80, 85, 100, 85, 75];
      const data = await prisma.vinculacao.findMany({
        where: { ativa: true, usuario: { empresaId } },
        include: { usuario: { select: { nome: true, funcao: true, unidade: { select: { nome: true } } } }, equipamento: { select: { marca: true, modelo: true, serialNumber: true } } },
        orderBy: { dataInicio: 'desc' },
      });
      rows = data.map(v => [
        trunc(v.usuario.nome, 20), trunc(v.usuario.funcao, 16), trunc(v.usuario.unidade?.nome, 16),
        trunc(`${v.equipamento.marca || ''} ${v.equipamento.modelo || ''}`.trim(), 20),
        trunc(v.equipamento.serialNumber, 16), new Date(v.dataInicio).toLocaleDateString('pt-BR'),
      ]);
    } else if (tipo === 'porUnidade') {
      titulo = 'Equipamentos por Unidade';
      headers = ['Unidade', 'Equipamento', 'Tipo', 'Serial', 'Status'];
      colWidths = [110, 130, 70, 110, 80];
      const data = await prisma.unidade.findMany({
        where: { empresaId },
        include: { equipamentos: { select: { tipo: true, marca: true, modelo: true, serialNumber: true, status: true } } },
        orderBy: { nome: 'asc' },
      });
      data.forEach(u => u.equipamentos.forEach(eq => rows.push([
        trunc(u.nome, 20), trunc(`${eq.marca || ''} ${eq.modelo || ''}`.trim(), 24),
        trunc(eq.tipo, 14), trunc(eq.serialNumber, 20), statusLabel(eq.status),
      ])));
    } else if (tipo === 'colabSemEquip') {
      titulo = 'Colaboradores sem Equipamento';
      headers = ['Nome', 'Função', 'Email', 'Unidade'];
      colWidths = [140, 110, 150, 135];
      const data = await prisma.usuario.findMany({ where: { empresaId, ativo: true, vinculacoes: { none: { ativa: true } } }, include: { unidade: { select: { nome: true } } }, orderBy: { nome: 'asc' } });
      rows = data.map(u => [trunc(u.nome, 26), trunc(u.funcao, 20), trunc(u.email, 28), trunc(u.unidade?.nome, 24)]);
    } else if (tipo === 'equipSemColab') {
      titulo = 'Equipamentos sem Colaborador';
      headers = ['Equipamento', 'Tipo', 'Serial', 'Status', 'Unidade'];
      colWidths = [140, 70, 110, 80, 135];
      const data = await prisma.equipamento.findMany({ where: { empresaId, vinculacoes: { none: { ativa: true } } }, include: { unidade: { select: { nome: true } } }, orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }] });
      rows = data.map(eq => [trunc(`${eq.marca || ''} ${eq.modelo || ''}`.trim(), 26), trunc(eq.tipo, 14), trunc(eq.serialNumber, 20), statusLabel(eq.status), trunc(eq.unidade?.nome, 24)]);
    } else if (tipo === 'preparacao') {
      titulo = 'Preparação de Equipamentos';
      headers = ['Equipamento', 'Serial', 'Unidade', 'Etapa', 'Técnico', 'Dias'];
      colWidths = [120, 90, 90, 110, 80, 45];
      const ORDEM = ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega', 'Entregue ao Usuário'];
      const data = await prisma.equipamento.findMany({
        where: { empresaId },
        select: { marca: true, modelo: true, serialNumber: true, statusProcesso: true, updatedAt: true, unidade: { select: { nome: true } }, tecnico: { select: { nome: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      rows = data.map(eq => {
        const dias = Math.floor((new Date() - new Date(eq.updatedAt)) / (1000 * 60 * 60 * 24));
        return [trunc(`${eq.marca || ''} ${eq.modelo || ''}`.trim(), 22), trunc(eq.serialNumber, 16), trunc(eq.unidade?.nome, 16), trunc(eq.statusProcesso || 'Novo', 20), trunc(eq.tecnico?.nome, 16), `${dias}d`];
      });
    } else if (tipo === 'agendamentos') {
      titulo = 'Agendamentos da Semana';
      headers = ['Equipamento', 'Serial', 'Unidade', 'Destinatário', 'Técnico'];
      colWidths = [120, 90, 90, 120, 115];
      const data = await prisma.equipamento.findMany({
        where: { empresaId, statusProcesso: 'Agendado para Entrega' },
        include: { unidade: { select: { nome: true } }, tecnico: { select: { nome: true } }, vinculacoes: { where: { ativa: true }, include: { usuario: { select: { nome: true } } }, take: 1 } },
        orderBy: { updatedAt: 'asc' },
      });
      rows = data.map(eq => [trunc(`${eq.marca || ''} ${eq.modelo || ''}`.trim(), 22), trunc(eq.serialNumber, 16), trunc(eq.unidade?.nome, 16), trunc(eq.vinculacoes[0]?.usuario?.nome, 22), trunc(eq.tecnico?.nome, 20)]);
    }

    // Gera PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${tipo}-${Date.now()}.pdf`);
    doc.pipe(res);

    const pageWidth = 515;
    const logoNTT = path.join(__dirname, '../../logo-ntt.png');
    const logoWick = path.join(__dirname, '../../logo-wickbold.png');

    // Cabeçalho
    if (fs.existsSync(logoNTT)) doc.image(logoNTT, 40, 28, { height: 32, fit: [110, 32] });
    if (fs.existsSync(logoWick)) doc.image(logoWick, 440, 28, { height: 32, fit: [110, 32] });
    doc.moveTo(40, 70).lineTo(555, 70).strokeColor('#e2e8f0').lineWidth(1).stroke();

    doc.y = 82;
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1e293b').text(titulo, { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b')
      .text(`${empresa?.nome || 'Empresa'} · Gerado em ${new Date().toLocaleString('pt-BR')} · Total: ${rows.length} registros`, { align: 'center' });
    doc.moveDown(0.8);

    // Linha separadora
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Cabeçalho da tabela
    const tableTop = doc.y;
    doc.rect(40, tableTop, pageWidth, 16).fill('#1e40af');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
    let xPos = 40;
    headers.forEach((h, i) => {
      doc.text(h.toUpperCase(), xPos + 4, tableTop + 4, { width: colWidths[i] - 4, lineBreak: false });
      xPos += colWidths[i];
    });
    doc.y = tableTop + 18;

    // Linhas da tabela
    doc.fontSize(7.5).font('Helvetica');
    rows.forEach((row, idx) => {
      if (doc.y > 770) {
        doc.addPage();
        // Repete cabeçalho na nova página
        const newTop = doc.y;
        doc.rect(40, newTop, pageWidth, 16).fill('#1e40af');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
        let x2 = 40;
        headers.forEach((h, i) => { doc.text(h.toUpperCase(), x2 + 4, newTop + 4, { width: colWidths[i] - 4, lineBreak: false }); x2 += colWidths[i]; });
        doc.y = newTop + 18;
        doc.fontSize(7.5).font('Helvetica');
      }
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(40, rowY, pageWidth, 14).fill('#f8fafc');
      doc.fillColor('#334155');
      let x = 40;
      row.forEach((cell, i) => {
        doc.text(String(cell), x + 4, rowY + 3, { width: colWidths[i] - 6, lineBreak: false });
        x += colWidths[i];
      });
      // Linha divisória leve
      doc.moveTo(40, rowY + 14).lineTo(555, rowY + 14).strokeColor('#f1f5f9').lineWidth(0.3).stroke();
      doc.y = rowY + 15;
    });

    if (rows.length === 0) {
      doc.moveDown(1);
      doc.fontSize(9).fillColor('#94a3b8').text('Nenhum registro encontrado.', { align: 'center' });
    }

    // Rodapé
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7.5).fillColor('#94a3b8').font('Helvetica')
      .text('NTT Device Control · Wickbold · Documento gerado automaticamente', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
};

const exportarExcel = async (req, res) => {
  try {
    const { tipo = 'geral' } = req.query;
    const empresaId = req.usuario.empresaId;
    const workbook = new ExcelJS.Workbook();
    const headerStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };

    const addHeader = (sheet) => {
      sheet.getRow(1).fill = headerStyle;
      sheet.getRow(1).font = headerFont;
    };

    if (tipo === 'colaboradores') {
      const usuarios = await prisma.usuario.findMany({
        where: { empresaId, ativo: true },
        include: { unidade: { select: { nome: true } }, vinculacoes: { where: { ativa: true }, include: { equipamento: { select: { tipo: true, marca: true, modelo: true, serialNumber: true } } } } },
        orderBy: { nome: 'asc' },
      });
      const sheet = workbook.addWorksheet('Colaboradores');
      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 30 }, { header: 'Função', key: 'funcao', width: 20 },
        { header: 'Email', key: 'email', width: 30 }, { header: 'Unidade', key: 'unidade', width: 20 },
        { header: 'Equipamento', key: 'equipamento', width: 25 }, { header: 'Serial', key: 'serial', width: 20 },
      ];
      addHeader(sheet);
      usuarios.forEach(u => {
        if (u.vinculacoes.length === 0) {
          sheet.addRow({ nome: u.nome, funcao: u.funcao || '', email: u.email || '', unidade: u.unidade?.nome || '', equipamento: '', serial: '' });
        } else {
          u.vinculacoes.forEach(v => {
            sheet.addRow({ nome: u.nome, funcao: u.funcao || '', email: u.email || '', unidade: u.unidade?.nome || '', equipamento: [v.equipamento.marca, v.equipamento.modelo].filter(Boolean).join(' '), serial: v.equipamento.serialNumber || '' });
          });
        }
      });
    } else if (tipo === 'vinculacoes') {
      const vinculacoes = await prisma.vinculacao.findMany({
        where: { ativa: true, usuario: { empresaId } },
        include: { usuario: { select: { nome: true, funcao: true, email: true, unidade: { select: { nome: true } } } }, equipamento: { select: { tipo: true, marca: true, modelo: true, serialNumber: true, unidade: { select: { nome: true } } } } },
        orderBy: { dataInicio: 'desc' },
      });
      const sheet = workbook.addWorksheet('Vinculações Ativas');
      sheet.columns = [
        { header: 'Colaborador', key: 'colaborador', width: 30 }, { header: 'Função', key: 'funcao', width: 20 },
        { header: 'Unidade', key: 'unidade', width: 20 }, { header: 'Equipamento', key: 'equipamento', width: 25 },
        { header: 'Serial', key: 'serial', width: 20 }, { header: 'Data Início', key: 'dataInicio', width: 15 },
      ];
      addHeader(sheet);
      vinculacoes.forEach(v => sheet.addRow({ colaborador: v.usuario.nome, funcao: v.usuario.funcao || '', unidade: v.usuario.unidade?.nome || '', equipamento: [v.equipamento.marca, v.equipamento.modelo].filter(Boolean).join(' '), serial: v.equipamento.serialNumber || '', dataInicio: new Date(v.dataInicio).toLocaleDateString('pt-BR') }));
    } else if (tipo === 'porUnidade') {
      const unidades = await prisma.unidade.findMany({
        where: { empresaId },
        include: { equipamentos: { select: { id: true, tipo: true, marca: true, modelo: true, serialNumber: true, status: true } } },
        orderBy: { nome: 'asc' },
      });
      const sheet = workbook.addWorksheet('Por Unidade');
      sheet.columns = [
        { header: 'Unidade', key: 'unidade', width: 25 }, { header: 'Equipamento', key: 'equipamento', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 15 }, { header: 'Serial', key: 'serial', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
      ];
      addHeader(sheet);
      unidades.forEach(u => u.equipamentos.forEach(eq => sheet.addRow({ unidade: u.nome, equipamento: [eq.marca, eq.modelo].filter(Boolean).join(' '), tipo: eq.tipo || '', serial: eq.serialNumber || '', status: eq.status })));
    } else if (tipo === 'colabSemEquip') {
      const usuarios = await prisma.usuario.findMany({ where: { empresaId, ativo: true, vinculacoes: { none: { ativa: true } } }, include: { unidade: { select: { nome: true } } }, orderBy: { nome: 'asc' } });
      const sheet = workbook.addWorksheet('Colab. sem Equipamento');
      sheet.columns = [{ header: 'Nome', key: 'nome', width: 30 }, { header: 'Função', key: 'funcao', width: 20 }, { header: 'Email', key: 'email', width: 30 }, { header: 'Unidade', key: 'unidade', width: 20 }];
      addHeader(sheet);
      usuarios.forEach(u => sheet.addRow({ nome: u.nome, funcao: u.funcao || '', email: u.email || '', unidade: u.unidade?.nome || '' }));
    } else if (tipo === 'equipSemColab') {
      const equipamentos = await prisma.equipamento.findMany({ where: { empresaId, vinculacoes: { none: { ativa: true } } }, include: { unidade: { select: { nome: true } } }, orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }] });
      const sheet = workbook.addWorksheet('Equip. sem Colaborador');
      sheet.columns = [{ header: 'Equipamento', key: 'equipamento', width: 25 }, { header: 'Tipo', key: 'tipo', width: 15 }, { header: 'Serial', key: 'serial', width: 20 }, { header: 'Status', key: 'status', width: 15 }, { header: 'Unidade', key: 'unidade', width: 20 }];
      addHeader(sheet);
      equipamentos.forEach(eq => sheet.addRow({ equipamento: [eq.marca, eq.modelo].filter(Boolean).join(' '), tipo: eq.tipo || '', serial: eq.serialNumber || '', status: eq.status, unidade: eq.unidade?.nome || '' }));
    } else {
      // geral ou disponiveis
      const equipamentos = await prisma.equipamento.findMany({
        where: { empresaId, ...(tipo === 'disponiveis' && { status: 'DISPONIVEL' }) },
        include: { unidade: true, vinculacoes: { where: { ativa: true }, include: { usuario: { select: { nome: true, funcao: true } } } } },
        orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }],
      });
      const sheet = workbook.addWorksheet('Equipamentos');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 }, { header: 'Tipo', key: 'tipo', width: 15 },
        { header: 'Marca', key: 'marca', width: 15 }, { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Serial', key: 'serial', width: 20 }, { header: 'Patrimônio', key: 'patrimonio', width: 15 },
        { header: 'Status', key: 'status', width: 15 }, { header: 'Unidade', key: 'unidade', width: 20 },
        { header: 'Colaborador Atual', key: 'usuario', width: 25 }, { header: 'Função', key: 'funcao', width: 20 },
        { header: 'Cadastrado em', key: 'createdAt', width: 18 },
      ];
      addHeader(sheet);
      equipamentos.forEach(eq => sheet.addRow({ id: eq.id, tipo: eq.tipo || '', marca: eq.marca || '', modelo: eq.modelo || '', serial: eq.serialNumber || '', patrimonio: eq.patrimonio || '', status: eq.status, unidade: eq.unidade?.nome || '', usuario: eq.vinculacoes[0]?.usuario?.nome || '', funcao: eq.vinculacoes[0]?.usuario?.funcao || '', createdAt: new Date(eq.createdAt).toLocaleDateString('pt-BR') }));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${tipo}-${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar Excel' });
  }
};

const getRelatorioPreparacao = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const equipamentos = await prisma.equipamento.findMany({
      where: { empresaId },
      select: {
        id: true, marca: true, modelo: true, tipo: true, serialNumber: true,
        statusProcesso: true, tecnico: { select: { nome: true } },
        createdAt: true, updatedAt: true,
        unidade: { select: { nome: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const ORDEM = ['Novo', 'Imagem Instalada', 'Softwares Instalados', 'Asset Registrado', 'Agendado para Entrega', 'Entregue ao Usuário'];
    const resultado = equipamentos.map(eq => {
      const idxEtapa = ORDEM.indexOf(eq.statusProcesso);
      const diasNaEtapa = Math.floor((new Date() - new Date(eq.updatedAt)) / (1000 * 60 * 60 * 24));
      return {
        ...eq,
        progresso: idxEtapa >= 0 ? Math.round((idxEtapa / (ORDEM.length - 1)) * 100) : 0,
        diasNaEtapa,
        atrasado: diasNaEtapa > 3 && idxEtapa >= 0 && idxEtapa < ORDEM.length - 1,
      };
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar relatório de preparação' });
  }
};

const getAgendamentosSemana = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0=dom
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        empresaId,
        statusProcesso: 'Agendado para Entrega',
      },
      include: {
        unidade: { select: { nome: true } },
        tecnico: { select: { nome: true } },
        vinculacoes: {
          where: { ativa: true },
          include: { usuario: { select: { nome: true, funcao: true } } },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    res.json({
      semana: {
        inicio: inicioSemana.toISOString(),
        fim: fimSemana.toISOString(),
      },
      total: equipamentos.length,
      equipamentos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos da semana' });
  }
};

const getTodosColaboradores = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const usuarios = await prisma.usuario.findMany({
      where: { empresaId, ativo: true },
      include: {
        unidade: { select: { nome: true } },
        vinculacoes: {
          where: { ativa: true },
          include: { equipamento: { select: { tipo: true, marca: true, modelo: true, serialNumber: true } } },
        },
      },
      orderBy: { nome: 'asc' },
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar colaboradores' });
  }
};

const getVinculacoesAtivas = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const vinculacoes = await prisma.vinculacao.findMany({
      where: { ativa: true, usuario: { empresaId } },
      include: {
        usuario: { select: { nome: true, funcao: true, email: true, unidade: { select: { nome: true } } } },
        equipamento: { select: { tipo: true, marca: true, modelo: true, serialNumber: true, unidade: { select: { nome: true } } } },
      },
      orderBy: { dataInicio: 'desc' },
    });
    res.json(vinculacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vinculações' });
  }
};

const getEquipamentosPorUnidadeResumo = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const unidades = await prisma.unidade.findMany({
      where: { empresaId },
      include: {
        equipamentos: {
          select: { id: true, status: true, tipo: true, marca: true, modelo: true, serialNumber: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
    const resultado = unidades.map(u => ({
      id: u.id,
      nome: u.nome,
      cidade: u.cidade,
      total: u.equipamentos.length,
      disponiveis: u.equipamentos.filter(e => e.status === 'DISPONIVEL').length,
      emUso: u.equipamentos.filter(e => e.status === 'EM_USO').length,
      manutencao: u.equipamentos.filter(e => e.status === 'MANUTENCAO').length,
      equipamentos: u.equipamentos,
    }));
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar equipamentos por unidade' });
  }
};

const getColaboradoresSemEquipamento = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const usuarios = await prisma.usuario.findMany({
      where: {
        empresaId,
        ativo: true,
        vinculacoes: { none: { ativa: true } },
      },
      include: { unidade: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar colaboradores sem equipamento' });
  }
};

const getEquipamentosSemColaborador = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        empresaId,
        vinculacoes: { none: { ativa: true } },
      },
      include: { unidade: { select: { nome: true } } },
      orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }],
    });
    res.json(equipamentos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar equipamentos sem colaborador' });
  }
};

// exportarImprodutivos definido abaixo


const getImprodutivos = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;

    // Atribuições com não comparecimento ou reagendamentos
    const atribuicoes = await prisma.vinculacao.findMany({
      where: {
        usuario: { empresaId },
        OR: [
          { statusEntrega: 'NAO_COMPARECEU' },
          { reagendamentos: { not: null } },
        ],
      },
      include: {
        usuario: { select: { nome: true, funcao: true, email: true, unidade: { select: { nome: true } } } },
        equipamento: { select: { marca: true, modelo: true, serialNumber: true } },
        tecnico: { select: { nome: true } },
      },
      orderBy: { dataAgendamento: 'asc' },
    });

    const resultado = atribuicoes.map(v => {
      const reagendamentos = v.reagendamentos ? JSON.parse(v.reagendamentos) : [];
      return {
        id: v.id,
        colaborador: v.usuario?.nome,
        funcao: v.usuario?.funcao,
        email: v.usuario?.email,
        unidade: v.usuario?.unidade?.nome,
        equipamento: [v.equipamento?.marca, v.equipamento?.modelo].filter(Boolean).join(' '),
        serial: v.equipamento?.serialNumber,
        tecnico: v.tecnico?.nome,
        dataAgendamento: v.dataAgendamento,
        statusEntrega: v.statusEntrega,
        totalReagendamentos: reagendamentos.length,
        reagendamentos,
        ativa: v.ativa,
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório de improdutivos' });
  }
};

// Exportar PDF de improdutivos
const exportarImprodutivos = async (req, res) => {
  try {
    const { formato = 'pdf' } = req.query;
    const empresaId = req.usuario.empresaId;
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });

    const atribuicoes = await prisma.vinculacao.findMany({
      where: {
        usuario: { empresaId },
        OR: [
          { statusEntrega: 'NAO_COMPARECEU' },
          { reagendamentos: { not: null } },
        ],
      },
      include: {
        usuario: { select: { nome: true, funcao: true, unidade: { select: { nome: true } } } },
        equipamento: { select: { marca: true, modelo: true, serialNumber: true } },
        tecnico: { select: { nome: true } },
      },
      orderBy: { dataAgendamento: 'asc' },
    });

    if (formato === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Improdutivos');
      sheet.columns = [
        { header: 'Colaborador', key: 'colaborador', width: 28 },
        { header: 'Unidade', key: 'unidade', width: 20 },
        { header: 'Equipamento', key: 'equipamento', width: 25 },
        { header: 'Serial', key: 'serial', width: 18 },
        { header: 'Técnico', key: 'tecnico', width: 20 },
        { header: 'Agendado para', key: 'agendamento', width: 18 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Reagendamentos', key: 'reagendamentos', width: 15 },
      ];
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      atribuicoes.forEach(v => {
        const reagendamentos = v.reagendamentos ? JSON.parse(v.reagendamentos) : [];
        const statusLabel = v.statusEntrega === 'NAO_COMPARECEU' ? 'Não compareceu' : v.statusEntrega === 'ENTREGUE' ? 'Entregue' : 'Pendente';
        sheet.addRow({
          colaborador: v.usuario?.nome || '',
          unidade: v.usuario?.unidade?.nome || '',
          equipamento: [v.equipamento?.marca, v.equipamento?.modelo].filter(Boolean).join(' '),
          serial: v.equipamento?.serialNumber || '',
          tecnico: v.tecnico?.nome || '',
          agendamento: v.dataAgendamento ? new Date(v.dataAgendamento).toLocaleDateString('pt-BR') : '—',
          status: statusLabel,
          reagendamentos: reagendamentos.length,
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=improdutivos-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // PDF
    const trunc = (s, n = 28) => String(s || '-').substring(0, n);
    const headers = ['Colaborador', 'Unidade', 'Equipamento', 'Técnico', 'Agendado', 'Status', 'Reagend.'];
    const colWidths = [110, 80, 100, 80, 70, 90, 50];
    const rows = atribuicoes.map(v => {
      const reagendamentos = v.reagendamentos ? JSON.parse(v.reagendamentos) : [];
      const statusLabel = v.statusEntrega === 'NAO_COMPARECEU' ? 'Não compareceu' : v.statusEntrega === 'ENTREGUE' ? 'Entregue' : 'Pendente';
      return [
        trunc(v.usuario?.nome, 20),
        trunc(v.usuario?.unidade?.nome, 16),
        trunc([v.equipamento?.marca, v.equipamento?.modelo].filter(Boolean).join(' '), 18),
        trunc(v.tecnico?.nome, 16),
        v.dataAgendamento ? new Date(v.dataAgendamento).toLocaleDateString('pt-BR') : '—',
        statusLabel,
        String(reagendamentos.length),
      ];
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=improdutivos-${Date.now()}.pdf`);
    doc.pipe(res);

    const pageWidth = 515;
    const logoNTT = path.join(__dirname, '../../logo-ntt.png');
    const logoWick = path.join(__dirname, '../../logo-wickbold.png');

    if (fs.existsSync(logoNTT)) doc.image(logoNTT, 40, 28, { height: 32, fit: [110, 32] });
    if (fs.existsSync(logoWick)) doc.image(logoWick, 440, 28, { height: 32, fit: [110, 32] });
    doc.moveTo(40, 70).lineTo(555, 70).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.y = 82;
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1e293b').text('Relatório de Improdutivos — Tech Refresh', { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b')
      .text(`${empresa?.nome || ''} · Gerado em ${new Date().toLocaleString('pt-BR')} · Total: ${rows.length} registros`, { align: 'center' });
    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.rect(40, tableTop, pageWidth, 16).fill('#1e40af');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
    let xPos = 40;
    headers.forEach((h, i) => {
      doc.text(h.toUpperCase(), xPos + 4, tableTop + 4, { width: colWidths[i] - 4, lineBreak: false });
      xPos += colWidths[i];
    });
    doc.y = tableTop + 18;

    doc.fontSize(7.5).font('Helvetica');
    rows.forEach((row, idx) => {
      if (doc.y > 770) { doc.addPage(); }
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(40, rowY, pageWidth, 14).fill('#f8fafc');
      doc.fillColor('#334155');
      let x = 40;
      row.forEach((cell, i) => {
        doc.text(String(cell), x + 4, rowY + 3, { width: colWidths[i] - 6, lineBreak: false });
        x += colWidths[i];
      });
      doc.moveTo(40, rowY + 14).lineTo(555, rowY + 14).strokeColor('#f1f5f9').lineWidth(0.3).stroke();
      doc.y = rowY + 15;
    });

    if (rows.length === 0) {
      doc.moveDown(1);
      doc.fontSize(9).fillColor('#94a3b8').text('Nenhum registro encontrado.', { align: 'center' });
    }

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7.5).fillColor('#94a3b8').font('Helvetica')
      .text('NTT Device Control · Tech Refresh · Documento gerado automaticamente', { align: 'center' });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar relatório de improdutivos' });
  }
};

const getSLA = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const projetoId = req.headers['x-projeto-id'] ? parseInt(req.headers['x-projeto-id']) : null;

    const vinculacoes = await prisma.vinculacao.findMany({
      where: {
        statusEntrega: 'ENTREGUE',
        usuario: { empresaId },
        ...(projetoId && { equipamento: { projetoId } }),
      },
      select: {
        createdAt: true,
        dataFim: true,
        dataAgendamento: true,
        updatedAt: true,
        equipamento: {
          select: {
            createdAt: true,
            updatedAt: true,
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
        tecnico: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const calcDias = (a, b) => {
      if (!a || !b) return null;
      const diff = Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    };

    const registros = vinculacoes.map(v => {
      // Data de entrega real: dataFim ou updatedAt da vinculação
      const dataEntregaReal = v.dataFim || v.updatedAt;
      // Dias de preparação: criação do equipamento até criação da vinculação (atribuição)
      const diasPreparacao = calcDias(v.equipamento?.createdAt, v.createdAt);
      // Dias de entrega: criação da vinculação até entrega real
      const diasEntrega = calcDias(v.createdAt, dataEntregaReal);
      // Total: criação do equipamento até entrega real
      const diasTotal = calcDias(v.equipamento?.createdAt, dataEntregaReal);

      return {
        equipamento: `${v.equipamento?.marca || ''} ${v.equipamento?.modelo || ''}`.trim() || '—',
        tipo: v.equipamento?.tipo || '—',
        tecnico: v.tecnico?.nome || '—',
        diasPreparacao,
        diasEntrega,
        diasTotal,
        dataEntrega: dataEntregaReal,
      };
    });

    const validos = registros.filter(r => r.diasTotal !== null && r.diasTotal >= 0);
    const media = validos.length
      ? Math.round(validos.reduce((s, r) => s + r.diasTotal, 0) / validos.length)
      : 0;
    const mediaPrep = validos.filter(r => r.diasPreparacao !== null).length
      ? Math.round(validos.filter(r => r.diasPreparacao !== null).reduce((s, r) => s + r.diasPreparacao, 0) / validos.filter(r => r.diasPreparacao !== null).length)
      : 0;

    res.json({ registros, media, mediaPrep, total: validos.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar SLA' });
  }
};

const gerarEtiquetas = async (req, res) => {
  try {
    const empresaId = req.usuario.empresaId;
    const { ids } = req.query; // ids separados por vírgula, ou todos se omitido
    const projetoId = req.headers['x-projeto-id'] ? parseInt(req.headers['x-projeto-id']) : null;

    const where = {
      empresaId,
      status: { not: 'DESCARTADO' },
      qrCode: { not: null },
      ...(projetoId && { projetoId }),
      ...(ids && { id: { in: ids.split(',').map(Number) } }),
    };

    const equipamentos = await prisma.equipamento.findMany({
      where,
      select: { id: true, marca: true, modelo: true, serialNumber: true, patrimonio: true, tipo: true, qrCode: true, unidade: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (!equipamentos.length) return res.status(404).json({ error: 'Nenhum equipamento com QR Code encontrado' });

    const doc = new PDFDocument({ margin: 20, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-${Date.now()}.pdf`);
    doc.pipe(res);

    // Grade: 3 colunas x 6 linhas = 18 etiquetas por página
    const cols = 3, rows = 6;
    const pageW = 555, pageH = 802;
    const cellW = pageW / cols;
    const cellH = pageH / rows;
    const pad = 8;

    for (let i = 0; i < equipamentos.length; i++) {
      const eq = equipamentos[i];
      const col = i % cols;
      const row = Math.floor(i / cols) % rows;

      if (i > 0 && col === 0 && row === 0) doc.addPage();

      const x = 20 + col * cellW;
      const y = 20 + row * cellH;

      // Borda da etiqueta
      doc.rect(x + pad, y + pad, cellW - pad * 2, cellH - pad * 2)
        .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // QR Code
      if (eq.qrCode) {
        try {
          const base64 = eq.qrCode.replace(/^data:image\/png;base64,/, '');
          const buf = Buffer.from(base64, 'base64');
          const qrSize = cellH - pad * 4 - 30;
          doc.image(buf, x + pad + 6, y + pad + 6, { width: qrSize, height: qrSize });

          // Texto ao lado do QR
          const textX = x + pad + 6 + qrSize + 6;
          const textW = cellW - pad * 2 - qrSize - 18;
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e293b')
            .text(`${eq.marca || ''} ${eq.modelo || ''}`.trim() || '—', textX, y + pad + 10, { width: textW, lineBreak: true });
          doc.fontSize(6).font('Helvetica').fillColor('#64748b');
          if (eq.tipo) doc.text(eq.tipo, textX, doc.y + 2, { width: textW });
          if (eq.serialNumber) doc.text(`S/N: ${eq.serialNumber}`, textX, doc.y + 2, { width: textW });
          if (eq.patrimonio) doc.text(`Pat: ${eq.patrimonio}`, textX, doc.y + 2, { width: textW });
          if (eq.unidade?.nome) doc.text(eq.unidade.nome, textX, doc.y + 2, { width: textW });
        } catch {}
      }
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar etiquetas' });
  }
};

module.exports = {
  getEquipamentosPorUnidade,
  getEquipamentosDisponiveis,
  exportarPDF,
  exportarExcel,
  getRelatorioPreparacao,
  getAgendamentosSemana,
  getTodosColaboradores,
  getVinculacoesAtivas,
  getEquipamentosPorUnidadeResumo,
  getColaboradoresSemEquipamento,
  getEquipamentosSemColaborador,
  getImprodutivos,
  exportarImprodutivos,
  gerarEtiquetas,
  getSLA,
};
