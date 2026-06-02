const { PrismaClient } = require('@prisma/client');

// Criar cliente Prisma conectado à VPS
const prismaVPS = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:TechRefresh2026!@187.127.8.112:5432/tech_refresh'
    }
  }
});

async function sincronizarCelulares() {
  try {
    console.log('🔄 Sincronizando celulares com Reidel como técnico responsável na VPS...\n');

    // 1. Encontrar o técnico Reidel
    const reidel = await prismaVPS.usuario.findFirst({
      where: {
        nome: { contains: 'REIDEL', mode: 'insensitive' },
        role: 'TECNICO'
      }
    });

    if (!reidel) {
      console.log('❌ Técnico Reidel não encontrado na VPS');
      await prismaVPS.$disconnect();
      return;
    }

    console.log(`✅ Técnico encontrado na VPS: ${reidel.nome} (ID: ${reidel.id})\n`);

    // 2. Encontrar o projeto de celulares
    const projeto = await prismaVPS.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado na VPS');
      await prismaVPS.$disconnect();
      return;
    }

    console.log(`✅ Projeto encontrado na VPS: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 3. Contar equipamentos antes
    const equipamentosBefore = await prismaVPS.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    console.log(`📊 Equipamentos no projeto: ${equipamentosBefore}\n`);

    // 4. Atualizar todos os celulares
    const resultado = await prismaVPS.equipamento.updateMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      data: {
        tecnicoId: reidel.id
      }
    });

    console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA NA VPS!\n`);
    console.log(`📈 Equipamentos atualizados: ${resultado.count}`);
    console.log(`👤 Técnico responsável: ${reidel.nome}`);
    console.log(`📱 Projeto: ${projeto.nome}\n`);

    // 5. Verificar alguns equipamentos
    const equipamentosAtualizados = await prismaVPS.equipamento.findMany({
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

    console.log('📋 Amostra de equipamentos sincronizados:\n');
    equipamentosAtualizados.forEach((eq, index) => {
      console.log(`${index + 1}. ${eq.serialNumber}`);
      console.log(`   Marca: ${eq.marca}`);
      console.log(`   Modelo: ${eq.modelo}`);
      console.log(`   Técnico: ${eq.tecnico ? eq.tecnico.nome : 'N/A'}`);
      console.log(`   Unidade: ${eq.unidade ? eq.unidade.nome : 'N/A'}`);
      console.log('');
    });

    await prismaVPS.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prismaVPS.$disconnect();
    process.exit(1);
  }
}

sincronizarCelulares();
