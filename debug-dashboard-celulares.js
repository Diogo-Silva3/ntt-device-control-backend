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
    console.log('🔍 Debugando cálculos do dashboard para celulares...\n');

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

    // 1. Total de equipamentos
    const total = await prisma.equipamento.count({
      where: { ...whereEq, status: { not: 'DESCARTADO' } }
    });

    // 2. Em preparação
    const emPreparacao = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados', 'Asset Registrado'] }
      }
    });

    // 3. Agendados (como o dashboard calcula)
    const agendados = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega'
      }
    });

    // 4. Entregues
    const entregues = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });

    // 5. Disponível (como o dashboard calcula)
    const disponivel = await prisma.equipamento.count({
      where: {
        ...whereEq,
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      }
    });

    // 6. Faltam entregar (vinculações PENDENTES)
    const faltamEntregar = await prisma.vinculacao.count({
      where: {
        equipamento: { projetoId: projeto.id },
        statusEntrega: 'PENDENTE',
        ativa: true
      }
    });

    console.log('📊 CÁLCULOS DO DASHBOARD:\n');
    console.log(`Total: ${total}`);
    console.log(`Em Preparação: ${emPreparacao}`);
    console.log(`Agendados (statusProcesso='Agendado para Entrega'): ${agendados}`);
    console.log(`Entregues: ${entregues}`);
    console.log(`Disponível (status='DISPONIVEL' E statusProcesso!='Agendado para Entrega'): ${disponivel}`);
    console.log(`Faltam Entregar (vinculações PENDENTES): ${faltamEntregar}\n`);

    // 7. Verificar equipamentos por status
    const porStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: whereEq,
      _count: { status: true }
    });

    console.log('📊 DISTRIBUIÇÃO POR STATUS:\n');
    porStatus.forEach(item => {
      console.log(`${item.status}: ${item._count.status}`);
    });

    // 8. Verificar equipamentos por statusProcesso
    const porStatusProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: whereEq,
      _count: { statusProcesso: true }
    });

    console.log('\n📊 DISTRIBUIÇÃO POR STATUS PROCESSO:\n');
    porStatusProcesso.forEach(item => {
      console.log(`${item.statusProcesso}: ${item._count.statusProcesso}`);
    });

    // 9. Verificar vinculações
    const vinculacoesPendentes = await prisma.vinculacao.count({
      where: {
        equipamento: { projetoId: projeto.id },
        statusEntrega: 'PENDENTE',
        ativa: true
      }
    });

    const vinculacoesEntregues = await prisma.vinculacao.count({
      where: {
        equipamento: { projetoId: projeto.id },
        statusEntrega: 'ENTREGUE',
        ativa: true
      }
    });

    console.log('\n📊 VINCULAÇÕES:\n');
    console.log(`Pendentes (ativa=true): ${vinculacoesPendentes}`);
    console.log(`Entregues (ativa=true): ${vinculacoesEntregues}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debug();
