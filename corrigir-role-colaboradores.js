const prisma = require('./src/config/prisma');

const corrigir = async () => {
  try {
    console.log('Corrigindo role de técnicos sem senha para COLABORADOR...\n');
    
    // Contar quantos vão ser atualizados
    const quantosAtualizar = await prisma.usuario.count({
      where: {
        role: 'TECNICO',
        senha: null,
      }
    });
    console.log(`Vão ser atualizados: ${quantosAtualizar} usuários\n`);
    
    // Atualizar
    const resultado = await prisma.usuario.updateMany({
      where: {
        role: 'TECNICO',
        senha: null,
      },
      data: {
        role: 'COLABORADOR',
      }
    });
    
    console.log(`✅ Atualizado com sucesso: ${resultado.count} usuários\n`);
    
    // Verificar novo breakdown
    console.log('Novo breakdown por role:');
    const roles = await prisma.usuario.groupBy({
      by: ['role'],
      _count: true,
    });
    roles.forEach(r => {
      console.log(`   ${r.role}: ${r._count}`);
    });
    
    // Verificar novo total de colaboradores
    const novoTotalColab = await prisma.usuario.count({
      where: {
        role: 'COLABORADOR',
        ativo: true,
      }
    });
    console.log(`\nTotal de colaboradores ATIVOS agora: ${novoTotalColab}`);
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

corrigir();
