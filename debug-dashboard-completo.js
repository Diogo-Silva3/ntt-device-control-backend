const prisma = require('./src/config/prisma');

const debug = async () => {
  try {
    console.log('Debugando dashboard completo...\n');
    
    const empresaId = 1; // BIMBO BRASIL
    const projetoId = 1; // TECH REFRESH LAPTOP
    
    console.log('📊 EQUIPAMENTOS POR STATUS PROCESSO:');
    const porProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: { empresaId, projetoId },
      _count: true
    });
    
    let total = 0;
    porProcesso.forEach(p => {
      console.log(`   ${p.statusProcesso}: ${p._count}`);
      total += p._count;
    });
    console.log(`   TOTAL: ${total}\n`);
    
    // Verificar o que o dashboard está contando
    console.log('📋 O QUE O DASHBOARD CONTA:');
    
    // emPreparacao
    const emPreparacao = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados', 'Asset Registrado'] }
      }
    });
    console.log(`   Em Preparação (Imagem Instalada + Softwares + Asset): ${emPreparacao}`);
    
    // aguardandoImagem
    const aguardandoImagem = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Novo'
      }
    });
    console.log(`   Aguardando Imagem (Novo): ${aguardandoImagem}`);
    
    // agendados
    const agendados = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega'
      }
    });
    console.log(`   Agendados (Agendado para Entrega): ${agendados}`);
    
    // entregues
    const entregues = await prisma.equipamento.count({
      where: {
        empresaId,
        projetoId,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] }
      }
    });
    console.log(`   Entregues (Entregue + Em Uso): ${entregues}`);
    
    console.log(`\n   SOMA: ${emPreparacao} + ${aguardandoImagem} + ${agendados} + ${entregues} = ${emPreparacao + aguardandoImagem + agendados + entregues}`);
    
    console.log('\n❓ PROBLEMA:');
    console.log(`   Dashboard mostra no topo: Agendadas=42, Entregas=59, Atribuído=59`);
    console.log(`   Mas deveria ser: Agendadas=${agendados}, Entregas=${entregues}`);
    console.log(`   E o 55 (Novo) não está sendo contado em nenhum lugar!`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await prisma.$disconnect();
  }
};

debug();
