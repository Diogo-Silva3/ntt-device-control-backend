const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deletar() {
  try {
    console.log('🗑️  Deletando celular inválido...\n');

    const resultado = await prisma.equipamento.deleteMany({
      where: {
        serialNumber: '358681000000000'
      }
    });

    if (resultado.count > 0) {
      console.log(`✅ Celular deletado com sucesso!`);
      console.log(`   Serial: 358681000000000`);
      console.log(`   Registros deletados: ${resultado.count}`);
    } else {
      console.log('❌ Celular não encontrado');
    }

    // Verificar total agora
    const total = await prisma.equipamento.count({
      where: {
        projeto: {
          nome: 'TECH REFRESH CELULARES 2026'
        }
      }
    });

    console.log(`\n📱 Total de celulares agora: ${total}`);

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deletar();
