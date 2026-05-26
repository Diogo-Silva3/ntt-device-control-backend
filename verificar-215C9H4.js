const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando equipamento 215C9H4\n');

    const eq = await prisma.equipamento.findFirst({
      where: { serialNumber: '215C9H4' },
      include: {
        vinculacoes: true,
        empresa: true,
        projeto: true
      }
    });

    if (!eq) {
      console.log('❌ Equipamento não encontrado');
      return;
    }

    console.log(`Serial: ${eq.serialNumber}`);
    console.log(`Marca/Modelo: ${eq.marca} ${eq.modelo}`);
    console.log(`Status: ${eq.status}`);
    console.log(`StatusProcesso: ${eq.statusProcesso}`);
    console.log(`Empresa: ${eq.empresa?.nome}`);
    console.log(`Projeto: ${eq.projeto?.nome}\n`);

    console.log(`Vinculações (total: ${eq.vinculacoes.length}):`);
    eq.vinculacoes.forEach((v, idx) => {
      console.log(`  ${idx + 1}. ID: ${v.id}`);
      console.log(`     StatusEntrega: ${v.statusEntrega}`);
      console.log(`     Ativa: ${v.ativa}`);
      console.log(`     TecnicoId: ${v.tecnicoId}`);
      console.log(`     UsuarioId: ${v.usuarioId}`);
    });

    console.log('\n⚠️ PROBLEMA: Este equipamento tem statusProcesso "Agendado para Entrega"');
    console.log('   mas sua vinculação NÃO tem statusEntrega = "PENDENTE"');

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
