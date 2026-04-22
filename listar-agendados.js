require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listar() {
  try {
    console.log('=== LISTANDO EQUIPAMENTOS AGENDADOS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const agendados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: { select: { nome: true } },
            tecnico: { select: { nome: true } },
          },
        },
      },
    });

    console.log(`Total de equipamentos agendados: ${agendados.length}\n`);

    agendados.forEach(eq => {
      console.log(`${eq.serialNumber}:`);
      console.log(`  Status: ${eq.statusProcesso}`);
      
      if (eq.vinculacoes.length > 0) {
        const vinc = eq.vinculacoes[0];
        console.log(`  Vinculação: ${vinc.usuario.nome}`);
        console.log(`  Técnico: ${vinc.tecnico?.nome || 'N/A'}`);
        console.log(`  Status Vinculação: ${vinc.statusEntrega}`);
        console.log(`  ID Vinculação: ${vinc.id}`);
      } else {
        console.log(`  ❌ SEM VINCULAÇÃO ATIVA`);
      }
      console.log('');
    });

    console.log('✅ LISTAGEM CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listar();
