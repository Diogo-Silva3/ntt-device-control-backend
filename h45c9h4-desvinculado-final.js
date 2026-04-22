require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO H45C9H4 FINAL ===\n');

    // Buscar a vinculação do H45C9H4
    const vinculacao = await prisma.vinculacao.findFirst({
      where: {
        equipamento: {
          serialNumber: 'H45C9H4',
        },
      },
      include: {
        equipamento: true,
        usuario: true,
      },
    });

    if (!vinculacao) {
      console.log('❌ Vinculação não encontrada!');
      return;
    }

    console.log('📋 Vinculação encontrada:');
    console.log(`   ID: ${vinculacao.id}`);
    console.log(`   Equipamento: ${vinculacao.equipamento.serialNumber}`);
    console.log(`   Usuário: ${vinculacao.usuario.nome}`);
    console.log(`   Ativa ANTES: ${vinculacao.ativa}\n`);

    // Desativar a vinculação
    await prisma.vinculacao.update({
      where: { id: vinculacao.id },
      data: { ativa: false },
    });

    console.log('✅ Vinculação desativada!\n');

    // Garantir que o equipamento está DISPONIVEL e com statusProcesso "Agendado para Entrega"
    await prisma.equipamento.update({
      where: { id: vinculacao.equipamento.id },
      data: { 
        status: 'DISPONIVEL',
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log('✅ Equipamento: status=DISPONIVEL, statusProcesso=Agendado para Entrega!\n');

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
    console.log(`   AGENDADAS: ${agendados} (esperado: 1) ${agendados === 1 ? '✅' : '❌'}`);
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
