require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO ESTADO ATUAL ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar TODAS as vinculações ativas
    const vinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
        tecnico: { select: { nome: true } },
      },
      orderBy: { statusEntrega: 'asc' },
    });

    console.log(`📊 VINCULAÇÕES ATIVAS: ${vinculacoesAtivas.length}\n`);

    const porStatus = {};
    vinculacoesAtivas.forEach(v => {
      if (!porStatus[v.statusEntrega]) {
        porStatus[v.statusEntrega] = [];
      }
      porStatus[v.statusEntrega].push(v);
    });

    Object.keys(porStatus).forEach(status => {
      console.log(`\n${status}: ${porStatus[status].length}`);
      porStatus[status].forEach(v => {
        console.log(`  - ${v.usuario.nome} → ${v.equipamento.serialNumber}`);
        console.log(`    Técnico: ${v.tecnico?.nome || 'N/A'}`);
        console.log(`    StatusProcesso: ${v.equipamento.statusProcesso}`);
        console.log(`    ID: ${v.id}`);
      });
    });

    const pendentes = porStatus['PENDENTE']?.length || 0;
    const entregues = porStatus['ENTREGUE']?.length || 0;

    console.log('\n\n📈 RESUMO:');
    console.log(`   AGENDADAS (PENDENTE): ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   TOTAL ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
