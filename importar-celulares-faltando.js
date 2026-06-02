const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const celularesFaltando = [
  { serialNumber: '358680812634399' },
  { serialNumber: '358680812647235' },
  { serialNumber: '358680812678677' },
  { serialNumber: '358680812649777' },
  { serialNumber: '358680812646443' },
  { serialNumber: '358680812676150' },
  { serialNumber: '358680812634704' }
];

async function importar() {
  try {
    console.log(`📱 Importando ${celularesFaltando.length} celulares faltando...\n`);

    // Buscar o projeto TECH REFRESH CELULARES 2026
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: 'TECH REFRESH CELULARES 2026'
      }
    });

    if (!projeto) {
      console.log('❌ Projeto "TECH REFRESH CELULARES 2026" não encontrado');
      return;
    }

    // Buscar a unidade WB - RJ
    const unidade = await prisma.unidade.findFirst({
      where: {
        nome: 'WB - RJ'
      }
    });

    if (!unidade) {
      console.log('❌ Unidade "WB - RJ" não encontrada');
      return;
    }

    // Buscar a empresa BIMBO BRASIL
    const empresa = await prisma.empresa.findFirst({
      where: {
        nome: 'BIMBO BRASIL'
      }
    });

    if (!empresa) {
      console.log('❌ Empresa "BIMBO BRASIL" não encontrada');
      return;
    }

    console.log(`✅ Projeto: ${projeto.nome}`);
    console.log(`✅ Unidade: ${unidade.nome}`);
    console.log(`✅ Empresa: ${empresa.nome}\n`);

    let sucesso = 0;
    let erro = 0;

    for (const celular of celularesFaltando) {
      try {
        const equipamento = await prisma.equipamento.create({
          data: {
            serialNumber: celular.serialNumber,
            marca: 'SAMSUNG',
            modelo: 'SAMSUNG A17 256GB',
            tipo: 'CELULAR',
            status: 'DISPONIVEL',
            projetoId: projeto.id,
            unidadeId: unidade.id,
            empresaId: empresa.id
          }
        });

        console.log(`✅ ${celular.serialNumber} importado com sucesso`);
        sucesso++;
      } catch (e) {
        console.log(`❌ Erro ao importar ${celular.serialNumber}: ${e.message}`);
        erro++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Importados: ${sucesso}`);
    console.log(`   ❌ Erros: ${erro}`);

  } catch (error) {
    console.error('Erro geral:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importar();
