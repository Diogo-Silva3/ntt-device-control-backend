const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const celularesImigrantes = [
  { serialNumber: '358680812648324' },
  { serialNumber: '358680812677778' },
  { serialNumber: '358680812666987' },
  { serialNumber: '358680812636212' },
  { serialNumber: '358680812643267' },
  { serialNumber: '358680812667969' },
  { serialNumber: '358680812668660' },
  { serialNumber: '358680812630579' }
];

async function importar() {
  try {
    console.log(`📱 Importando ${celularesImigrantes.length} celulares para CDVA - IMIGRANTES...\n`);

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

    // Buscar a unidade CDVA -  IMIGRANTES (com 2 espaços)
    const unidade = await prisma.unidade.findFirst({
      where: {
        nome: 'CDVA -  IMIGRANTES'
      }
    });

    if (!unidade) {
      console.log('❌ Unidade "CDVA -  IMIGRANTES" não encontrada');
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

    for (const celular of celularesImigrantes) {
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
