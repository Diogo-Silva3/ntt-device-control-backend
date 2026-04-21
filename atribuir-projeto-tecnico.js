// Conectar diretamente ao Prisma sem carregar o servidor
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Buscar técnico PEDRO SEVERO
    const tecnico = await prisma.usuario.findFirst({
      where: { nome: { contains: 'PEDRO', mode: 'insensitive' } },
      select: { id: true, nome: true, email: true, projetoId: true }
    });
    console.log('Técnico encontrado:', tecnico);
    
    // Buscar projeto TECH REFRESH
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH', mode: 'insensitive' } },
      select: { id: true, nome: true }
    });
    console.log('Projeto encontrado:', projeto);
    
    if (!tecnico) {
      console.error('Técnico não encontrado');
      process.exit(1);
    }
    
    if (!projeto) {
      console.error('Projeto não encontrado');
      process.exit(1);
    }
    
    // Atribuir projeto ao técnico
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: tecnico.id },
      data: { projetoId: projeto.id },
      include: { projeto: true }
    });
    
    console.log('\n✓ Projeto atribuído com sucesso!');
    console.log('Técnico:', usuarioAtualizado.nome);
    console.log('Projeto:', usuarioAtualizado.projeto.nome);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
