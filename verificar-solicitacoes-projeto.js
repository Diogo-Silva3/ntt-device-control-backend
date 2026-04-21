const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Verificando solicitações do projeto 1...\n');
    
    const solicitacoes = await prisma.solicitacaoAtivo.findMany({
      where: {
        projetoId: 1,
        status: { not: 'ENCERRADO' }
      },
      select: {
        id: true,
        numeroChamado: true,
        estado: true,
        status: true,
        projetoId: true,
        tecnicoId: true
      }
    });

    console.log(`✅ ${solicitacoes.length} solicitação(ões) encontrada(s):\n`);
    solicitacoes.forEach(s => {
      console.log(`  Chamado: ${s.numeroChamado}`);
      console.log(`  Estado: ${s.estado}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  ProjetoId: ${s.projetoId}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
