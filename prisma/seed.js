const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar empresa Wickbold
  const empresa = await prisma.empresa.upsert({
    where: { nome: 'Wickbold' },
    update: {},
    create: {
      nome: 'Wickbold',
      cnpj: '00.000.000/0001-00',
    },
  });
  console.log('✅ Empresa criada:', empresa.nome);

  // Criar unidade padrão
  const unidade = await prisma.unidade.upsert({
    where: { nome_empresaId: { nome: 'Matriz', empresaId: empresa.id } },
    update: {},
    create: {
      nome: 'Matriz',
      empresaId: empresa.id,
    },
  });
  console.log('✅ Unidade criada:', unidade.nome);

  // Criar usuário administrador
  const senhaHash = await bcrypt.hash('admin123', 10);

  // Verificar se já existe pelo email
  const adminExistente = await prisma.usuario.findFirst({ where: { email: 'diogo.silva@global.nttdata.com' } });
  let admin;
  if (adminExistente) {
    admin = await prisma.usuario.update({
      where: { id: adminExistente.id },
      data: { role: 'ADMIN', senha: senhaHash, ativo: true },
    });
  } else {
    admin = await prisma.usuario.create({
      data: {
        nome: 'Diogo Silva',
        email: 'diogo.silva@global.nttdata.com',
        funcao: 'Administrador de TI',
        role: 'ADMIN',
        senha: senhaHash,
        unidadeId: unidade.id,
        empresaId: empresa.id,
      },
    });
  }
  console.log('✅ Admin criado:', admin.email);
  console.log('');
  console.log('🎉 Seed concluído!');
  console.log('📧 Login: diogo.silva@global.nttdata.com');
  console.log('🔑 Senha: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
