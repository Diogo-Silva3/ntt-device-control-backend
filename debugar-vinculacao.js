const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugar() {
  try {
    console.log('Verificando equipamento F95C9H4...');
    
    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: 'F95C9H4' },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        agendamento: true,
        vinculacoes: { where: { ativa: true } }
      }
    });

    console.log('\n📋 Equipamento encontrado:');
    console.log('  ID:', eq.id);
    console.log('  Serial:', eq.serialNumber);
    console.log('  Status:', eq.statusProcesso);
    console.log('  Agendamento:', eq.agendamento);
    console.log('  Vinculações ativas:', eq.vinculacoes.length);

    if (eq.agendamento) {
      const agend = JSON.parse(eq.agendamento);
      console.log('\n📌 Detalhes do agendamento:');
      console.log('  Colaborador ID:', agend.colaboradorId);
      console.log('  Data:', agend.data);
      console.log('  Horário:', agend.horario);
      console.log('  Local:', agend.local);

      if (agend.colaboradorId) {
        const colab = await prisma.usuario.findUnique({
          where: { id: parseInt(agend.colaboradorId) },
          select: { id: true, nome: true, email: true }
        });
        console.log('\n👤 Colaborador:');
        console.log('  ID:', colab?.id);
        console.log('  Nome:', colab?.nome);
        console.log('  Email:', colab?.email);
      }
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debugar();
