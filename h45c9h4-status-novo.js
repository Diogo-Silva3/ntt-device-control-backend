require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== MUDANDO H45C9H4 STATUSPROCESSO PARA NOVO ===\n');

    // Buscar o equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
    });

    if (!equipamento) {
      console.log('❌ Equipamento não encontrado!');
      return;
    }

    console.log('📋 Equipamento encontrado:');
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Status: ${equipamento.status}`);
    console.log(`   StatusProcesso ANTES: ${equipamento.statusProcesso}\n`);

    // Mudar statusProcesso para "Novo" (não será contado em AGENDADAS nem FALTAM ENTREGAR)
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { statusProcesso: 'Novo' },
    });

    console.log('✅ StatusProcesso mudado para Novo!\n');

    // Verificar contadores finais
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [
      emUso,
      disponiveis,
      agendados,
      atribuido,
      faltamEntregar,
      comImagem,
    ] = await Promise.all([
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'DISPONIVEL',
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: 'Agendado para Entrega',
        },
      }),
      prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { projetoId: projeto.id },
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: 'DISPONIVEL',
        },
      }),
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados'] },
        },
      }),
    ]);

    console.log('📊 CONTADORES FINAIS:');
    console.log(`   EM USO: ${emUso} (esperado: 34) ${emUso === 34 ? '✅' : '❌'}`);
    console.log(`   DISPONÍVEIS: ${disponiveis} (esperado: 145) ${disponiveis === 145 ? '✅' : '❌'}`);
    console.log(`   AGENDADAS: ${agendados} (esperado: 0) ${agendados === 0 ? '✅' : '❌'}`);
    console.log(`   ATRIBUÍDO: ${atribuido} (esperado: 34) ${atribuido === 34 ? '✅' : '❌'}`);
    console.log(`   FALTAM ENTREGAR: ${faltamEntregar} (esperado: 145) ${faltamEntregar === 145 ? '✅' : '❌'}`);
    console.log(`   COM IMAGEM (Ciclo): ${comImagem} (esperado: 145) ${comImagem === 145 ? '✅' : '❌'}\n`);

    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
