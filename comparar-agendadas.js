const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function compararAgendadas() {
  try {
    console.log('📊 Comparando AGENDADAS vs Ag. Entrega\n');

    // Query 1: AGENDADAS (maquinasAgendadas) - statusProcesso = 'Agendado para Entrega'
    const agendadas = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
        status: { not: 'DESCARTADO' }
      },
      select: {
        id: true,
        serialNumber: true,
        marca: true,
        modelo: true,
        statusProcesso: true,
        status: true
      },
      orderBy: { serialNumber: 'asc' }
    });

    // Query 2: Ag. Entrega (agendados) - statusProcesso = 'Agendado para Entrega' + vinculacoes.statusEntrega = 'PENDENTE'
    const agEntrega = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
        status: { not: 'DESCARTADO' },
        vinculacoes: {
          some: {
            ativa: true,
            statusEntrega: 'PENDENTE'
          }
        }
      },
      select: {
        id: true,
        serialNumber: true,
        marca: true,
        modelo: true,
        statusProcesso: true,
        status: true
      },
      orderBy: { serialNumber: 'asc' }
    });

    console.log(`📦 AGENDADAS (statusProcesso = 'Agendado para Entrega'): ${agendadas.length}`);
    console.log(`📦 Ag. Entrega (+ vinculacoes.statusEntrega = 'PENDENTE'): ${agEntrega.length}\n`);

    // Criar mapas para comparação
    const mapaAgendadas = new Map(agendadas.map(e => [e.serialNumber, e]));
    const mapaAgEntrega = new Map(agEntrega.map(e => [e.serialNumber, e]));

    // Encontrar diferenças
    const apenasEmAgendadas = [];
    const apenasEmAgEntrega = [];

    mapaAgendadas.forEach((eq, serial) => {
      if (!mapaAgEntrega.has(serial)) {
        apenasEmAgendadas.push(eq);
      }
    });

    mapaAgEntrega.forEach((eq, serial) => {
      if (!mapaAgendadas.has(serial)) {
        apenasEmAgEntrega.push(eq);
      }
    });

    console.log('='.repeat(80));
    console.log('📋 EQUIPAMENTOS EM AGENDADAS:\n');
    agendadas.forEach((eq, idx) => {
      console.log(`${idx + 1}. ${eq.serialNumber} - ${eq.marca} ${eq.modelo}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📋 EQUIPAMENTOS EM AG. ENTREGA:\n');
    agEntrega.forEach((eq, idx) => {
      console.log(`${idx + 1}. ${eq.serialNumber} - ${eq.marca} ${eq.modelo}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🔍 DIFERENÇAS:\n');

    if (apenasEmAgendadas.length > 0) {
      console.log(`❌ APENAS EM AGENDADAS (${apenasEmAgendadas.length}):`);
      apenasEmAgendadas.forEach(eq => {
        console.log(`   • ${eq.serialNumber} - ${eq.marca} ${eq.modelo}`);
      });
      console.log();
    }

    if (apenasEmAgEntrega.length > 0) {
      console.log(`❌ APENAS EM AG. ENTREGA (${apenasEmAgEntrega.length}):`);
      apenasEmAgEntrega.forEach(eq => {
        console.log(`   • ${eq.serialNumber} - ${eq.marca} ${eq.modelo}`);
      });
      console.log();
    }

    if (apenasEmAgendadas.length === 0 && apenasEmAgEntrega.length === 0) {
      console.log('✅ Perfeito! Ambas as queries retornam os mesmos equipamentos!');
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

compararAgendadas();
