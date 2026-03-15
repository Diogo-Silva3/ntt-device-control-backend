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
    const equipamentos = await prisma.equipamento.findMany({
      where: { empresaId, ...(tipo === 'disponiveis' && { status: 'DISPONIVEL' }) },
      include: {
        unidade: true,
        vinculacoes: {
          where: { ativa: true },
          include: { usuario: { select: { nome: true } } },
        },
      },
      orderBy: [{ unidade: { nome: 'asc' } }, { marca: 'asc' }],
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${Date.now()}.pdf`);
    doc.pipe(res);

    const logoNTT = path.join(__dirname, '../../logo-ntt.png');
    const logoWick = path.join(__dirname, '../../logo-wickbold.png');
    const pageWidth = 515;
    const logoH = 36;

    if (fs.existsSync(logoNTT)) doc.image(logoNTT, 40, 30, { height: logoH, fit: [120, logoH] });
    if (fs.existsSync(logoWick)) doc.image(logoWick, 435, 30, { height: logoH, fit: [120, logoH] });

    doc.moveTo(40, 75).lineTo(555, 75).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(3);

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e293b').text('Relatório de Equipamentos', { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`${empresa?.nome || 'Empresa'} · Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('Resumo');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
      `Total: ${equipamentos.length}   ·   Em Uso: ${equipamentos.filter(e => e.status === 'EM_USO').length}   ·   Disponíveis: ${equipamentos.filter(e => e.status === 'DISPONIVEL').length}   ·   Manutenção: ${equipamentos.filter(e => e.status === 'MANUTENCAO').length}`
    );
    doc.moveDown(1);

    const colWidths = [130, 70, 110, 90, 75, 80];
    const headers = ['Marca / Modelo', 'Tipo', 'Serial', 'Unidade', 'Status', 'Colaborador'];

    doc.rect(40, doc.y, pageWidth, 18).fill('#1e40af');
    const headerY = doc.y + 4;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    headers.forEach((h, i) => {
      const x = 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x + 3, headerY, { width: colWidths[i] - 3 });
    });
    doc.moveDown(1.2);

    doc.fontSize(8).font('Helvetica');
    equipamentos.forEach((eq, idx) => {
      if (doc.y > 760) { doc.addPage(); doc.moveDown(1); }
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(40, rowY - 2, pageWidth, 16).fill('#f8fafc');
      const cols = [
        `${eq.marca || ''} ${eq.modelo || ''}`.trim() || '-',
        eq.tipo || '-',
        eq.serialNumber || '-',
        eq.unidade?.nome || '-',
        eq.status === 'DISPONIVEL' ? 'Disponível' : eq.status === 'EM_USO' ? 'Em Uso' : eq.status === 'MANUTENCAO' ? 'Manutenção' : eq.status,
        eq.vinculacoes[0]?.usuario?.nome || '-',
      ];
      doc.fillColor('#334155');
      cols.forEach((c, i) => {
        const x = 40 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(String(c).substring(0, 22), x + 3, rowY, { width: colWidths[i] - 3 });
      });
      doc.moveDown(0.55);
    });

    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('NTT Device Control · Wickbold', { align: 'center' });

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

module.exports = { getEquipamentosPorUnidade, getEquipamentosDisponiveis, exportarPDF, exportarExcel, getRelatorioPreparacao, getAgendamentosSemana, getTodosColaboradores, getVinculacoesAtivas, getEquipamentosPorUnidadeResumo, getColaboradoresSemEquipamento, getEquipamentosSemColaborador };

