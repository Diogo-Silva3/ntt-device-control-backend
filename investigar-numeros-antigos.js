const prisma = require('./src/config/prisma');

const investigar = async () => {
  try {
    console.log('Investigando de onde vieram os números antigos (42, 59, 59)...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 1; // TECH REFRESH LAPTOP
    
    console.log('🔍 PROCURANDO POR 42 (Agendadas antigo):');
    
    // 42 pode ser:
    const agendadosComImagem = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: { in: ['Imagem Instalada', 'Agendado para Entrega'] }
      }
    });
    console.log(`   Imagem Instalada + Agendado: ${agendadosComImagem}`);
    
    const agendadosComSoftware = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: { in: ['Softwares Instalados', 'Agendado para Entrega'] }
      }
    });
    console.log(`   Softwares Instalados + Agendado: ${agendadosComSoftware}`);
    
    const agendadosComAsset = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: { in: ['Asset Registrado', 'Agendado para Entrega'] }
      }
    });
    console.log(`   Asset Registrado + Agendado: ${agendadosComAsset}`);
    
    console.log('\n🔍 PROCURANDO POR 59 (Entregas antigo):');
    
    // 59 pode ser:
    const entreguesComVinculacao = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'ENTREGUE',
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   Vinculações ENTREGUE (todas): ${entreguesComVinculacao}`);
    
    const entreguesAtivas = await prisma.vinculacao.count({
      where: {
        statusEntrega: 'ENTREGUE',
        ativa: true,
        equipamento: { empresaId, projetoId }
      }
    });
    console.log(`   Vinculações ENTREGUE (ativas): ${entreguesAtivas}`);
    
    const entreguesEquipamento = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });
    console.log(`   Equipamentos Entregue + Em Uso: ${entreguesEquipamento}`);
    
    console.log('\n📊 RESUMO:');
    console.log(`   42 pode ser: ${agendadosComImagem} (Imagem + Agendado)?`);
    console.log(`   59 pode ser: ${entreguesComVinculacao} (Vinculações ENTREGUE)?`);
    console.log(`   59 pode ser: ${entreguesEquipamento} (Equipamentos Entregue)?`);
    
    // Verificar se há equipamentos com statusProcesso vazio ou null
    console.log('\n⚠️ VERIFICANDO ANOMALIAS:');
    const comStatusNull = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: null
      }
    });
    console.log(`   Equipamentos com statusProcesso NULL: ${comStatusNull}`);
    
    const comStatusVazio = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        statusProcesso: ''
      }
    });
    console.log(`   Equipamentos com statusProcesso vazio: ${comStatusVazio}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

investigar();
