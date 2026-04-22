require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO AUDITORIA DE VINCULAÇÕES ===\n');

    // Verificar se existe tabela de auditoria para vinculações
    const tabelas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%audit%' OR table_name LIKE '%log%' OR table_name LIKE '%history%'
    `;

    console.log('Tabelas de auditoria/log encontradas:');
    console.log(tabelas);
    console.log('');

    // Verificar vinculações inativas (que foram encerradas)
    const vinculacoesInativas = await prisma.vinculacao.findMany({
      where: {
        ativa: false,
        equipamento: {
          projeto: {
            nome: {
              contains: 'LAPTOP',
            },
          },
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
        updatedAt: 'desc',
      },
      take: 20,
    });

    console.log(`\nVinculações INATIVAS do projeto LAPTOP: ${vinculacoesInativas.length}\n`);

    if (vinculacoesInativas.length > 0) {
      console.log('Últimas vinculações inativas:');
      vinculacoesInativas.forEach((v, i) => {
        console.log(`${i + 1}. ${v.equipamento?.serialNumber || 'N/A'} → ${v.usuario?.nome || 'N/A'}`);
        console.log(`   Status: ${v.statusEntrega}`);
        console.log(`   Atualizada em: ${v.updatedAt}`);
        console.log(`   Data fim: ${v.dataFim || 'N/A'}`);
        console.log('');
      });
    }

    // Verificar se há vinculações que foram alteradas recentemente
    const vinculacoesRecentementeAlteradas = await prisma.vinculacao.findMany({
      where: {
        equipamento: {
          projeto: {
            nome: {
              contains: 'LAPTOP',
            },
          },
        },
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
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
        updatedAt: 'desc',
      },
    });

    console.log(`\nVinculações alteradas nas últimas 24h: ${vinculacoesRecentementeAlteradas.length}\n`);

    if (vinculacoesRecentementeAlteradas.length > 0) {
      vinculacoesRecentementeAlteradas.forEach((v, i) => {
        console.log(`${i + 1}. ${v.equipamento?.serialNumber || 'N/A'} → ${v.usuario?.nome || 'N/A'}`);
        console.log(`   Status: ${v.statusEntrega}`);
        console.log(`   Ativa: ${v.ativa}`);
        console.log(`   Atualizada em: ${v.updatedAt}`);
        console.log('');
      });
    }

    console.log('\n=== FIM DA VERIFICAÇÃO ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
