require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO EQUIPAMENTO H45C9H4 ===\n');

    // Buscar equipamento H45C9H4
    const equipamento = await prisma.equipamento.findFirst({
      where: { serialNumber: 'H45C9H4' },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: { select: { nome: true } },
          },
        },
      },
    });

    if (!equipamento) {
      console.log('❌ Equipamento H45C9H4 não encontrado');
      return;
    }

    console.log(`Equipamento: ${equipamento.serialNumber}`);
    console.log(`StatusProcesso: ${equipamento.statusProcesso}`);
    console.log(`Vinculações ativas: ${equipamento.vinculacoes.length}`);

    if (equipamento.vinculacoes.length > 0) {
      equipamento.vinculacoes.forEach(v => {
        console.log(`  - ${v.usuario.nome} (${v.statusEntrega})`);
      });
    }

    // Verificar se tem vinculação PENDENTE
    const temPendente = equipamento.vinculacoes.some(v => v.statusEntrega === 'PENDENTE');

    if (!temPendente && equipamento.statusProcesso === 'Agendado para Entrega') {
      console.log('\n⚠️  Equipamento está "Agendado para Entrega" mas NÃO tem vinculação PENDENTE');
      console.log('Atualizando para "Softwares Instalados"...\n');

      await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: { statusProcesso: 'Softwares Instalados' },
      });

      console.log('✅ Equipamento H45C9H4 atualizado para "Softwares Instalados"');
    } else if (temPendente) {
      console.log('\n✓ Equipamento tem vinculação PENDENTE - está correto');
    } else {
      console.log('\n✓ Equipamento já está correto');
    }

    // Verificar resultado final
    console.log('\n📊 VERIFICAÇÃO FINAL:\n');

    const projetos = await prisma.projeto.findMany({
      orderBy: { nome: 'asc' },
    });

    for (const projeto of projetos) {
      const agendados = await prisma.equipamento.count({
        where: {
          projetoId: projeto.id,
          statusProcesso: 'Agendado para Entrega',
        },
      });

      const vinculacoesPendentes = await prisma.vinculacao.count({
        where: {
          ativa: true,
          statusEntrega: 'PENDENTE',
          equipamento: { projetoId: projeto.id },
        },
      });

      console.log(`${projeto.nome}:`);
      console.log(`   Equipamentos "Agendado para Entrega": ${agendados}`);
      console.log(`   Vinculações PENDENTE: ${vinculacoesPendentes}`);
      
      if (agendados !== vinculacoesPendentes) {
        console.log(`   ⚠️  INCONSISTÊNCIA! Diferença: ${Math.abs(agendados - vinculacoesPendentes)}`);
      } else {
        console.log(`   ✓ Correto`);
      }
      console.log('');
    }

    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corrigir();
