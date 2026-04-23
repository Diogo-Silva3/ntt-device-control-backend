const prisma = require('./src/config/prisma');

(async () => {
  try {
    // Encontrar o equipamento H55C9H4 no projeto TECH REFRESH LAPTOP 2026 (ID 1)
    const equipamento = await prisma.equipamento.findFirst({
      where: {
        serialNumber: 'H55C9H4',
        projetoId: 1
      }
    });

    if (!equipamento) {
      console.log('Equipamento H55C9H4 não encontrado no projeto TECH REFRESH LAPTOP 2026');
      process.exit(1);
    }

    console.log('Equipamento encontrado:', equipamento);

    // Atualizar para Agendado para Entrega (voltar de Entregue)
    const atualizado = await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: {
        statusProcesso: 'Agendado para Entrega',
        status: 'DISPONIVEL'
      }
    });

    console.log('Equipamento atualizado com sucesso:', atualizado);
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
})();
