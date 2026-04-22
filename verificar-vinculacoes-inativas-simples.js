require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO VINCULAÇÕES INATIVAS DO PROJETO LAPTOP ===\n');

    // Buscar projeto LAPTOP
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: {
          contains: 'LAPTOP',
        },
      },
    });

    if (!projeto) {
      console.log('Projeto LAPTOP não encontrado');
      return;
    }

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar vinculações INATIVAS (que foram encerradas)
    const vinculacoesInativas = await prisma.vinculacao.findMany({
      where: {
        ativa: false,
        equipamento: {
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
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
      take: 50,
    });

    console.log(`Total de vinculações INATIVAS: ${vinculacoesInativas.length}\n`);

    if (vinculacoesInativas.length > 0) {
      console.log('Vinculações inativas encontradas:\n');
      vinculacoesInativas.forEach((v, i) => {
        console.log(`${i + 1}. ${v.equipamento?.serialNumber || 'N/A'} → ${v.usuario?.nome || 'N/A'}`);
        console.log(`   Status: ${v.statusEntrega}`);
        console.log(`   Data início: ${v.dataInicio}`);
        console.log(`   Data fim: ${v.dataFim || 'N/A'}`);
        console.log(`   ID: ${v.id}`);
        console.log('');
      });

      // Contar quantas eram ENTREGUE
      const inativasEntregues = vinculacoesInativas.filter(v => v.statusEntrega === 'ENTREGUE');
      console.log(`\nDessas, ${inativasEntregues.length} eram ENTREGUES antes de serem inativadas.`);
    }

    console.log('\n=== FIM DA VERIFICAÇÃO ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
