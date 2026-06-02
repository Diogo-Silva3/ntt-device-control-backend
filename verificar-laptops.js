const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarLaptops() {
  try {
    console.log('💻 Verificando equipamentos LAPTOP...\n');

    // Números de série fornecidos
    const series = [
      'H65C9H4', '265C9H4', 'F15C9H4', '725C9H4', '435C9H4', 'H15C9H4', '815C9H4', '245C9H4', '285C9H4', '8X3C9H4',
      'D95C9H4', '6B5C9H4', 'B65C9H4', '335C9H4', 'F65C9H4', 'H25C9H4', '115C9H4', 'F25C9H4', '715C9H4', '165C9H4',
      '425C9H4', '985C9H4', 'B75C9H4', '945C9H4', 'D65C9H4', 'C55C9H4', '4Z3C9H4', 'GB5C9H4', '635C9H4', '995C9H4',
      'G45C9H4', 'J45C9H4', '965C9H4', '265C9H4', '955C9H4', 'D75C9H4', '785C9H4', '775C9H4', '875C9H4', '975C9H4',
      'CX3C9H4', '8Y3C9H4', '8W3C9H4', '7X3C9H4', 'G85C9H4', '835C9H4', '825C9H4', 'G25C9H4', '125C9H4', 'C15C9H4',
      'C25C9H4', '675C9H4', '625C9H4', '3X3C9H4', '9X3C9H4', '9W3C9H4', 'GV3C9H4', '3Y3C9H4', '6X3C9H4', '6Y3C9H4',
      '7W3C9H4', 'HV3C9H4', 'JW3C9H4', '195C9H4', 'GX3C9H4', '3B5C9H4', '385C9H4', 'C85C9H4', '1B5C9H4', 'C95C9H4',
      '485C9H4', '7B5C9H4', 'B95C9H4', '185C9H4', 'JX3C9H4', 'BX3C9H4', 'CY3C9H4', '2X3C9H4', '5X3C9H4', '325C9H4',
      'F95C9H4', '575C9H4'
    ];

    console.log(`📊 Total de séries para verificar: ${series.length}\n`);

    // Buscar projeto LAPTOP
    const laptop = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'LAPTOP', mode: 'insensitive' }
      }
    });

    console.log(`Projeto: ${laptop.nome} (ID: ${laptop.id})\n`);

    // Verificar cada série
    let encontrados = 0;
    let naoEncontrados = 0;
    const naoEncontradosList = [];

    for (const serie of series) {
      const existe = await prisma.equipamento.findFirst({
        where: {
          serialNumber: serie,
          projetoId: laptop.id
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

verificarLaptops();
