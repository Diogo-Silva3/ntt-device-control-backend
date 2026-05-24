const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listarAgendados() {
  try {
    console.log('🔍 Listando todos os equipamentos com statusProcesso: "Agendado para Entrega"\n');

    const agendados = await prisma.equipamento.findMany({
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
        status: true,
        empresaId: true,
        projetoId: true,
        unidadeId: true,
        vinculacoes: {
          where: { ativa: true },
          select: {
            id: true,
            statusEntrega: true,
            usuario: { select: { nome: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total encontrado: ${agendados.length}\n`);

    agendados.forEach((eq, idx) => {
      console.log(`${idx + 1}. Serial: ${eq.serialNumber}`);
      console.log(`   Marca/Modelo: ${eq.marca} ${eq.modelo}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   StatusProcesso: ${eq.statusProcesso}`);
      console.log(`   EmpresaId: ${eq.empresaId}, ProjetoId: ${eq.projetoId}`);
      console.log(`   Vinculações ativas: ${eq.vinculacoes.length}`);
      eq.vinculacoes.forEach(v => {
        console.log(`     - ${v.usuario.nome} (StatusEntrega: ${v.statusEntrega})`);
      });
      console.log();
    });

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

listarAgendados();
