const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarTablets() {
  try {
    console.log('📱 Verificando equipamentos TABLETS...\n');

    // Números de série fornecidos
    const series = [
      'BFMYDJ4', 'J4MYDJ4', '6DMYDJ4', '2FMYDJ4', '8FMYDJ4', '3HMYDJ4', 'C5MYDJ4', '4K7HDJ4', 'H5MYDJ4', 'D4MYDJ4',
      '35MYDJ4', '484MYDJ4', '485MYDJ4', '2K7HDJ4', '426MYDJ4', '495MYDJ4', '9K7HDJ4', '494MYDJ4', '7GMYDJ4', '1JMYDJ4',
      'HFMYDJ4', '4DMYDJ4', '7DMYDJ4', 'DDMYDJ4', '8DMYDJ4', 'FDMYDJ4', 'D5MYDJ4', 'JFMYDJ4', 'BGMYDJ4', 'B5MYDJ4',
      'B4MYDJ4', '5GMYDJ4', '5CMYDJ4', '3CMYDJ4', 'GDMYDJ4', 'G4MYDJ4', '5K7HDJ4', '415MYDJ4', '7J7HDJ4', 'GCMYDJ4',
      'CGMYDJ4', '474MYDJ4', 'HDMYDJ4', 'BDMYDJ4', 'JDMYDJ4', '44FMYDJ4', '46GMYDJ4', '45FMYDJ4', '47FMYDJ4', 'FFMYDJ4',
      '44GMYDJ4', 'CDMYDJ4', '46HMYDJ4', 'DFMYDJ4', '43GMYDJ4', 'FHMYDJ4', '41FMYDJ4', 'DCMYDJ4', '41GMYDJ4', '43DMYDJ4',
      '49FMYDJ4', 'GFMYDJ4', 'FCMYDJ4', 'FGMYDJ4', '44CMYDJ4', '42DMYDJ4', '41BMYDJ4', 'F8MYDJ4', '465MYDJ4'
    ];

    console.log(`📊 Total de séries para verificar: ${series.length}\n`);

    // Buscar projeto TABLETS
    const tablets = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'TABLETS', mode: 'insensitive' }
      }
    });

    console.log(`Projeto: ${tablets.nome} (ID: ${tablets.id})\n`);

    // Verificar cada série
    let encontrados = 0;
    let naoEncontrados = 0;
    const naoEncontradosList = [];

    for (const serie of series) {
      const existe = await prisma.equipamento.findFirst({
        where: {
          serialNumber: serie,
          projetoId: tablets.id
        }
      });

      if (existe) {
        encontrados++;
        console.log(`✅ ${serie}`);
      } else {
        naoEncontrados++;
        naoEncontradosList.push(serie);
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`✅ Encontrados: ${encontrados}`);
    console.log(`❌ Não encontrados: ${naoEncontrados}`);

    if (naoEncontradosList.length > 0) {
      console.log(`\n❌ Equipamentos NÃO encontrados:`);
      naoEncontradosList.forEach(s => console.log(`   - ${s}`));
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTablets();
