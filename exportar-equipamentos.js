const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportarEquipamentos() {
  try {
    console.log('📤 Exportando equipamentos...');

    // Buscar todos os equipamentos
    const equipamentos = await prisma.equipamento.findMany({
      include: {
        projeto: true,
        unidade: true,
        empresa: true
      }
    });

    console.log(`✅ Total de equipamentos: ${equipamentos.length}`);

    // Salvar em JSON
    const arquivo = path.join(__dirname, '..', 'equipamentos-export.json');
    fs.writeFileSync(arquivo, JSON.stringify(equipamentos, null, 2));

    console.log(`✅ Arquivo salvo: ${arquivo}`);

    // Mostrar resumo
    const porProjeto = {};
    equipamentos.forEach(eq => {
      const projeto = eq.projeto?.nome || 'SEM PROJETO';
      if (!porProjeto[projeto]) {
        porProjeto[projeto] = 0;
      }
      porProjeto[projeto]++;
    });

    console.log('\n📊 Resumo por projeto:');
    Object.entries(porProjeto).forEach(([projeto, total]) => {
      console.log(`  ${projeto}: ${total}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportarEquipamentos();
