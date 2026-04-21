const prisma = require('./src/config/prisma');

(async () => {
  try {
    console.log('Verificando equipamentos agendados para projeto 1...\n');
    
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        projetoId: 1,
        statusProcesso: 'Agendado para Entrega'
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        unidadeId: true,
        projetoId: true
      }
    });

    console.log(`✅ ${equipamentos.length} equipamento(s) agendado(s) encontrado(s):\n`);
    equipamentos.forEach(eq => {
      console.log(`  Serial: ${eq.serialNumber}`);
      console.log(`  UnidadeId: ${eq.unidadeId}`);
      console.log(`  ProjetoId: ${eq.projetoId}`);
      console.log('');
    });

    // Verificar unidades
    console.log('\nVerificando unidades...');
    const unidades = await prisma.unidade.findMany({
      where: { id: { in: equipamentos.map(e => e.unidadeId).filter(Boolean) } },
      select: { id: true, nome: true }
    });
    
    console.log('\nUnidades dos equipamentos:');
    unidades.forEach(u => {
      console.log(`  ID ${u.id}: ${u.nome}`);
    });

    // Verificar unidade do PEDRO
    console.log('\n\nVerificando unidade do PEDRO (ID 161)...');
    const pedro = await prisma.usuario.findUnique({
      where: { id: 161 },
      select: { id: true, nome: true, unidadeId: true, projetoId: true }
    });
    
    if (pedro) {
      console.log(`  Nome: ${pedro.nome}`);
      console.log(`  UnidadeId: ${pedro.unidadeId}`);
      console.log(`  ProjetoId: ${pedro.projetoId}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
