require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restaurar() {
  try {
    console.log('=== RESTAURANDO H45C9H4 PARA ESTADO ORIGINAL ===\n');

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

    // Restaurar para EM_USO + Agendado para Entrega
    await prisma.equipamento.update({
      where: { id: equipamento.id },
      data: { 
        status: 'EM_USO',
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log('✅ Equipamento restaurado para EM_USO + Agendado para Entrega!\n');

    // Buscar a vinculação
    const vinculacao = await prisma.vinculacao.findFirst({
      where: {
        equipamento: {
          serialNumber: 'H45C9H4',
        },
      },
    });

    if (vinculacao) {
      console.log('📋 Vinculação encontrada:');
      console.log(`   ID: ${vinculacao.id}`);
      console.log(`   Ativa ANTES: ${vinculacao.ativa}`);
      console.log(`   StatusEntrega ANTES: ${vinculacao.statusEntrega}\n`);

      // Reativar e garantir PENDENTE
      await prisma.vinculacao.update({
        where: { id: vinculacao.id },
        data: { 
          ativa: true,
          statusEntrega: 'PENDENTE',
        },
      });

      console.log('✅ Vinculação reativada com statusEntrega PENDENTE!\n');
    }

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

    console.log('📊 CONTADORES APÓS RESTAURAÇÃO:');
    console.log(`   TOTAL PROJETO: ${totalProjeto}`);
    console.log(`   EM USO: ${emUso}`);
    console.log(`   DISPONÍVEIS: ${disponiveis}`);
    console.log(`   AGENDADAS: ${agendados}`);
    console.log(`   ATRIBUÍDO: ${atribuido}`);
    console.log(`   FALTAM ENTREGAR: ${faltamEntregar}`);
    console.log(`   COM IMAGEM (Ciclo): ${comImagem}\n`);

    console.log('✅ RESTAURAÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restaurar();
