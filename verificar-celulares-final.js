const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const numerosSerieString = `358680812647185358680812647201358680812653332358680812653993358680812654579358680812653464358680812653191358680812654231358680812653381358680812653779358680812636147358680812652813358680812647235358680812643093358680812676630358680812678677358680812634399358680812692603358680812633185358680812676184358680812649702358680812641659358680812634704358680812647359358680812654496358680812674775358680812646542358680812649777358680812666730358680812634761358680812668058358680812646443358680812676150358680812654587358680812666763358680812654249358680812679907358680812671797`;

// Dividir em números de série individuais (cada um tem 15 caracteres)
const numerosSerie = [];
for (let i = 0; i < numerosSerieString.length; i += 15) {
  numerosSerie.push(numerosSerieString.substring(i, i + 15));
}

async function verificar() {
  try {
    console.log(`🔍 Verificando ${numerosSerie.length} celulares no banco...\n`);

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        serialNumber: {
          in: numerosSerie
        }
      },
      select: {
        serialNumber: true,
        marca: true,
        modelo: true,
        status: true,
        projeto: {
          select: {
            nome: true
          }
        },
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

    console.log(`✅ Encontrados: ${equipamentos.length} celulares\n`);

    if (equipamentos.length > 0) {
      console.table(equipamentos);

      // Resumo por projeto
      const porProjeto = {};
      equipamentos.forEach(e => {
        const proj = e.projeto?.nome || 'Sem Projeto';
        porProjeto[proj] = (porProjeto[proj] || 0) + 1;
      });

      console.log('\n📊 Resumo por Projeto:');
      Object.entries(porProjeto).forEach(([proj, qtd]) => {
        console.log(`   ${proj}: ${qtd}`);
      });

      // Resumo por unidade
      const porUnidade = {};
      equipamentos.forEach(e => {
        const un = e.unidade?.nome || 'Sem Unidade';
        porUnidade[un] = (porUnidade[un] || 0) + 1;
      });

      console.log('\n📊 Resumo por Unidade:');
      Object.entries(porUnidade).forEach(([un, qtd]) => {
        console.log(`   ${un}: ${qtd}`);
      });
    } else {
      console.log('❌ Nenhum celular encontrado');
    }

    // Verificar faltando
    const encontrados = equipamentos.map(e => e.serialNumber);
    const faltando = numerosSerie.filter(ns => !encontrados.includes(ns));

    console.log(`\n📊 Resumo Final:`);
    console.log(`   Total a verificar: ${numerosSerie.length}`);
    console.log(`   Encontrados: ${encontrados.length}`);
    console.log(`   Faltando: ${faltando.length}`);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
