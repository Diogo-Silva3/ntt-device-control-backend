const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function debug() {
  try {
    console.log('🔍 Debugando maquinasFaltamEntregar...\n');

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

    const whereEq = {
      projetoId: projeto.id
    };

    // 1. Contar TODOS com status DISPONIVEL
    const todosDisponiveis = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: 'DISPONIVEL'
      }
    });

    // 2. Contar com status DISPONIVEL E statusProcesso != Agendado
    const disponivelSemAgendado = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      }
    });

    // 3. Contar agendados
    const agendados = await prisma.equipamento.count({
      where: {
        ...whereEq,
        statusProcesso: 'Agendado para Entrega'
      }
    });

    // 4. Contar entregues
    const entregues = await prisma.equipamento.count({
      where: {
        ...whereEq,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    // 5. Total
    const total = await prisma.equipamento.count({
      where: { ...whereEq, status: { not: 'DESCARTADO' } }
    });

    console.log('📊 CÁLCULOS:\n');
    console.log(`Total: ${total}`);
    console.log(`Agendados: ${agendados}`);
    console.log(`Entregues: ${entregues}`);
    console.log(`Disponível (sem agendado): ${disponivelSemAgendado}`);
    console.log(`Todos com status DISPONIVEL: ${todosDisponiveis}\n`);

    console.log('📊 VERIFICAÇÃO:\n');
    console.log(`Agendados + Entregues + Disponível (sem agendado) = ${agendados} + ${entregues} + ${disponivelSemAgendado} = ${agendados + entregues + disponivelSemAgendado}`);
    console.log(`Total: ${total}`);
    console.log(`Diferença: ${total - (agendados + entregues + disponivelSemAgendado)}\n`);

    console.log('📊 PARA O DASHBOARD:\n');
    console.log(`Faltam Entregar deveria ser: ${todosDisponiveis} (TODOS com status DISPONIVEL)`);
    console.log(`Disponível deveria ser: ${disponivelSemAgendado} (status DISPONIVEL E statusProcesso != Agendado)`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debug();
