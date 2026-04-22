require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDuplicados() {
  try {
    console.log('=== VERIFICANDO EQUIPAMENTOS DUPLICADOS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar todos os equipamentos do projeto
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
      },
      select: {
        id: true,
        serialNumber: true,
        status: true,
        statusProcesso: true,
      },
      orderBy: { serialNumber: 'asc' },
    });

    console.log(`Total de equipamentos: ${equipamentos.length}\n`);

    // Verificar duplicados por serialNumber
    const serialMap = {};
    const duplicados = [];

    equipamentos.forEach(eq => {
      if (serialMap[eq.serialNumber]) {
        duplicados.push({
          serialNumber: eq.serialNumber,
          equipamentos: [serialMap[eq.serialNumber], eq],
        });
      } else {
        serialMap[eq.serialNumber] = eq;
      }
    });

    if (duplicados.length > 0) {
      console.log(`❌ EQUIPAMENTOS DUPLICADOS ENCONTRADOS: ${duplicados.length}\n`);
      
      duplicados.forEach(dup => {
        console.log(`Serial: ${dup.serialNumber}`);
        dup.equipamentos.forEach(eq => {
          console.log(`  ID: ${eq.id}`);
          console.log(`  Status: ${eq.status}`);
          console.log(`  StatusProcesso: ${eq.statusProcesso}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ Nenhum equipamento duplicado encontrado\n');
    }

    // Verificar se há equipamentos sem serial number
    const semSerial = equipamentos.filter(eq => !eq.serialNumber || eq.serialNumber.trim() === '');
    
    if (semSerial.length > 0) {
      console.log(`⚠️  EQUIPAMENTOS SEM SERIAL NUMBER: ${semSerial.length}\n`);
      semSerial.forEach(eq => {
        console.log(`  ID: ${eq.id}`);
        console.log(`  Status: ${eq.status}`);
        console.log(`  StatusProcesso: ${eq.statusProcesso}\n`);
      });
    }

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDuplicados();
