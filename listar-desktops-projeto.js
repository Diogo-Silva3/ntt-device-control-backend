const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listar() {
  try {
    // Buscar o projeto
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: 'TECH REFRESH DESKTOP 2026'
      }
    });

    if (!projeto) {
      console.log('❌ Projeto "TECH REFRESH DESKTOP 2026" não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📋 Projeto: ${projeto.nome}`);
    console.log(`ID: ${projeto.id}\n`);

    // Buscar equipamentos do projeto
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id
      },
      select: {
        id: true,
        serialNumber: true,
        marca: true,
        modelo: true,
        tipo: true,
        status: true,
        statusProcesso: true,
        unidade: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        serialNumber: 'asc'
      }
    });

    console.log(`✅ Total de equipamentos: ${equipamentos.length}\n`);

    if (equipamentos.length > 0) {
      console.table(equipamentos);

      // Resumo por status
      const porStatus = {};
      equipamentos.forEach(e => {
        porStatus[e.status] = (porStatus[e.status] || 0) + 1;
      });

      console.log('\n📊 Resumo por Status:');
      Object.entries(porStatus).forEach(([status, qtd]) => {
        console.log(`   ${status}: ${qtd}`);
      });

      // Resumo por statusProcesso
      const porStatusProcesso = {};
      equipamentos.forEach(e => {
        porStatusProcesso[e.statusProcesso || 'N/A'] = (porStatusProcesso[e.statusProcesso || 'N/A'] || 0) + 1;
      });

      console.log('\n📊 Resumo por Status do Processo:');
      Object.entries(porStatusProcesso).forEach(([status, qtd]) => {
        console.log(`   ${status}: ${qtd}`);
      });

    } else {
      console.log('❌ Nenhum equipamento encontrado neste projeto');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listar();
