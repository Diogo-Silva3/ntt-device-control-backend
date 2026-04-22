require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticar() {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO DO DASHBOARD ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})`);
    console.log(`Empresa ID: ${projeto.empresaId}\n`);

    // 1. TOTAL DO PROJETO
    const totalProjeto = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
      },
    });
    console.log(`📊 TOTAL DO PROJETO: ${totalProjeto}`);

    // 2. AGENDADAS (statusProcesso = 'Agendado para Entrega')
    const agendadas = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: 'Agendado para Entrega',
      },
    });
    console.log(`📅 AGENDADAS (equipamentos): ${agendadas}`);

    // 3. ENTREGUES (statusProcesso = 'Entregue ao Usuário' ou 'Em Uso')
    const entregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
      },
    });
    console.log(`✅ ENTREGUES (equipamentos): ${entregues}`);

    // 4. VINCULAÇÕES ATIVAS
    const vinculacoesAtivas = await prisma.vinculacao.count({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
    });
    console.log(`🔗 VINCULAÇÕES ATIVAS (total): ${vinculacoesAtivas}`);

    // 5. VINCULAÇÕES ENTREGUES
    const vinculacoesEntregues = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { projetoId: projeto.id },
      },
    });
    console.log(`🔗 VINCULAÇÕES ENTREGUES: ${vinculacoesEntregues}`);

    // 6. VINCULAÇÕES PENDENTES
    const vinculacoesPendentes = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: { projetoId: projeto.id },
      },
    });
    console.log(`🔗 VINCULAÇÕES PENDENTES: ${vinculacoesPendentes}`);

    // 7. FALTAM ENTREGAR
    const faltamEntregar = totalProjeto - entregues;
    console.log(`⏳ FALTAM ENTREGAR: ${faltamEntregar}`);

    console.log('\n=== DETALHES DAS VINCULAÇÕES ===\n');

    // Listar vinculações PENDENTES
    const pendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: { projetoId: projeto.id },
      },
      include: {
        usuario: { select: { nome: true } },
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        tecnico: { select: { nome: true } },
      },
    });

    console.log(`PENDENTES (${pendentes.length}):`);
    pendentes.forEach(v => {
      console.log(`  - ${v.usuario.nome} → ${v.equipamento.serialNumber}`);
      console.log(`    Técnico: ${v.tecnico?.nome || 'N/A'}`);
      console.log(`    StatusProcesso: ${v.equipamento.statusProcesso}`);
      console.log(`    ID: ${v.id}\n`);
    });

    console.log('\n=== RESUMO ESPERADO NO DASHBOARD ===');
    console.log(`TOTAL DO PROJETO: ${totalProjeto}`);
    console.log(`AGENDADAS: ${agendadas}`);
    console.log(`ENTREGUES: ${entregues}`);
    console.log(`FALTAM ENTREGAR: ${faltamEntregar}`);
    console.log(`ATRIBUÍDO: ${vinculacoesAtivas} (ou ${vinculacoesEntregues} se contar só ENTREGUES)`);

    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticar();
