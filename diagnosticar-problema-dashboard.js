require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  try {
    console.log('=== DIAGNÓSTICO DO DASHBOARD ===\n');

    // 1. Verificar vinculações ENTREGUES
    const vinculacoesEntregues = await prisma.vinculacao.findMany({
      where: {
        statusEntrega: 'ENTREGUE',
      },
      include: {
        equipamento: {
          select: {
            id: true,
            serialNumber: true,
            statusProcesso: true,
            status: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    });

    console.log(`Total de vinculações ENTREGUES: ${vinculacoesEntregues.length}\n`);

    // Agrupar por statusProcesso
    const porStatusProcesso = {};
    vinculacoesEntregues.forEach(v => {
      const sp = v.equipamento?.statusProcesso || 'SEM EQUIPAMENTO';
      if (!porStatusProcesso[sp]) porStatusProcesso[sp] = [];
      porStatusProcesso[sp].push(v);
    });

    console.log('Vinculações ENTREGUES agrupadas por statusProcesso do equipamento:');
    Object.keys(porStatusProcesso).forEach(sp => {
      console.log(`\n${sp}: ${porStatusProcesso[sp].length} vinculações`);
      porStatusProcesso[sp].slice(0, 5).forEach(v => {
        console.log(`  - ${v.equipamento?.serialNumber || 'N/A'} → ${v.usuario?.nome || 'N/A'}`);
      });
      if (porStatusProcesso[sp].length > 5) {
        console.log(`  ... e mais ${porStatusProcesso[sp].length - 5}`);
      }
    });

    // 2. Verificar equipamentos com statusProcesso "Entregue ao Usuário" ou "Em Uso"
    const equipamentosEntregues = await prisma.equipamento.findMany({
      where: {
        statusProcesso: {
          in: ['Entregue ao Usuário', 'Em Uso'],
        },
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
          },
        },
      },
    });

    console.log(`\n\nTotal de equipamentos com statusProcesso "Entregue ao Usuário" ou "Em Uso": ${equipamentosEntregues.length}\n`);

    // 3. Verificar inconsistências
    console.log('\n=== INCONSISTÊNCIAS ENCONTRADAS ===\n');

    // Vinculações ENTREGUES mas equipamento NÃO está como "Entregue ao Usuário" ou "Em Uso"
    const vinculacoesInconsistentes = vinculacoesEntregues.filter(v => 
      v.equipamento && 
      v.equipamento.statusProcesso !== 'Entregue ao Usuário' && 
      v.equipamento.statusProcesso !== 'Em Uso'
    );

    if (vinculacoesInconsistentes.length > 0) {
      console.log(`⚠️  ${vinculacoesInconsistentes.length} vinculações estão ENTREGUES mas o equipamento NÃO está como "Entregue ao Usuário" ou "Em Uso":\n`);
      vinculacoesInconsistentes.slice(0, 10).forEach(v => {
        console.log(`- ${v.equipamento.serialNumber} (statusProcesso: ${v.equipamento.statusProcesso}) → ${v.usuario.nome}`);
      });
      if (vinculacoesInconsistentes.length > 10) {
        console.log(`... e mais ${vinculacoesInconsistentes.length - 10}`);
      }
    } else {
      console.log('✓ Todas as vinculações ENTREGUES têm equipamentos com statusProcesso correto');
    }

    // 4. Verificar vinculações PENDENTES
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            statusProcesso: true,
          },
        },
      },
    });

    console.log(`\n\nTotal de vinculações PENDENTES: ${vinculacoesPendentes.length}`);

    const pendentesSemAgendado = vinculacoesPendentes.filter(v => 
      v.equipamento && v.equipamento.statusProcesso !== 'Agendado para Entrega'
    );

    if (pendentesSemAgendado.length > 0) {
      console.log(`\n⚠️  ${pendentesSemAgendado.length} vinculações PENDENTES mas equipamento NÃO está como "Agendado para Entrega":\n`);
      pendentesSemAgendado.slice(0, 10).forEach(v => {
        console.log(`- ${v.equipamento.serialNumber} (statusProcesso: ${v.equipamento.statusProcesso})`);
      });
      if (pendentesSemAgendado.length > 10) {
        console.log(`... e mais ${pendentesSemAgendado.length - 10}`);
      }
    }

    // 5. Resumo do que o dashboard deveria mostrar
    console.log('\n\n=== O QUE O DASHBOARD DEVERIA MOSTRAR ===\n');
    
    const equipamentosComVinculacaoEntregue = new Set(
      vinculacoesEntregues
        .filter(v => v.equipamento)
        .map(v => v.equipamento.id)
    );
    
    console.log(`ENTREGUES: ${equipamentosComVinculacaoEntregue.size} equipamentos únicos com vinculação ENTREGUE`);
    console.log(`AGENDADOS: ${vinculacoesPendentes.length} vinculações PENDENTES`);

    console.log('\n=== FIM DO DIAGNÓSTICO ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
