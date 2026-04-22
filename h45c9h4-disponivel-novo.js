require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO H45C9H4 PARA DISPONIVEL + NOVO ===\n');

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
    console.log(`   Status ANTES: ${equipamento.status}`);
    console.log(`   StatusProcesso ANTES: ${equipamento.statusProcesso}\n`);

    // Mudar para DISPONIVEL + statusProcesso "Novo"
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { 
        status: 'DISPONIVEL',
        statusProcesso: 'Novo',
      },
    });

    console.log('✅ Status mudado para DISPONIVEL!\n');
    console.log('✅ StatusProcesso mudado para Novo!\n');

    // Verificar contadores finais
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [
      totalProjeto,
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
        },
      }),
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
    console.log(`   TOTAL PROJETO: ${totalProjeto} (esperado: 180) ${totalProjeto === 180 ? '✅' : '❌'}`);
    console.log(`   EM USO: ${emUso} (esperado: 34) ${emUso === 34 ? '✅' : '❌'}`);
    console.log(`   DISPONÍVEIS: ${disponiveis} (esperado: 146) ${disponiveis === 146 ? '✅' : '❌'}`);
    console.log(`   AGENDADAS: ${agendados} (esperado: 0) ${agendados === 0 ? '✅' : '❌'}`);
    console.log(`   ATRIBUÍDO: ${atribuido} (esperado: 34) ${atribuido === 34 ? '✅' : '❌'}`);
    console.log(`   FALTAM ENTREGAR: ${faltamEntregar} (esperado: 146) ${faltamEntregar === 146 ? '✅' : '❌'}`);
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
