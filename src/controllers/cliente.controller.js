const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const listar = async (req, res) => {
  try {
    const clientes = await prisma.empresa.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { usuarios: true, equipamentos: true } },
      },
    });
    res.json(clientes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, cnpj, adminNome, adminEmail, adminSenha } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    if (!adminEmail || !adminSenha) return res.status(400).json({ error: 'Email e senha do admin são obrigatórios' });

    const existe = await prisma.empresa.findFirst({ where: { nome: { equals: nome, mode: 'insensitive' } } });
    if (existe) return res.status(400).json({ error: 'Já existe um cliente com esse nome' });

    const emailExiste = await prisma.usuario.findFirst({ where: { email: adminEmail } });
    if (emailExiste) return res.status(400).json({ error: 'Email já cadastrado no sistema' });

    // Cria empresa + unidade padrão + admin em transação
    const empresa = await prisma.$transaction(async (tx) => {
      const emp = await tx.empresa.create({ data: { nome, cnpj: cnpj || null } });

      const unidade = await tx.unidade.create({
        data: { nome: 'Matriz', empresaId: emp.id },
      });

      const senhaHash = await bcrypt.hash(adminSenha, 10);
      await tx.usuario.create({
        data: {
          nome: adminNome || adminEmail,
          email: adminEmail,
          senha: senhaHash,
          role: 'ADMIN',
          empresaId: emp.id,
          unidadeId: unidade.id,
        },
      });

      return emp;
    });

    res.status(201).json(empresa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, cnpj, ativo } = req.body;
    const id = parseInt(req.params.id);
    const empresa = await prisma.empresa.update({
      where: { id },
      data: { nome, cnpj, ...(ativo !== undefined && { ativo }) },
    });
    res.json(empresa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

module.exports = { listar, criar, atualizar };
