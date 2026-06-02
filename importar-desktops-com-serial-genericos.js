const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const equipamentos = [
  { unidadeId: 23, nomeLoca: 'BRASÍLIA', quantidade: 1 },
  { unidadeId: 39, nomeLoca: 'CDVA - BANDEIRANTES', quantidade: 4 },
  { unidadeId: 41, nomeLoca: 'CDVA - IMIGRANTES', quantidade: 6 },
  { unidadeId: 2, nomeLoca: 'DIADEMA', quantidade: 22 },
  { unidadeId: 4, nomeLoca: 'HORTOLÂNDIA', quantidade: 40 },
  { unidadeId: 5, nomeLoca: 'WB - PORTO ALEGRE', quantidade: 18 },
  { unidadeId: 5, nomeLoca: 'WB - PORTO ALEGRE', quantidade: 11 },
  { unidadeId: 18, nomeLoca: 'WB - RJ', quantidade: 32 },
];

function gerarSerialNumber(unidadeId, contador) {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DELL-U${unidadeId}-${contador.toString().padStart(3, '0')}-${timestamp}${random}`;
}

async function importar() {
  try {
    console.log('🚀 Importando 134 Desktops DELL com números de série genéricos...\n');

    let totalImportado = 0;
    let contadoresPorUnidade = {};

    for (const item of equipamentos) {
      console.log(`📍 ${item.nomeLoca}: criando ${item.quantidade} desktops...`);

      if (!contadoresPorUnidade[item.unidadeId]) {
        contadoresPorUnidade[item.unidadeId] = 0;
      }

      for (let i = 1; i <= item.quantidade; i++) {
        try {
          contadoresPorUnidade[item.unidadeId]++;
          const serialNumber = gerarSerialNumber(item.unidadeId, contadoresPorUnidade[item.unidadeId]);

          await prisma.equipamento.create({
            data: {
              tipo: 'DESKTOP',
              marca: 'DELL',
              modelo: 'PRO MICRO QCM1250',
              serialNumber: serialNumber,
              patrimonio: null,
              status: 'DISPONÍVEL',
              statusProcesso: 'Novo',
              unidadeId: item.unidadeId,
              empresaId: 1,
              projetoId: 1,
            },
          });
          totalImportado++;
        } catch (err) {
          console.error(`  ❌ Erro:`, err.message);
        }
      }

      console.log(`  ✅ ${item.quantidade} desktops criados\n`);
    }

    console.log(`════════════════════════════════════════`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA!`);
    console.log(`📊 Total importado: ${totalImportado} desktops`);
    console.log(`════════════════════════════════════════`);
    console.log(`💡 Seriais são genéricos - edite depois conforme necessário\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

importar();
