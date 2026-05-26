// Script para verificar vinculações no banco de dados
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarVinculacoes() {
  try {
    console.log('🔗 Verificando vinculações no banco de dados...\n');

    // Buscar equipamentos com agendamento
    const equipamentos = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Entregue ao Usuário'
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        agendamento: true,
        vinculacoes: {
          where: { ativa: true },
          select: {
            id: true,
            usuarioId: true,
            usuario: { select: { nome: true, email: true } },
            statusEntrega: true,
            ativa: true,
            dataInicio: true,
            dataFim: true
          }
        }
      },
      take: 5
    });

    console.log(`📊 Encontrados ${equipamentos.length} equipamentos em "Entregue ao Usuário"\n`);

    for (const eq of equipamentos) {
      console.log(`\n📦 Equipamento: ${eq.serialNumber} (ID: ${eq.id})`);
      console.log(`   Status: ${eq.statusProcesso}`);
      
      if (eq.agendamento) {
        try {
          const agend = JSON.parse(eq.agendamento);
          console.log(`   Agendamento: ${JSON.stringify(agend, null, 2)}`);
        } catch (e) {
          console.log(`   Agendamento: ${eq.agendamento}`);
        }
      }

      if (eq.vinculacoes.length > 0) {
        console.log(`   ✓ Vinculações ATIVAS: ${eq.vinculacoes.length}`);
        for (const v of eq.vinculacoes) {
          console.log(`     - Usuário: ${v.usuario.nome} (${v.usuario.email})`);
          console.log(`       Status: ${v.statusEntrega}, Ativa: ${v.ativa}`);
          console.log(`       Início: ${v.dataInicio}, Fim: ${v.dataFim}`);
        }
      } else {
        console.log(`   ⚠️ Nenhuma vinculação ativa`);
      }
    }

    // Verificar equipamentos que SAÍRAM de "Entregue ao Usuário"
    console.log('\n\n' + '='.repeat(60));
    console.log('Verificando equipamentos que SAÍRAM de "Entregue ao Usuário"');
    console.log('='.repeat(60));

    const equipamentosForaDe = await prisma.equipamento.findMany({
      where: {
        NOT: {
          statusProcesso: 'Entregue ao Usuário'
        }
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        vinculacoes: {
          select: {
            id: true,
            usuarioId: true,
            usuario: { select: { nome: true } },
            statusEntrega: true,
            ativa: true,
            dataInicio: true,
            dataFim: true
          }
        }
      },
      take: 5
    });

    console.log(`\n📊 Verificando ${equipamentosForaDe.length} equipamentos fora de "Entregue ao Usuário"\n`);

    for (const eq of equipamentosForaDe) {
      const ativas = eq.vinculacoes.filter(v => v.ativa && v.statusEntrega === 'ENTREGUE');
      if (ativas.length > 0) {
        console.log(`\n⚠️ PROBLEMA: ${eq.serialNumber} (ID: ${eq.id})`);
        console.log(`   Status: ${eq.statusProcesso}`);
        console.log(`   Tem ${ativas.length} vinculação(ões) ENTREGUE ATIVA(S) - deveria estar inativa!`);
        for (const v of ativas) {
          console.log(`     - ${v.usuario.nome}: ${v.statusEntrega}`);
        }
      }
    }

    console.log('\n✓ Verificação concluída');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarVinculacoes();
