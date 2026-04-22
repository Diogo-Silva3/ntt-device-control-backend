require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== MARCANDO H45C9H4 COMO DESCARTADO ===\n');

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
    console.log(`   Status ANTES: ${equipamento.status}\n`);

    // Marcar como DESCARTADO
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { status: 'DESCARTADO' },
    });

    console.log('✅ Equipamento marcado como DESCARTADO!\n');

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
      totalProjeto,
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
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
        },
      }),
    ]);

    console.log('📊 CONTADORES FINAIS:');
    console.log(`   TOTAL PROJETO: ${totalProjeto} (esperado: 179)`);
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
