require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO AGENDAMENTOS DOS PROJETOS ===\n');

    // 1. TABLETS - Remover agendamentos (todos já entregues)
    const tablets = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TABLETS' } },
    });

    if (tablets) {
      console.log(`📱 ${tablets.nome} (ID: ${tablets.id})`);
      
      // Buscar equipamentos com statusProcesso "Agendado para Entrega"
      const equipamentosAgendadosTablets = await prisma.equipamento.findMany({
        where: {
          projetoId: tablets.id,
          statusProcesso: 'Agendado para Entrega',
        },
      });

      console.log(`   Equipamentos "Agendado para Entrega": ${equipamentosAgendadosTablets.length}`);

      if (equipamentosAgendadosTablets.length > 0) {
        // Atualizar para "Softwares Instalados" (já que não tem agendamento)
        await prisma.equipamento.updateMany({
          where: {
            id: { in: equipamentosAgendadosTablets.map(e => e.id) },
          },
          data: {
            statusProcesso: 'Softwares Instalados',
          },
        });
        console.log(`   ✓ ${equipamentosAgendadosTablets.length} equipamentos atualizados`);
      } else {
        console.log(`   ✓ Nenhum equipamento para corrigir`);
      }
      console.log('');
    }

    // 2. DESKTOP - Remover agendamentos (projeto não iniciou)
    const desktop = await prisma.projeto.findFirst({
      where: { nome: { contains: 'DESKTOP' } },
    });

    if (desktop) {
      console.log(`🖥️  ${desktop.nome} (ID: ${desktop.id})`);
      
      const equipamentosAgendadosDesktop = await prisma.equipamento.findMany({
        where: {
          projetoId: desktop.id,
          statusProcesso: 'Agendado para Entrega',
        },
      });

      console.log(`   Equipamentos "Agendado para Entrega": ${equipamentosAgendadosDesktop.length}`);

      if (equipamentosAgendadosDesktop.length > 0) {
        await prisma.equipamento.updateMany({
          where: {
            id: { in: equipamentosAgendadosDesktop.map(e => e.id) },
          },
          data: {
            statusProcesso: 'Softwares Instalados',
          },
        });
        console.log(`   ✓ ${equipamentosAgendadosDesktop.length} equipamentos atualizados`);
      } else {
        console.log(`   ✓ Nenhum equipamento para corrigir`);
      }
      console.log('');
    }

    // 3. LAPTOP - Remover equipamento 685C9H4 dos agendados (se não tiver vinculação PENDENTE)
    const laptop = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    if (laptop) {
      console.log(`💻 ${laptop.nome} (ID: ${laptop.id})`);
      
      // Buscar equipamento 685C9H4
      const equipamento685 = await prisma.equipamento.findFirst({
        where: {
          projetoId: laptop.id,
          serialNumber: '685C9H4',
        },
        include: {
          vinculacoes: {
            where: { ativa: true },
          },
        },
      });

      if (equipamento685) {
        console.log(`   Equipamento 685C9H4 encontrado`);
        console.log(`   StatusProcesso: ${equipamento685.statusProcesso}`);
        console.log(`   Vinculações ativas: ${equipamento685.vinculacoes.length}`);

        // Verificar se tem vinculação PENDENTE
        const temVinculacaoPendente = equipamento685.vinculacoes.some(v => v.statusEntrega === 'PENDENTE');

        if (!temVinculacaoPendente && equipamento685.statusProcesso === 'Agendado para Entrega') {
          // Atualizar para "Softwares Instalados"
          await prisma.equipamento.update({
            where: { id: equipamento685.id },
            data: {
              statusProcesso: 'Softwares Instalados',
            },
          });
          console.log(`   ✓ Equipamento 685C9H4 atualizado para "Softwares Instalados"`);
        } else if (temVinculacaoPendente) {
          console.log(`   ✓ Equipamento 685C9H4 tem vinculação PENDENTE - mantido como "Agendado para Entrega"`);
        } else {
          console.log(`   ✓ Equipamento 685C9H4 já está correto`);
        }
      } else {
        console.log(`   ⚠️  Equipamento 685C9H4 não encontrado`);
      }
      console.log('');

      // Verificar quantos agendados restam no LAPTOP
      const agendadosLaptop = await prisma.equipamento.count({
        where: {
          projetoId: laptop.id,
          statusProcesso: 'Agendado para Entrega',
        },
      });

      console.log(`   Total de agendados no LAPTOP: ${agendadosLaptop}`);
    }

    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
