const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const numerosSerie = [
  'BFMYDJ4', 'J4MYDJ4', '6DMYDJ4', '2FMYDJ4', '8FMYDJ4', '3HMYDJ4', 'C5MYDJ4', '4K7HDJ4', 'H5MYDJ4', 'D4MYDJ4',
  '35MYDJ4', '84MYDJ4', '85MYDJ4', '2K7HDJ4', '26MYDJ4', '95MYDJ4', '9K7HDJ4', '94MYDJ4', '7GMYDJ4', '1JMYDJ4',
  'HFMYDJ4', '4DMYDJ4', '7DMYDJ4', 'DDMYDJ4', '8DMYDJ4', 'FDMYDJ4', 'D5MYDJ4', 'JFMYDJ4', 'BGMYDJ4', 'B5MYDJ4',
  'B4MYDJ4', '5GMYDJ4', '5CMYDJ4', '3CMYDJ4', 'GDMYDJ4', 'G4MYDJ4', '5K7HDJ4', '15MYDJ4', '7J7HDJ4', 'GCMYDJ4',
  'CGMYDJ4', '74MYDJ4', 'HDMYDJ4', 'BDMYDJ4', 'JDMYDJ4', '4FMYDJ4', '6GMYDJ4', '5FMYDJ4', '7FMYDJ4', 'FFMYDJ4',
  '4GMYDJ4', 'CDMYDJ4', '6HMYDJ4', 'DFMYDJ4', '3GMYDJ4', 'FHMYDJ4', '1FMYDJ4', 'DCMYDJ4', '1GMYDJ4', '3DMYDJ4',
  '9FMYDJ4', 'GFMYDJ4', 'FCMYDJ4', 'FGMYDJ4', '4CMYDJ4', '2DMYDJ4', '1BMYDJ4', 'F8MYDJ4', '65MYDJ4'
];

async function verificar() {
  try {
    console.log(`🔍 Verificando ${numerosSerie.length} números de série...\n`);

    const equipamentos = await prisma.equipamento.findMany({
      where: {
        serialNumber: {
          in: numerosSerie
        }
      },
      select: {
        id: true,
        serialNumber: true,
        marca: true,
        modelo: true,
        status: true,
        statusProcesso: true,
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

    console.log(`✅ Encontrados: ${equipamentos.length} equipamentos\n`);

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
      console.log('❌ Nenhum equipamento encontrado com esses números de série');
    }

    // Verificar faltando
    const encontrados = equipamentos.map(e => e.serialNumber);
    const faltando = numerosSerie.filter(ns => !encontrados.includes(ns));

    console.log(`\n📊 Resumo Final:`);
    console.log(`   Total a verificar: ${numerosSerie.length}`);
    console.log(`   Encontrados: ${encontrados.length}`);
    console.log(`   Faltando: ${faltando.length}`);

    if (faltando.length > 0 && faltando.length <= 30) {
      console.log('\n❌ Números de série faltando:');
      console.log(faltando.join(', '));
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
