require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testar() {
  try {
    console.log('=== TESTANDO LÓGICA DO DASHBOARD ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const empresaId = 1; // Wickbold
    const projetoId = projeto.id;

    console.log(`Projeto: ${projeto.nome} (ID: ${projetoId})\n`);

    // Simular a mesma lógica do dashboard
    const whereEq = {
      empresaId,
      projetoId,
    };

    const [
      totalProjeto,
      maquinasAgendadas,
      maquinasEntregues,
      totalAtribuido,
      disponiveis,
    ] = await Promise.all([
      // totalProjeto
      prisma.equipamento.count({ 
        where: { ...whereEq, status: { not: 'DESCARTADO' } } 
      }),
      
      // maquinasAgendadas
      prisma.equipamento.count({
        where: { 
          ...whereEq,
          status: { not: 'DESCARTADO' }, 
          statusProcesso: 'Agendado para Entrega'
        },
      }),
      
      // maquinasEntregues
      prisma.equipamento.count({
        where: {
          ...whereEq,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        },
      }),
      
      // totalAtribuido (vinculações ENTREGUE)
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { 
            projetoId,
            empresaId,
          },
        },
      }),

      // disponiveis
      prisma.equipamento.count({ 
        where: { ...whereEq, status: 'DISPONIVEL' } 
      }),
    ]);

    // FALTAM ENTREGAR = equipamentos DISPONÍVEIS (prontos para entregar)
    const maquinasFaltamEntregar = disponiveis;

    console.log('📊 VALORES CALCULADOS (mesma lógica do dashboard):');
    console.log(`   totalProjeto: ${totalProjeto}`);
    console.log(`   maquinasAgendadas: ${maquinasAgendadas}`);
    console.log(`   maquinasEntregues: ${maquinasEntregues}`);
    console.log(`   totalAtribuido (vinculações): ${totalAtribuido}`);
    console.log(`   disponiveis: ${disponiveis}`);
    console.log(`   maquinasFaltamEntregar: ${maquinasFaltamEntregar}\n`);

    console.log('📋 VALORES QUE DEVERIAM APARECER NO DASHBOARD:');
    console.log(`   TOTAL DO PROJETO: ${totalProjeto} (esperado: 180)`);
    console.log(`   AGENDADAS: ${maquinasAgendadas} (esperado: 1)`);
    console.log(`   ENTREGUES: ${maquinasEntregues} (esperado: 34)`);
    console.log(`   ATRIBUÍDO: ${totalAtribuido} (esperado: 34)`);
    console.log(`   FALTAM ENTREGAR: ${maquinasFaltamEntregar} (esperado: 145)`);
    console.log(`   DISPONÍVEIS: ${disponiveis} (esperado: 145)\n`);

    // Verificar se há equipamentos EM_USO que não têm vinculação ENTREGUE
    const emUsoSemVinculacao = await prisma.equipamento.findMany({
      where: {
        projetoId,
        status: 'EM_USO',
        vinculacoes: {
          none: {
            ativa: true,
            statusEntrega: 'ENTREGUE',
          },
        },
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: true,
          },
        },
      },
    });

    if (emUsoSemVinculacao.length > 0) {
      console.log('⚠️  EQUIPAMENTOS EM_USO SEM VINCULAÇÃO ENTREGUE:');
      emUsoSemVinculacao.forEach(eq => {
        console.log(`\n   ${eq.serialNumber}:`);
        console.log(`   StatusProcesso: ${eq.statusProcesso}`);
        if (eq.vinculacoes.length > 0) {
          eq.vinculacoes.forEach(v => {
            console.log(`   Vinculação: ${v.usuario.nome} - Status: ${v.statusEntrega}`);
          });
        } else {
          console.log(`   Sem vinculações ativas`);
        }
      });
      console.log('\n');
    }

    // Verificar vinculações PENDENTE
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: { projetoId },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            status: true,
            statusProcesso: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (vinculacoesPendentes.length > 0) {
      console.log('📋 VINCULAÇÕES PENDENTE:');
      vinculacoesPendentes.forEach(v => {
        console.log(`\n   ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
        console.log(`   Status Equipamento: ${v.equipamento.status}`);
        console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
        console.log(`   Status Entrega: ${v.statusEntrega}`);
      });
      console.log('\n');
    }

    console.log('✅ TESTE CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testar();
