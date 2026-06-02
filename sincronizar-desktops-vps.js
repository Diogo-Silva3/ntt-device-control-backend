const { PrismaClient } = require('@prisma/client');

const atualizacoes = [
  // WB - RJ (26)
  { serialNumber: 'BFMYDJ4', unidadeId: 18 },
  { serialNumber: 'J4MYDJ4', unidadeId: 18 },
  { serialNumber: '6DMYDJ4', unidadeId: 18 },
  { serialNumber: '2FMYDJ4', unidadeId: 18 },
  { serialNumber: '8FMYDJ4', unidadeId: 18 },
  { serialNumber: '3HMYDJ4', unidadeId: 18 },
  { serialNumber: 'C5MYDJ4', unidadeId: 18 },
  { serialNumber: '4K7HDJ4', unidadeId: 18 },
  { serialNumber: 'H5MYDJ4', unidadeId: 18 },
  { serialNumber: 'D4MYDJ4', unidadeId: 18 },
  { serialNumber: '35MYDJ4', unidadeId: 18 },
  { serialNumber: '84MYDJ4', unidadeId: 18 },
  { serialNumber: '85MYDJ4', unidadeId: 18 },
  { serialNumber: '2K7HDJ4', unidadeId: 18 },
  { serialNumber: '26MYDJ4', unidadeId: 18 },
  { serialNumber: '95MYDJ4', unidadeId: 18 },
  { serialNumber: '9K7HDJ4', unidadeId: 18 },
  { serialNumber: '94MYDJ4', unidadeId: 18 },
  { serialNumber: '7GMYDJ4', unidadeId: 18 },
  { serialNumber: '1JMYDJ4', unidadeId: 18 },
  { serialNumber: 'HFMYDJ4', unidadeId: 18 },
  { serialNumber: '4DMYDJ4', unidadeId: 18 },
  { serialNumber: 'GFMYDJ4', unidadeId: 18 },
  { serialNumber: 'FCMYDJ4', unidadeId: 18 },
  { serialNumber: 'FGMYDJ4', unidadeId: 18 },
  { serialNumber: '65MYDJ4', unidadeId: 18 },
  
  // WB - BASTECK (20)
  { serialNumber: 'B5MYDJ4', unidadeId: 6 },
  { serialNumber: 'B4MYDJ4', unidadeId: 6 },
  { serialNumber: '5GMYDJ4', unidadeId: 6 },
  { serialNumber: '5CMYDJ4', unidadeId: 6 },
  { serialNumber: '3CMYDJ4', unidadeId: 6 },
  { serialNumber: 'GDMYDJ4', unidadeId: 6 },
  { serialNumber: 'G4MYDJ4', unidadeId: 6 },
  { serialNumber: '5K7HDJ4', unidadeId: 6 },
  { serialNumber: '15MYDJ4', unidadeId: 6 },
  { serialNumber: '7J7HDJ4', unidadeId: 6 },
  { serialNumber: 'GCMYDJ4', unidadeId: 6 },
  { serialNumber: 'CGMYDJ4', unidadeId: 6 },
  { serialNumber: '74MYDJ4', unidadeId: 6 },
  { serialNumber: 'HDMYDJ4', unidadeId: 6 },
  { serialNumber: 'BDMYDJ4', unidadeId: 6 },
  { serialNumber: 'JDMYDJ4', unidadeId: 6 },
  { serialNumber: '4FMYDJ4', unidadeId: 6 },
  { serialNumber: '6GMYDJ4', unidadeId: 6 },
  { serialNumber: '7DMYDJ4', unidadeId: 6 },
  { serialNumber: 'DDMYDJ4', unidadeId: 6 },
  { serialNumber: '8DMYDJ4', unidadeId: 6 },
  { serialNumber: 'FDMYDJ4', unidadeId: 6 },
  { serialNumber: 'D5MYDJ4', unidadeId: 6 },
  { serialNumber: 'JFMYDJ4', unidadeId: 6 },
  { serialNumber: 'BGMYDJ4', unidadeId: 6 },
  
  // CDVA -  IMIGRANTES (6) - ID 41
  { serialNumber: '5FMYDJ4', unidadeId: 41 },
  { serialNumber: '7FMYDJ4', unidadeId: 41 },
  { serialNumber: 'FFMYDJ4', unidadeId: 41 },
  { serialNumber: '4GMYDJ4', unidadeId: 41 },
  { serialNumber: 'CDMYDJ4', unidadeId: 41 },
  { serialNumber: '6HMYDJ4', unidadeId: 41 },
  
  // CDVA -  BANDEIRANTES (4) - ID 39
  { serialNumber: 'DFMYDJ4', unidadeId: 39 },
  { serialNumber: '3GMYDJ4', unidadeId: 39 },
  { serialNumber: 'FHMYDJ4', unidadeId: 39 },
  { serialNumber: '1FMYDJ4', unidadeId: 39 },
  
  // DIADEMA (3) - ID 2
  { serialNumber: 'DCMYDJ4', unidadeId: 2 },
  { serialNumber: '1GMYDJ4', unidadeId: 2 },
  { serialNumber: '1BMYDJ4', unidadeId: 2 },
  
  // WB - HORTOLÂNDIA (3) - ID 19
  { serialNumber: '3DMYDJ4', unidadeId: 19 },
  { serialNumber: '9FMYDJ4', unidadeId: 19 },
  { serialNumber: 'F8MYDJ4', unidadeId: 19 },
  
  // WB - PORTO ALEGRE (2) - ID 5
  { serialNumber: '4CMYDJ4', unidadeId: 5 },
  { serialNumber: '2DMYDJ4', unidadeId: 5 },
];

async function sincronizar() {
  // Usar a DATABASE_URL que já aponta para a VPS
  const prismaVps = new PrismaClient();

  try {
    console.log(`🔄 Sincronizando ${atualizacoes.length} desktops para VPS...\n`);

    let sucesso = 0;
    let erro = 0;

    for (const att of atualizacoes) {
      try {
        const result = await prismaVps.equipamento.updateMany({
          where: {
            serialNumber: att.serialNumber
          },
          data: {
            unidadeId: att.unidadeId
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ ${att.serialNumber} → unidade_id: ${att.unidadeId}`);
          sucesso++;
        } else {
          console.log(`⚠️  ${att.serialNumber} não encontrado na VPS`);
          erro++;
        }
      } catch (e) {
        console.log(`❌ Erro ao atualizar ${att.serialNumber}: ${e.message}`);
        erro++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Sincronizados: ${sucesso}`);
    console.log(`   ❌ Erros/Não encontrados: ${erro}`);

  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await prismaVps.$disconnect();
  }
}

sincronizar();
