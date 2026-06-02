const prisma = require('./src/config/prisma');

const verificar = async () => {
  try {
    console.log('Verificando números FINAIS e CORRETOS...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 1; // TECH REFRESH LAPTOP
    
    console.log('📊 NÚMEROS QUE DEVEM APARECER NO DASHBOARD:\n');
    
    // Total
    const total = await prisma.equipamento.count({
      where: { empresaId, projetoId }
    });
    console.log(`1️⃣ TOTAL DO PROJETO: ${total}`);
    
    // Aguardando Imagem
    const aguardandoImagem = await prisma.equipamento.count({
      where: { empresaId, projetoId, statusProcesso: 'Novo' }
    });
    console.log(`2️⃣ AGUARDANDO IMAGEM (Novo): ${aguardandoImagem}`);
    
    // Com Imagem
    const comImagem = await prisma.equipamento.count({
      where: { empresaId, projetoId, statusProcesso: 'Softwares Instalados' }
    });
    console.log(`3️⃣ COM IMAGEM (Softwares Instalados): ${comImagem}`);
    
    // Agendadas
    const agendadas = await prisma.equipamento.count({
      where: { empresaId, projetoId, statusProcesso: 'Agendado para Entrega' }
    });
    console.log(`4️⃣ AGENDADAS (Agendado para Entrega): ${agendadas}`);
    
    // Entregas
    const entregas = await prisma.equipamento.count({
      where: { empresaId, projetoId, statusProcesso: 'Entregue ao Usuário' }
    });
    console.log(`5️⃣ ENTREGAS (Entregue ao Usuário): ${entregas}`);
    
    // Atribuído (vinculações ativas)
    const atribuido = await prisma.vinculacao.count({
      where: {
        ativa: true,
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`6️⃣ ATRIBUÍDO (Vinculações ativas): ${atribuido}`);
    
    console.log('\n✅ RESUMO FINAL:');
    console.log(`   Total: ${total}`);
    console.log(`   Aguardando Imagem: ${aguardandoImagem}`);
    console.log(`   Com Imagem: ${comImagem}`);
    console.log(`   Agendadas: ${agendadas}`);
    console.log(`   Entregas: ${entregas}`);
    console.log(`   Atribuído: ${atribuido}`);
    console.log(`   SOMA: ${aguardandoImagem} + ${comImagem} + ${agendadas} + ${entregas} = ${aguardandoImagem + comImagem + agendadas + entregas}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

verificar();
