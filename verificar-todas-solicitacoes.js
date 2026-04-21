const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Verificando TODAS as solicitações...\n');
    
    const solicitacoes = await prisma.solicitacaoAtivo.findMany({
      where: {
        status: { not: 'ENCERRADO' }
      },
      select: {
        id: true,
        numeroChamado: true,
        estado: true,
        status: true,
        projetoId: true,
        tecnicoId: true
      },
      take: 10
    });

    console.log(`✅ ${solicitacoes.length} solicitação(ões) encontrada(s):\n`);
    solicitacoes.forEach(s => {
      console.log(`  Chamado: ${s.numeroChamado}`);
      console.log(`  Estado: ${s.estado}`);
      console.log(`  ProjetoId: ${s.projetoId || 'NULL'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
