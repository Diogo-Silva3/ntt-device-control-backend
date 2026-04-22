require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restaurar() {
  try {
    console.log('=== RESTAURANDO DADOS CORRETOS ===\n');

    // 1. Buscar todas as vinculações do projeto TECH REFRESH LAPTOP 2026
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: {
          contains: 'TECH REFRESH',
        },
      },
    });

    if (!projeto) {
      console.log('❌ Projeto não encontrado!');
      return;
    }

    console.log(`Projeto encontrado: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. Buscar todas as vinculações ENTREGUES (statusEntrega = 'ENTREGUE')
    const vinculacoesEntregues = await prisma.vinculacao.findMany({
      where: {
        statusEntrega: 'ENTREGUE',
        equipamento: {
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            id: true,
            serialNumber: true,
            statusProcesso: true,
          },
        },
      },
    });

    console.log(`Vinculações com statusEntrega = 'ENTREGUE': ${vinculacoesEntregues.length}`);

    // 3. Corrigir equipamentos que têm vinculação ENTREGUE mas statusProcesso errado
    const equipamentosParaCorrigirEntregues = vinculacoesEntregues.filter(v => 
      v.equipamento && 
      v.equipamento.statusProcesso !== 'Entregue ao Usuário' &&
      v.equipamento.statusProcesso !== 'Em Uso'
    );

    if (equipamentosParaCorrigirEntregues.length > 0) {
      console.log(`\nCorrigindo ${equipamentosParaCorrigirEntregues.length} equipamentos ENTREGUES:\n`);
      
      const idsEntregues = equipamentosParaCorrigirEntregues.map(v => v.equipamento.id);
      
      const resultadoEntregues = await prisma.equipamento.updateMany({
        where: {
          id: { in: idsEntregues },
        },
        data: {
          statusProcesso: 'Entregue ao Usuário',
          status: 'EM_USO',
        },
      });

      console.log(`✓ ${resultadoEntregues.count} equipamentos corrigidos para "Entregue ao Usuário"`);
    }

    // 4. Buscar vinculações PENDENTES (statusEntrega = 'PENDENTE')
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: {
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            id: true,
            serialNumber: true,
            statusProcesso: true,
          },
        },
      },
    });

    console.log(`\nVinculações com statusEntrega = 'PENDENTE': ${vinculacoesPendentes.length}`);

    // 5. Corrigir equipamentos que têm vinculação PENDENTE mas statusProcesso errado
    const equipamentosParaCorrigirPendentes = vinculacoesPendentes.filter(v => 
      v.equipamento && 
      v.equipamento.statusProcesso !== 'Agendado para Entrega'
    );

    if (equipamentosParaCorrigirPendentes.length > 0) {
      console.log(`\nCorrigindo ${equipamentosParaCorrigirPendentes.length} equipamentos PENDENTES:\n`);
      
      const idsPendentes = equipamentosParaCorrigirPendentes.map(v => v.equipamento.id);
      
      const resultadoPendentes = await prisma.equipamento.updateMany({
        where: {
          id: { in: idsPendentes },
        },
        data: {
          statusProcesso: 'Agendado para Entrega',
          status: 'DISPONIVEL',
        },
      });

      console.log(`✓ ${resultadoPendentes.count} equipamentos corrigidos para "Agendado para Entrega"`);
    }

    // 6. Verificar resultado final
    console.log('\n=== VERIFICAÇÃO FINAL ===\n');

    const totalEntregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        statusProcesso: {
          in: ['Entregue ao Usuário', 'Em Uso'],
        },
      },
    });

    const totalAgendados = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log(`ENTREGUES: ${totalEntregues}`);
    console.log(`AGENDADOS: ${totalAgendados}`);

    console.log('\n✓ Restauração concluída!');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restaurar();
