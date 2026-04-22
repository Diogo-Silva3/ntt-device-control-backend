require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO EQUIPAMENTOS AGENDADOS INCORRETOS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar equipamentos com "Agendado para Entrega" que têm vinculação ENTREGUE
    const equipamentosIncorretos = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
        vinculacoes: {
          some: {
            ativa: true,
            statusEntrega: 'ENTREGUE',
          },
        },
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: { select: { nome: true } },
            tecnico: { select: { nome: true } },
          },
        },
      },
    });

    console.log(`Equipamentos incorretos encontrados: ${equipamentosIncorretos.length}\n`);

    for (const eq of equipamentosIncorretos) {
      const vinc = eq.vinculacoes[0];
      console.log(`${eq.serialNumber}:`);
      console.log(`  Usuário: ${vinc.usuario.nome}`);
      console.log(`  Técnico: ${vinc.tecnico?.nome || 'N/A'}`);
      console.log(`  Status Vinculação: ${vinc.statusEntrega}`);
      console.log(`  Status Equipamento: ${eq.statusProcesso} → Entregue ao Usuário`);

      await prisma.equipamento.update({
        where: { id: eq.id },
        data: {
          statusProcesso: 'Entregue ao Usuário',
          status: 'EM_USO',
        },
      });

      console.log(`  ✓ Corrigido\n`);
    }

    // Verificar quantos ficaram em "Agendado para Entrega"
    const agendadosRestantes = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        statusProcesso: 'Agendado para Entrega',
      },
    });

    console.log(`\n✅ CORREÇÃO CONCLUÍDA!`);
    console.log(`   ${equipamentosIncorretos.length} equipamentos corrigidos`);
    console.log(`   ${agendadosRestantes} equipamento(s) ainda em "Agendado para Entrega"`);
    
    if (agendadosRestantes === 1) {
      const agendado = await prisma.equipamento.findFirst({
        where: {
          projetoId: projeto.id,
          statusProcesso: 'Agendado para Entrega',
        },
        include: {
          vinculacoes: {
            where: { ativa: true },
            include: {
              usuario: { select: { nome: true } },
              tecnico: { select: { nome: true } },
            },
          },
        },
      });

      if (agendado) {
        const vinc = agendado.vinculacoes[0];
        console.log(`\n   Equipamento agendado correto:`);
        console.log(`   ${agendado.serialNumber} → ${vinc?.usuario.nome || 'N/A'}`);
        console.log(`   Técnico: ${vinc?.tecnico?.nome || 'N/A'}`);
      }
    }

    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
