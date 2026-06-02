const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comparar() {
  try {
    console.log('🔍 Comparando todos os técnicos do projeto de celulares...\n');

    // Buscar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: 'TECH REFRESH CELULARES 2026'
      }
    });

    if (!projeto) {
      console.log('❌ Projeto não encontrado');
      return;
    }

    // Buscar todos os técnicos vinculados ao projeto
    const tecnicos = await prisma.usuario.findMany({
      where: {
        projetoId: projeto.id,
        role: 'TECNICO'
      },
      include: {
        unidade: true,
        projeto: true
      }
    });

    console.log(`📊 Total de técnicos no projeto: ${tecnicos.length}\n`);

    if (tecnicos.length > 0) {
      console.table(tecnicos.map(t => ({
        ID: t.id,
        Nome: t.nome,
        Email: t.email,
        Ativo: t.ativo,
        UnidadeID: t.unidadeId,
        Unidade: t.unidade?.nome || 'SEM UNIDADE',
        ProjetoID: t.projetoId,
        Projeto: t.projeto?.nome || 'SEM PROJETO'
      })));
    } else {
      console.log('❌ Nenhum técnico encontrado');
    }

    // Verificar especificamente o Reidel
    console.log('\n🔎 Verificando Reidel especificamente:\n');
    const reidel = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'REIDEL', mode: 'insensitive' }
      },
      include: {
        unidade: true,
        projeto: true
      }
    });

    if (reidel) {
      console.log(`Nome: ${reidel.nome}`);
      console.log(`Ativo: ${reidel.ativo}`);
      console.log(`Role: ${reidel.role}`);
      console.log(`ProjetoID: ${reidel.projetoId}`);
      console.log(`Projeto: ${reidel.projeto?.nome}`);
      console.log(`UnidadeID: ${reidel.unidadeId}`);
      console.log(`Unidade: ${reidel.unidade?.nome}`);
      
      // Verificar se está na lista
      const estaLista = tecnicos.some(t => t.id === reidel.id);
      console.log(`\n✅ Está na lista de técnicos do projeto: ${estaLista ? 'SIM' : 'NÃO'}`);
    }

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

comparar();
