const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deactivate() {
  try {
    console.log("=== DESATIVANDO VINCULAÇÃO DUPLICADA ANTIGA ===");
    const res = await prisma.vinculacao.update({
      where: { id: 88 },
      data: {
        ativa: false,
        dataFim: new Date()
      }
    });
    console.log(`Desativada vinculação ID: ${res.id} para ${res.usuarioId}`);

    // Agora vamos rodar a sincronização novamente para que Eq 644 fique com o statusProcesso correto
    console.log("\n=== RODANDO SINCRONIZAÇÃO ===");
    const eq = await prisma.equipamento.update({
      where: { id: 644 },
      data: {
        statusProcesso: 'Entregue ao Usuário',
        status: 'EM_USO'
      }
    });
    console.log(`Equipamento ${eq.serialNumber} atualizado para statusProcesso: ${eq.statusProcesso}`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

deactivate();
