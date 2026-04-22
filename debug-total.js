const prisma = require('./src/config/prisma');

async function debug() {
  try {
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH LAPTOP 2026' } }
    });

    if (!projeto) {
      console.log('Projeto não encontrado');
      return;
    }

    console.log('Projeto:', projeto.nome, 'ID:', projeto.id);

    // Total de equipamentos
    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      }
    });

    // Contar por statusProcesso
    const statusProcessos = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      },
      _count: { statusProcesso: true }
    });

    console.log('\n=== TOTAL ===');
    console.log('Total do Projeto:', totalProjeto);

    console.log('\n=== STATUS PROCESSO ===');
    let soma = 0;
    statusProcessos.forEach(s => {
      console.log(`${s.statusProcesso}: ${s._count.statusProcesso}`);
      soma += s._count.statusProcesso;
    });
    console.log('Soma:', soma);

    // Verificar se tem equipamentos duplicados ou com problema
    const equipamentosComProblema = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' }
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        status: true
      },
      orderBy: { statusProcesso: 'asc' }
    });

    console.log('\n=== TOTAL DE EQUIPAMENTOS ===');
    console.log('Contagem:', equipamentosComProblema.length);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
