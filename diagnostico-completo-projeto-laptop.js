require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO - PROJETO TECH REFRESH LAPTOP 2026 ===\n');

    // 1. Buscar o projeto
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    if (!projeto) {
      console.log('❌ Projeto LAPTOP não encontrado!');
      return;
    }

    console.log(`✓ Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. EQUIPAMENTOS do projeto
    const totalEquipamentos = await prisma.equipamento.count({
      where: { projetoId: projeto.id, status: { not: 'DESCARTADO' } },
    });

    const equipamentosPorStatus = await prisma.equipamento.groupBy({
      by: ['status'],
      where: { projetoId: projeto.id, status: { not: 'DESCARTADO' } },
      _count: true,
    });

    const equipamentosPorStatusProcesso = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      where: { projetoId: projeto.id, status: { not: 'DESCARTADO' } },
      _count: true,
    });

    console.log('📦 EQUIPAMENTOS:');
    console.log(`   Total: ${totalEquipamentos}`);
    console.log('\n   Por Status:');
    equipamentosPorStatus.forEach(s => {
      console.log(`   - ${s.status}: ${s._count}`);
    });
    console.log('\n   Por StatusProcesso:');
    equipamentosPorStatusProcesso.forEach(s => {
      console.log(`   - ${s.statusProcesso}: ${s._count}`);
    });

    // 3. VINCULAÇÕES do projeto
    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
      },
    });

    const vinculacoesPorStatus = {};
    vinculacoesAtivas.forEach(v => {
      if (!vinculacoesPorStatus[v.statusEntrega]) {
        vinculacoesPorStatus[v.statusEntrega] = [];
      }
      vinculacoesPorStatus[v.statusEntrega].push(v);
    });

    console.log('\n\n🔗 VINCULAÇÕES ATIVAS:');
    console.log(`   Total: ${vinculacoesAtivas.length}`);
    Object.keys(vinculacoesPorStatus).forEach(status => {
      console.log(`\n   ${status}: ${vinculacoesPorStatus[status].length}`);
      vinculacoesPorStatus[status].slice(0, 3).forEach(v => {
        console.log(`      - ${v.equipamento.serialNumber} → ${v.usuario.nome} (statusProcesso: ${v.equipamento.statusProcesso})`);
      });
      if (vinculacoesPorStatus[status].length > 3) {
        console.log(`      ... e mais ${vinculacoesPorStatus[status].length - 3}`);
      }
    });

    // 4. INCONSISTÊNCIAS
    console.log('\n\n⚠️  INCONSISTÊNCIAS ENCONTRADAS:\n');

    // Vinculações ENTREGUE mas equipamento não está como "Entregue ao Usuário" ou "Em Uso"
    const entreguesInconsistentes = vinculacoesAtivas.filter(v => 
      v.statusEntrega === 'ENTREGUE' && 
      v.equipamento.statusProcesso !== 'Entregue ao Usuário' && 
      v.equipamento.statusProcesso !== 'Em Uso'
    );

    if (entreguesInconsistentes.length > 0) {
      console.log(`   ${entreguesInconsistentes.length} vinculações ENTREGUES mas equipamento com statusProcesso errado:`);
      entreguesInconsistentes.forEach(v => {
        console.log(`   - ${v.equipamento.serialNumber} (statusProcesso: ${v.equipamento.statusProcesso})`);
      });
    }

    // Vinculações PENDENTE mas equipamento não está como "Agendado para Entrega"
    const pendentesInconsistentes = vinculacoesAtivas.filter(v => 
      v.statusEntrega === 'PENDENTE' && 
      v.equipamento.statusProcesso !== 'Agendado para Entrega'
    );

    if (pendentesInconsistentes.length > 0) {
      console.log(`\n   ${pendentesInconsistentes.length} vinculações PENDENTES mas equipamento com statusProcesso errado:`);
      pendentesInconsistentes.forEach(v => {
        console.log(`   - ${v.equipamento.serialNumber} (statusProcesso: ${v.equipamento.statusProcesso})`);
      });
    }

    // 5. O QUE O DASHBOARD DEVERIA MOSTRAR
    const entregues = vinculacoesPorStatus['ENTREGUE']?.length || 0;
    const pendentes = vinculacoesPorStatus['PENDENTE']?.length || 0;

    console.log('\n\n📊 O QUE O DASHBOARD DEVERIA MOSTRAR:');
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    console.log('\n=== FIM DO DIAGNÓSTICO ===');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
