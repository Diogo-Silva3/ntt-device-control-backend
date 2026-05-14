require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    // Buscar projeto BIMBO
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    if (!projeto) {
      console.log('❌ Projeto BIMBO não encontrado');
      return;
    }

    console.log(`\n📊 Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Contar equipamentos
    const total = await prisma.equipamento.count({
      where: { projetoId: projeto.id }
    });

    const comTecnico = await prisma.equipamento.count({
      where: { projetoId: projeto.id, tecnicoId: { not: null } }
    });

    const semTecnico = total - comTecnico;

    console.log(`Total de equipamentos: ${total}`);
    console.log(`✅ Com técnico atribuído: ${comTecnico}`);
    console.log(`❌ SEM técnico atribuído: ${semTecnico}\n`);

    // Listar técnicos do projeto
    const tecnicos = await prisma.usuario.findMany({
      where: {
        role: 'TECNICO',
        empresaId: projeto.empresaId
      },
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            equipamentos: {
              where: { projetoId: projeto.id }
            }
          }
        }
      }
    });

    console.log(`👥 Técnicos da empresa (${tecnicos.length}):`);
    tecnicos.forEach(t => {
      console.log(`   - ${t.nome}: ${t._count.equipamentos} equipamentos`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
