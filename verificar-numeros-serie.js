const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const numerosSerieString = `BFMYDJ4J4MYDJ46DMYDJ42FMYDJ48FMYDJ43HMYDJ4C5MYDJ44K7HDJ4H5MYDJ4D4MYDJ435MYDJ484MYDJ485MYDJ42K7HDJ426MYDJ495MYDJ49K7HDJ494MYDJ47GMYDJ41JMYDJ4HFMYDJ44DMYDJ47DMYDJ4DDMYDJ48DMYDJ4FDMYDJ4D5MYDJ4JFMYDJ4BGMYDJ4B5MYDJ4B4MYDJ45GMYDJ45CMYDJ43CMYDJ4GDMYDJ4G4MYDJ45K7HDJ415MYDJ47J7HDJ4GCMYDJ4CGMYDJ474MYDJ4HDMYDJ4BDMYDJ4JDMYDJ44FMYDJ46GMYDJ45FMYDJ47FMYDJ4FFMYDJ44GMYDJ4CDMYDJ46HMYDJ4DFMYDJ43GMYDJ4FHMYDJ41FMYDJ4DCMYDJ41GMYDJ43DMYDJ49FMYDJ4GFMYDJ4FCMYDJ4FGMYDJ44CMYDJ42DMYDJ41BMYDJ4F8MYDJ465MYDJ4`;

// Dividir em números de série individuais (cada um tem 8 caracteres)
const numerosSerie = [];
for (let i = 0; i < numerosSerieString.length; i += 8) {
  numerosSerie.push(numerosSerieString.substring(i, i + 8));
}

async function verificar() {
  try {
    console.log(`🔍 Verificando ${numerosSerie.length} números de série no banco de dados...\n`);

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
        projeto: {
          select: {
            nome: true
          }
        }
      }
    });

    console.log(`✅ Encontrados: ${equipamentos.length} equipamentos\n`);

    if (equipamentos.length > 0) {
      console.table(equipamentos);
    } else {
      console.log('❌ Nenhum equipamento encontrado com esses números de série');
    }

    // Verificar faltando
    const encontrados = equipamentos.map(e => e.serialNumber);
    const faltando = numerosSerie.filter(ns => !encontrados.includes(ns));

    console.log(`\n📊 Resumo:`);
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
