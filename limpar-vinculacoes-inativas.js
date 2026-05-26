const prisma = require('./src/config/prisma');

const limpar = async () => {
  try {
    console.log('Limpando vinculações inativas...\n');
    
    // Contar quantas inativas tem
    const totalInativas = await prisma.vinculacao.count({
      where: { ativa: false }
    });
    
    console.log(`Total de vinculações inativas: ${totalInativas}`);
    
    if (totalInativas === 0) {
      console.log('✅ Nenhuma vinculação inativa para remover');
      return;
    }
    
    // Mostrar algumas antes de deletar
    console.log('\nExemplos de vinculações inativas que serão removidas:');
    const exemplos = await prisma.vinculacao.findMany({
      where: { ativa: false },
      include: { equipamento: true, usuario: true },
      take: 5
    });
    
    exemplos.forEach((v, i) => {
      console.log(`${i+1}. Equipamento: ${v.equipamento?.serialNumber}, Usuário: ${v.usuario?.nome}, Status: ${v.statusEntrega}`);
    });
    
    // Deletar todas as inativas
    console.log(`\nDeletando ${totalInativas} vinculações inativas...`);
    const resultado = await prisma.vinculacao.deleteMany({
      where: { ativa: false }
    });
    
    console.log(`✅ Deletadas: ${resultado.count} vinculações inativas`);
    
    // Verificar quantas ativas sobraram
    const totalAtivas = await prisma.vinculacao.count({
      where: { ativa: true }
    });
    
    console.log(`\n✅ Vinculações ativas restantes: ${totalAtivas}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

limpar();
