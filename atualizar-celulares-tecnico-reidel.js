const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function atualizarCelulares() {
  try {
    console.log('🔄 Atualizando todos os celulares com Reidel como técnico responsável...\n');

    // 1. Encontrar o técnico Reidel
    const reidel = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'REIDEL', mode: 'insensitive' },
        role: 'TECNICO'
      }
    });

    if (!reidel) {
      console.log('❌ Técnico Reidel não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Técnico encontrado: ${reidel.nome} (ID: ${reidel.id})\n`);

    // 2. Encontrar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto encontrado: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 3. Contar equipamentos antes da atualização
    const equipamentosBefore = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    console.log(`📊 Equipamentos no projeto: ${equipamentosBefore}\n`);

    // 4. Atualizar todos os equipamentos do projeto de celulares
    const resultado = await prisma.equipamento.updateMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      data: {
        tecnicoId: reidel.id
      }
    });

    console.log(`✅ ATUALIZAÇÃO CONCLUÍDA!\n`);
    console.log(`📈 Equipamentos atualizados: ${resultado.count}`);
    console.log(`👤 Técnico responsável: ${reidel.nome}`);
    console.log(`📱 Projeto: ${projeto.nome}\n`);

    // 5. Verificar alguns equipamentos para confirmar
    const equipamentosAtualizados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      include: {
        tecnico: true,
        unidade: true
      },
      take: 5
    });

    console.log('📋 Amostra de equipamentos atualizados:\n');
    equipamentosAtualizados.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Marca: ${eq.marca}`);
      console.log(`   Modelo: ${eq.modelo}`);
      console.log(`   Técnico: ${eq.tecnico ? eq.tecnico.nome : 'N/A'}`);
      console.log(`   Unidade: ${eq.unidade ? eq.unidade.nome : 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarCelulares();
