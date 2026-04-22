require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function atualizar() {
  try {
    console.log('=== ATUALIZANDO TÉCNICOS DAS VINCULAÇÕES ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar os técnicos Diego, Pedro, Lucas, Andre
    const tecnicos = await prisma.usuario.findMany({
      where: {
        nome: {
          in: ['Diego', 'Pedro', 'Lucas', 'Andre'],
        },
        role: { in: ['TECNICO', 'ADMIN'] },
      },
    });

    console.log(`👥 Técnicos encontrados: ${tecnicos.length}`);
    tecnicos.forEach(t => console.log(`   - ${t.nome} (ID: ${t.id})`));
    console.log('');

    if (tecnicos.length === 0) {
      console.log('⚠️  Nenhum técnico encontrado com esses nomes');
      
      // Buscar técnicos com nomes parecidos
      const tecnicosSimilares = await prisma.usuario.findMany({
        where: {
          OR: [
            { nome: { contains: 'DIEGO' } },
            { nome: { contains: 'PEDRO' } },
            { nome: { contains: 'LUCAS' } },
            { nome: { contains: 'ANDRE' } },
          ],
          role: { in: ['TECNICO', 'ADMIN'] },
        },
      });

      console.log(`\nTécnicos com nomes similares: ${tecnicosSimilares.length}`);
      tecnicosSimilares.forEach(t => console.log(`   - ${t.nome} (ID: ${t.id})`));
      
      if (tecnicosSimilares.length > 0) {
        console.log('\nVou usar esses técnicos...\n');
        tecnicos.push(...tecnicosSimilares);
      }
    }

    if (tecnicos.length === 0) {
      console.log('❌ Não foi possível encontrar os técnicos');
      return;
    }

    // Buscar as 6 últimas vinculações criadas (as que acabei de criar)
    const vinculacoesRecentes = await prisma.vinculacao.findMany({
      where: {
        equipamento: { projetoId: projeto.id },
        observacao: 'Vinculação criada automaticamente para recuperação de dados',
      },
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { serialNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    console.log(`📋 Vinculações a atualizar: ${vinculacoesRecentes.length}\n`);

    // Distribuir as vinculações entre os técnicos
    for (let i = 0; i < vinculacoesRecentes.length; i++) {
      const vinc = vinculacoesRecentes[i];
      const tecnico = tecnicos[i % tecnicos.length]; // Distribui de forma circular

      await prisma.vinculacao.update({
        where: { id: vinc.id },
        data: { tecnicoId: tecnico.id },
      });

      console.log(`${i + 1}. ✓ ${vinc.usuario.nome} → ${vinc.equipamento.serialNumber}`);
      console.log(`   Técnico: ${tecnico.nome}`);
    }

    console.log(`\n✅ ${vinculacoesRecentes.length} vinculações atualizadas!`);
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

atualizar();
