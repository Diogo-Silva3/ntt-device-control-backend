const prisma = require('./src/config/prisma');

const testar = async () => {
  try {
    console.log('Testando tamanho da resposta...\n');
    
    const empresaId = 1;
    const role = 'COLABORADOR';
    const limit = 10000;
    const skip = 0;
    
    const where = {
      empresaId,
      ativo: true,
      role,
    };
    
    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        include: { unidade: true },
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
    ]);
    
    const usuariosSemSenha = usuarios.map(({ senha, ...u }) => u);
    const resposta = { data: usuariosSemSenha, total, page: 1, limit };
    
    const json = JSON.stringify(resposta);
    const tamanhoKB = (json.length / 1024).toFixed(2);
    const tamanhoMB = (json.length / (1024 * 1024)).toFixed(2);
    
    console.log(`Tamanho da resposta:`);
    console.log(`  Bytes: ${json.length}`);
    console.log(`  KB: ${tamanhoKB}`);
    console.log(`  MB: ${tamanhoMB}`);
    console.log(`\nTotal de usuários: ${resposta.data.length}`);
    console.log(`Primeiro: ${resposta.data[0]?.nome}`);
    console.log(`Último: ${resposta.data[resposta.data.length - 1]?.nome}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

testar();
