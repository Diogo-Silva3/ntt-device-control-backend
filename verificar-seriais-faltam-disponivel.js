const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando seriais em "Faltam Entregar" e "Disponível"...\n');

    // 1. Encontrar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. Buscar equipamentos em "Faltam Entregar" (Agendado para Entrega)
    const faltamEntregar = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      },
      select: {
        serialNumber: true,
        marca: true,
        modelo: true,
        unidade: { select: { nome: true } },
        status: true,
        statusProcesso: true
      },
      orderBy: { serialNumber: 'asc' }
    });

    // 3. Buscar equipamentos em "Disponível"
    const disponivel = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        status: 'DISPONIVEL',
        statusProcesso: { not: 'Agendado para Entrega' }
      },
      select: {
        serialNumber: true,
        marca: true,
        modelo: true,
        unidade: { select: { nome: true } },
        status: true,
        statusProcesso: true
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📊 RESUMO:`);
    console.log(`   Faltam Entregar: ${faltamEntregar.length}`);
    console.log(`   Disponível: ${disponivel.length}`);
    console.log(`   Total: ${faltamEntregar.length + disponivel.length}\n`);

    // 4. Extrair seriais
    const serialsFaltam = faltamEntregar.map(e => e.serialNumber);
    const serialsDisponivel = disponivel.map(e => e.serialNumber);

    // 5. Verificar duplicatas
    const todasSeriais = [...serialsFaltam, ...serialsDisponivel];
    const duplicatas = todasSeriais.filter((serial, index) => todasSeriais.indexOf(serial) !== index);

    if (duplicatas.length > 0) {
      console.log(`⚠️  DUPLICATAS ENCONTRADAS (${duplicatas.length}):\n`);
      const duplicatasUnicas = [...new Set(duplicatas)];
      duplicatasUnicas.forEach(serial => {
        console.log(`   ${serial}`);
      });
      console.log('');
    } else {
      console.log(`✅ Nenhuma duplicata encontrada\n`);
    }

    // 6. Listar seriais em "Faltam Entregar"
    console.log(`📋 FALTAM ENTREGAR (${faltamEntregar.length}):\n`);
    faltamEntregar.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Marca: ${eq.marca}`);
      console.log(`   Modelo: ${eq.modelo}`);
      console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   Status Processo: ${eq.statusProcesso}`);
      console.log('');
    });

    // 7. Listar seriais em "Disponível"
    console.log(`\n📋 DISPONÍVEL (${disponivel.length}):\n`);
    disponivel.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Marca: ${eq.marca}`);
      console.log(`   Modelo: ${eq.modelo}`);
      console.log(`   Unidade: ${eq.unidade?.nome || 'N/A'}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   Status Processo: ${eq.statusProcesso}`);
      console.log('');
    });

    // 8. Exportar para arquivo
    const fs = require('fs');
    const relatorio = {
      timestamp: new Date().toISOString(),
      projeto: projeto.nome,
      resumo: {
        faltamEntregar: faltamEntregar.length,
        disponivel: disponivel.length,
        total: faltamEntregar.length + disponivel.length,
        duplicatas: duplicatas.length
      },
      faltamEntregar: faltamEntregar,
      disponivel: disponivel,
      duplicatas: [...new Set(duplicatas)]
    };

    fs.writeFileSync(
      'relatorio-seriais-celulares.json',
      JSON.stringify(relatorio, null, 2)
    );

    console.log(`\n✅ Relatório salvo em: relatorio-seriais-celulares.json`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
