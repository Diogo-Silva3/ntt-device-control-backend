const prisma = require('./src/config/prisma');

async function verificar() {
  try {
    const seriais = [
      '1ZNT8K4', '6ZNT8K4', '4TNT8K4', 'BXNT8K4', '4QNT8K4', '91PT8K4', 'F0PT8K4', '31PT8K4', 'GQNT8K4', 'BZNT8K4',
      'CPNT8K4', '21PT8K4', 'GXNT8K4', 'GTNT8K4', '4VNT8K4', 'FWNT8K4', '1YNT8K4', '4SNT8K4', 'HZNT8K4', 'BYNT8K4',
      '9YNT8K4', '4XNT8K4', 'D0PT8K4', '8TNT8K4', '1QNT8K4', 'JXNT8K4', '5SNT8K4', '7SNT8K4', 'HVNT8K4', 'CYNT8K4',
      'HQNT8K4', 'GZNT8K4', '20PT8K4', 'JYNT8K4', 'DYNT8K4', 'GYNT8K4', 'BRNT8K4', 'BQNT8K4', '90PT8K4', 'HWNT8K4',
      '4RNT8K4', 'JRNT8K4', 'FYNT8K4', 'FRNT8K4', '3ZNT8K4', '1WNT8K4', 'DWNT8K4', '22PT8K4', 'DRNT8K4', '51PT8K4',
      'J0PT8K4', '9QNT8K4', 'H1PT8K4', 'JZNT8K4', '9PNT8K4'
    ];

    console.log(`🔍 Verificando ${seriais.length} equipamentos...\n`);

    const encontrados = await prisma.equipamento.findMany({
      where: { serialNumber: { in: seriais } },
      select: { id: true, serialNumber: true, marca: true, modelo: true, unidade: { select: { nome: true } }, status: true, statusProcesso: true }
    });

    console.log(`✅ Encontrados: ${encontrados.length}`);
    console.log(`❌ Não encontrados: ${seriais.length - encontrados.length}\n`);

    if (encontrados.length > 0) {
      console.log('📦 Equipamentos encontrados:');
      encontrados.forEach(eq => {
        console.log(`   ${eq.serialNumber} - ${eq.marca} ${eq.modelo}`);
        console.log(`      Unidade: ${eq.unidade?.nome || 'Sem unidade'} | Status: ${eq.status} | Processo: ${eq.statusProcesso}`);
      });
    }

    // Listar os que não foram encontrados
    const naoEncontrados = seriais.filter(s => !encontrados.find(e => e.serialNumber === s));
    if (naoEncontrados.length > 0) {
      console.log(`\n❌ Equipamentos NÃO encontrados (${naoEncontrados.length}):`);
      naoEncontrados.forEach(s => console.log(`   ${s}`));
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
