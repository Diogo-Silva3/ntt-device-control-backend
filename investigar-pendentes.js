require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigar() {
  try {
    console.log('=== INVESTIGANDO VINCULAÇÕES PENDENTES ===\n');

    // Buscar todas as vinculações PENDENTES
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
            projetoId: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total de vinculações PENDENTES: ${vinculacoesPendentes.length}\n`);

    if (vinculacoesPendentes.length === 0) {
      console.log('Nenhuma vinculação PENDENTE encontrada.');
      return;
    }

    console.log('Lista de vinculações PENDENTES:\n');
    vinculacoesPendentes.forEach((v, i) => {
      console.log(`${i + 1}. Equipamento: ${v.equipamento?.serialNumber || 'N/A'}`);
      console.log(`   Colaborador: ${v.usuario?.nome || 'N/A'}`);
      console.log(`   StatusProcesso: ${v.equipamento?.statusProcesso || 'N/A'}`);
      console.log(`   Data criação: ${v.createdAt}`);
      console.log(`   ID da vinculação: ${v.id}`);
      console.log('');
    });

    // Verificar se há vinculações duplicadas (mesmo equipamento com múltiplas vinculações PENDENTES)
    const equipamentosComMultiplasPendentes = {};
    vinculacoesPendentes.forEach(v => {
      const eqId = v.equipamentoId;
      if (!equipamentosComMultiplasPendentes[eqId]) {
        equipamentosComMultiplasPendentes[eqId] = [];
      }
      equipamentosComMultiplasPendentes[eqId].push(v);
    });

    const duplicadas = Object.entries(equipamentosComMultiplasPendentes).filter(([_, vins]) => vins.length > 1);

    if (duplicadas.length > 0) {
      console.log('\n⚠️  ATENÇÃO: Equipamentos com MÚLTIPLAS vinculações PENDENTES:\n');
      duplicadas.forEach(([eqId, vins]) => {
        console.log(`Equipamento: ${vins[0].equipamento?.serialNumber}`);
        console.log(`Quantidade de vinculações PENDENTES: ${vins.length}`);
        vins.forEach((v, i) => {
          console.log(`  ${i + 1}. Colaborador: ${v.usuario?.nome} (ID: ${v.id}, criada em: ${v.createdAt})`);
        });
        console.log('');
      });
    }

    console.log('\n=== FIM DA INVESTIGAÇÃO ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigar();
