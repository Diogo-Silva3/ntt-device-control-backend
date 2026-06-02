const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('🔍 Verificando equipamentos agendados do projeto de celulares...\n');

    // 1. Encontrar o projeto de celulares
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

    // 2. Contar equipamentos por statusProcesso
    const statusCounts = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' }
      },
      _count: { statusProcesso: true }
    });

    console.log('📊 Distribuição por statusProcesso:\n');
    statusCounts.forEach(item => {
      console.log(`${item.statusProcesso}: ${item._count.statusProcesso}`);
    });

    // 3. Contar especificamente "Agendado para Entrega"
    const agendados = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega'
      }
    });

    console.log(`\n📅 Equipamentos com statusProcesso "Agendado para Entrega": ${agendados}`);

    // 4. Listar alguns equipamentos agendados
    if (agendados > 0) {
      console.log('\n📋 Amostra de equipamentos agendados:\n');
      const equipamentosAgendados = await prisma.equipamento.findMany({
        where: {
          projetoId: projeto.id,
          tipo: { contains: 'CELULAR', mode: 'insensitive' },
          statusProcesso: 'Agendado para Entrega'
        },
        include: {
          tecnico: true,
          unidade: true,
          vinculacoes: {
            where: { ativa: true },
            include: { usuario: true }
          }
        },
        take: 5
      });

      equipamentosAgendados.forEach((eq, index) => {
        console.log(`${index + 1}. ${eq.serialNumber}`);
        console.log(`   Marca: ${eq.marca}`);
        console.log(`   Modelo: ${eq.modelo}`);
        console.log(`   Técnico: ${eq.tecnico ? eq.tecnico.nome : 'N/A'}`);
        console.log(`   Unidade: ${eq.unidade ? eq.unidade.nome : 'N/A'}`);
        console.log(`   Vinculações ativas: ${eq.vinculacoes.length}`);
        if (eq.vinculacoes.length > 0) {
          eq.vinculacoes.forEach(v => {
            console.log(`     - ${v.usuario.nome} (Status: ${v.statusEntrega})`);
          });
        }
        console.log('');
      });
    } else {
      console.log('\n⚠️  Nenhum equipamento com statusProcesso "Agendado para Entrega"');
      console.log('\nVerificando equipamentos com vinculações PENDENTES...\n');

      const comVinculacaoPendente = await prisma.equipamento.findMany({
        where: {
          projetoId: projeto.id,
          tipo: { contains: 'CELULAR', mode: 'insensitive' },
          vinculacoes: {
            some: {
              ativa: true,
              statusEntrega: 'PENDENTE'
            }
          }
        },
        include: {
          tecnico: true,
          unidade: true,
          vinculacoes: {
            where: { ativa: true, statusEntrega: 'PENDENTE' }
          }
        },
        take: 5
      });

      console.log(`Equipamentos com vinculação PENDENTE: ${comVinculacaoPendente.length}\n`);
      
      if (comVinculacaoPendente.length > 0) {
        console.log('📋 Amostra:\n');
        comVinculacaoPendente.forEach((eq, index) => {
          console.log(`${index + 1}. ${eq.serialNumber}`);
          console.log(`   Status Processo: ${eq.statusProcesso}`);
          console.log(`   Técnico: ${eq.tecnico ? eq.tecnico.nome : 'N/A'}`);
          console.log(`   Unidade: ${eq.unidade ? eq.unidade.nome : 'N/A'}`);
          console.log(`   Vinculações PENDENTES: ${eq.vinculacoes.length}`);
          console.log('');
        });
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
