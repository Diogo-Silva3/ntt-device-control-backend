const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const celularesBasteck = [
  { serialNumber: '358680812085931' },
  { serialNumber: '358680812085774' },
  { serialNumber: '358680812645817' },
  { serialNumber: '358680812093919' },
  { serialNumber: '358680812093786' },
  { serialNumber: '358680812089297' },
  { serialNumber: '358680812084769' },
  { serialNumber: '358680812073044' },
  { serialNumber: '358680812634969' },
  { serialNumber: '358680812085394' },
  { serialNumber: '358680812645577' },
  { serialNumber: '358680812076518' },
  { serialNumber: '358680812081112' },
  { serialNumber: '358680812643465' },
  { serialNumber: '358680812633961' },
  { serialNumber: '358680812632351' },
  { serialNumber: '358680812679204' },
  { serialNumber: '358680812090493' }
];

async function importar() {
  try {
    console.log(`📱 Importando ${celularesBasteck.length} celulares para WB - Basteck...\n`);

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

    // Buscar a unidade WB - BASTECK
    const unidade = await prisma.unidade.findFirst({
      where: {
        nome: 'WB - BASTECK'
      }
    });

    if (!unidade) {
      console.log('❌ Unidade "WB - BASTECK" não encontrada');
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

    for (const celular of celularesBasteck) {
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
