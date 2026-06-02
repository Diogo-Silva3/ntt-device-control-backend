const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const atualizacoes = [
  // WB - RJ (20)
  { serialNumber: 'BFMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'J4MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '6DMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '2FMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '8FMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '3HMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'C5MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '4K7HDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'H5MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'D4MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '35MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '84MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '85MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '2K7HDJ4', unidade: 'WB - RJ' },
  { serialNumber: '26MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '95MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '9K7HDJ4', unidade: 'WB - RJ' },
  { serialNumber: '94MYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '7GMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '1JMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'HFMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '4DMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'GFMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'FCMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: 'FGMYDJ4', unidade: 'WB - RJ' },
  { serialNumber: '65MYDJ4', unidade: 'WB - RJ' },
  
  // WB - BASTECK (20)
  { serialNumber: 'B5MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'B4MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '5GMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '5CMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '3CMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'GDMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'G4MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '5K7HDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '15MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '7J7HDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'GCMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'CGMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '74MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'HDMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'BDMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'JDMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '4FMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '6GMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: '7DMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'DDMYDJ4', unidade: 'WB - BASTECK' },
  
  // CDVA IMIGRANTES (6)
  { serialNumber: '5FMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  { serialNumber: '7FMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  { serialNumber: 'FFMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  { serialNumber: '4GMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  { serialNumber: 'CDMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  { serialNumber: '6HMYDJ4', unidade: 'CDVA -  IMIGRANTES' },
  
  // CDVA BANDEIRANTES (4)
  { serialNumber: 'DFMYDJ4', unidade: 'CDVA -  BANDEIRANTES' },
  { serialNumber: '3GMYDJ4', unidade: 'CDVA -  BANDEIRANTES' },
  { serialNumber: 'FHMYDJ4', unidade: 'CDVA -  BANDEIRANTES' },
  { serialNumber: '1FMYDJ4', unidade: 'CDVA -  BANDEIRANTES' },
  
  // DIADEMA (3)
  { serialNumber: 'DCMYDJ4', unidade: 'DIADEMA' },
  { serialNumber: '1GMYDJ4', unidade: 'DIADEMA' },
  { serialNumber: '1BMYDJ4', unidade: 'DIADEMA' },
  
  // WB - HORTOLÂNDIA (3)
  { serialNumber: '3DMYDJ4', unidade: 'WB - HORTOLÂNDIA' },
  { serialNumber: '9FMYDJ4', unidade: 'WB - HORTOLÂNDIA' },
  { serialNumber: 'F8MYDJ4', unidade: 'WB - HORTOLÂNDIA' },
  
  // WB - PORTO ALEGRE (2)
  { serialNumber: '4CMYDJ4', unidade: 'WB - PORTO ALEGRE' },
  { serialNumber: '2DMYDJ4', unidade: 'WB - PORTO ALEGRE' },
  
  // OUTROS (extras que estavam na lista)
  { serialNumber: '8DMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'FDMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'D5MYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'JFMYDJ4', unidade: 'WB - BASTECK' },
  { serialNumber: 'BGMYDJ4', unidade: 'WB - BASTECK' },
];

async function atualizar() {
  try {
    console.log(`🔄 Atualizando ${atualizacoes.length} desktops...\n`);

    let sucesso = 0;
    let erro = 0;

    for (const att of atualizacoes) {
      try {
        // Buscar a unidade
        const unidade = await prisma.unidade.findFirst({
          where: {
            nome: att.unidade
          }
        });

        if (!unidade) {
          console.log(`❌ Unidade "${att.unidade}" não encontrada para ${att.serialNumber}`);
          erro++;
          continue;
        }

        // Atualizar o equipamento
        await prisma.equipamento.updateMany({
          where: {
            serialNumber: att.serialNumber
          },
          data: {
            unidadeId: unidade.id
          }
        });

        console.log(`✅ ${att.serialNumber} → ${att.unidade}`);
        sucesso++;
      } catch (e) {
        console.log(`❌ Erro ao atualizar ${att.serialNumber}: ${e.message}`);
        erro++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Atualizados: ${sucesso}`);
    console.log(`   ❌ Erros: ${erro}`);

  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

atualizar();
