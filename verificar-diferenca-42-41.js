const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function verificar() {
  try {
    console.log('🔍 Verificando diferença entre 42 e 41...\n');

    // Encontrar projeto
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'CELULAR', mode: 'insensitive' } }
    });

    if (!projeto) {
      console.log('❌ Projeto não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 1. Contar equipamentos com status = DISPONIVEL (como o frontend mostra)
    const comStatusDisponivel = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL'
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Equipamentos com status = DISPONIVEL: ${comStatusDisponivel.length}\n`);

    // 2. Contar equipamentos com status = DISPONIVEL E statusProcesso != Agendado (como o dashboard calcula)
    const comStatusDisponivelSemAgendado = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      },
      select: {
        serialNumber: true,
        status: true,
        statusProcesso: true,
        unidade: { select: { nome: true } }
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 Equipamentos com status = DISPONIVEL E statusProcesso != Agendado: ${comStatusDisponivelSemAgendado.length}\n`);

    // 3. Encontrar qual está faltando
    const serialsComDisponivel = comStatusDisponivel.map(e => e.serialNumber);
    const serialsSemAgendado = comStatusDisponivelSemAgendado.map(e => e.serialNumber);

    const diferenca = serialsComDisponivel.filter(s => !serialsSemAgendado.includes(s));

    if (diferenca.length > 0) {
      console.log(`⚠️  EQUIPAMENTO(S) QUE ESTÁ(ÃO) FALTANDO (${diferenca.length}):\n`);
      diferenca.forEach(serial => {
        const eq = comStatusDisponivel.find(e => e.serialNumber === serial);
        console.log(`Serial: ${serial}`);
        console.log(`Status: ${eq.status}`);
        console.log(`Status Processo: ${eq.statusProcesso}`);
        console.log(`Unidade: ${eq.unidade?.nome || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhuma diferença encontrada');
    }

    // 4. Listar todos os com status DISPONIVEL
    console.log('\n📋 TODOS OS EQUIPAMENTOS COM STATUS = DISPONIVEL:\n');
    comStatusDisponivel.forEach((eq, index) => {
      const marcado = serialsSemAgendado.includes(eq.serialNumber) ? '✅' : '❌';
      console.log(`${marcado} ${index + 1}. ${eq.serialNumber} - ${eq.statusProcesso} (${eq.unidade?.nome})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
