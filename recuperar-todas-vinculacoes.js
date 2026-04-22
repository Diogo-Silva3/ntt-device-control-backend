require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recuperar() {
  try {
    console.log('=== RECUPERANDO TODAS AS VINCULAÇÕES ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar TODAS as vinculações (ativas e inativas)
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`📊 TOTAL DE VINCULAÇÕES NO BANCO: ${todasVinculacoes.length}\n`);

    // Separar por status
    const ativas = todasVinculacoes.filter(v => v.ativa);
    const inativas = todasVinculacoes.filter(v => !v.ativa);

    console.log(`✅ ATIVAS: ${ativas.length}`);
    console.log(`❌ INATIVAS: ${inativas.length}\n`);

    // Mostrar todas as INATIVAS
    if (inativas.length > 0) {
      console.log('📋 VINCULAÇÕES INATIVAS (que podem ser recuperadas):\n');
      inativas.forEach((v, index) => {
        console.log(`${index + 1}. ID: ${v.id}`);
        console.log(`   Usuário: ${v.usuario.nome}`);
        console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
        console.log(`   Status Entrega: ${v.statusEntrega}`);
        console.log(`   Criada em: ${v.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });

      // Contar quantas são ENTREGUE
      const inativasEntregue = inativas.filter(v => v.statusEntrega === 'ENTREGUE');
      console.log(`\n⚠️  ${inativasEntregue.length} vinculações INATIVAS eram ENTREGUE\n`);

      if (inativasEntregue.length > 0) {
        console.log('🔧 REATIVANDO TODAS AS VINCULAÇÕES ENTREGUE...\n');

        for (const vinc of inativasEntregue) {
          // Reativar vinculação
          await prisma.vinculacao.update({
            where: { id: vinc.id },
            data: { ativa: true },
          });

          // Atualizar equipamento
          await prisma.equipamento.update({
            where: { id: vinc.equipamentoId },
            data: { 
              statusProcesso: 'Entregue ao Usuário',
              status: 'EM_USO',
            },
          });

          console.log(`✓ Reativada: ${vinc.usuario.nome} → ${vinc.equipamento.serialNumber}`);
        }

        console.log(`\n✅ ${inativasEntregue.length} vinculações REATIVADAS!`);
      }
    }

    // Verificar resultado final
    console.log('\n=== RESULTADO FINAL ===\n');

    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
    });

    const porStatus = {};
    vinculacoesAtivas.forEach(v => {
      porStatus[v.statusEntrega] = (porStatus[v.statusEntrega] || 0) + 1;
    });

    console.log('📊 VINCULAÇÕES ATIVAS:');
    console.log(`   Total: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const pendentes = porStatus['PENDENTE'] || 0;
    const entregues = porStatus['ENTREGUE'] || 0;

    console.log('\n📈 DASHBOARD DEVE MOSTRAR:');
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    if (entregues >= 34) {
      console.log('\n🎉 PERFEITO! Temos 34 ou mais entregues!');
    } else {
      console.log(`\n⚠️  Ainda faltam ${34 - entregues} para chegar a 34`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recuperar();
