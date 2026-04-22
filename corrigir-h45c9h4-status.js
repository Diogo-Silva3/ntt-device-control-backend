require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO STATUS DO EQUIPAMENTO H45C9H4 ===\n');

    // Buscar o equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: true,
            tecnico: true,
          },
        },
      },
    });

    if (!equipamento) {
      console.log('❌ Equipamento H45C9H4 não encontrado!');
      return;
    }

    console.log('📋 Estado atual:');
    console.log(`   Serial: ${equipamento.serialNumber}`);
    console.log(`   Status: ${equipamento.status}`);
    console.log(`   StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`   Vinculações ativas: ${equipamento.vinculacoes.length}\n`);

    if (equipamento.vinculacoes.length > 0) {
      equipamento.vinculacoes.forEach(v => {
        console.log(`   Vinculação ID ${v.id}:`);
        console.log(`     Usuário: ${v.usuario?.nome || 'N/A'}`);
        console.log(`     Técnico: ${v.tecnico?.nome || 'N/A'}`);
        console.log(`     Status Entrega: ${v.statusEntrega}\n`);
      });
    }

    // Atualizar status para EM_USO
    if (equipamento.status === 'DISPONIVEL') {
      await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { status: 'EM_USO' },
      });

      console.log('✅ Status atualizado de DISPONIVEL para EM_USO!');
      console.log('   StatusProcesso mantido como: Agendado para Entrega\n');
    } else {
      console.log(`ℹ️  Status já é ${equipamento.status}, nenhuma alteração necessária.\n`);
    }

    // Verificar contadores após a correção
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    const [disponiveis, agendados, entregues] = await Promise.all([
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
      prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
        },
      }),
    ]);

    console.log('📊 CONTADORES APÓS CORREÇÃO:');
    console.log(`   DISPONÍVEIS: ${disponiveis} (deveria ser 145)`);
    console.log(`   AGENDADOS: ${agendados} (deveria ser 1)`);
    console.log(`   ENTREGUES: ${entregues} (deveria ser 34)`);
    console.log(`   FALTAM ENTREGAR: ${disponiveis} (deveria ser 145)\n`);

    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('⚠️  IMPORTANTE: Reinicie o backend com: pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
