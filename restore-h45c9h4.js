const prisma = require('./src/config/prisma');

async function restore() {
  try {
    // Primeiro, encontrar o equipamento H45C9H4 pelo serialNumber
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' }
    });

    if (!equipamento) {
      console.error('Equipamento H45C9H4 não encontrado');
      return;
    }

    console.log(`Encontrado: ${equipamento.serialNumber} (ID: ${equipamento.id})`);
    console.log(`Status atual: ${equipamento.status}`);
    console.log(`StatusProcesso atual: ${equipamento.statusProcesso}`);

    // Agora atualizar usando o ID
    const resultado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { 
        status: 'DISPONIVEL',
        statusProcesso: 'Agendado para Entrega'
      }
    });

    console.log(`\n✅ Equipamento restaurado com sucesso!`);
    console.log(`Serial: ${resultado.serialNumber}`);
    console.log(`Status: ${resultado.status}`);
    console.log(`StatusProcesso: ${resultado.statusProcesso}`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
