require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigar() {
  try {
    console.log('=== INVESTIGANDO DUPLICAÇÃO DE CONTAGEM ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 1. Buscar todas as ELAINES
    const elaines = await prisma.usuario.findMany({
      where: {
        nome: { contains: 'ELAINE' },
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
          include: {
            equipamento: { select: { serialNumber: true, statusProcesso: true } },
          },
        },
      },
    });

    console.log(`👥 USUÁRIOS COM NOME "ELAINE": ${elaines.length}\n`);
    elaines.forEach(user => {
      console.log(`  - ${user.nome} (ID: ${user.id})`);
      console.log(`    Vinculações ativas: ${user.vinculacoes.length}`);
      user.vinculacoes.forEach(v => {
        console.log(`      → ${v.equipamento.serialNumber} (${v.statusEntrega}) - statusProcesso: ${v.equipamento.statusProcesso}`);
      });
      console.log('');
    });

    // 2. Buscar TODAS as vinculações ativas do projeto
    const todasVinculacoesAtivas = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true, statusProcesso: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { usuario: { nome: 'asc' } },
    });

    console.log(`\n📊 TODAS AS VINCULAÇÕES ATIVAS: ${todasVinculacoesAtivas.length}\n`);

    // Agrupar por status
    const porStatus = {};
    todasVinculacoesAtivas.forEach(v => {
      if (!porStatus[v.statusEntrega]) {
        porStatus[v.statusEntrega] = [];
      }
      porStatus[v.statusEntrega].push(v);
    });

    console.log('Por Status:');
    Object.keys(porStatus).forEach(status => {
      console.log(`  ${status}: ${porStatus[status].length}`);
    });

    // 3. Verificar se há equipamentos com múltiplas vinculações ativas
    const equipamentosComMultiplasVinculacoes = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        vinculacoes: {
          some: { ativa: true },
        },
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            usuario: { select: { nome: true } },
          },
        },
      },
    });

    const duplicados = equipamentosComMultiplasVinculacoes.filter(eq => eq.vinculacoes.length > 1);

    if (duplicados.length > 0) {
      console.log(`\n⚠️  EQUIPAMENTOS COM MÚLTIPLAS VINCULAÇÕES ATIVAS: ${duplicados.length}`);
      duplicados.forEach(eq => {
        console.log(`  - ${eq.serialNumber}:`);
        eq.vinculacoes.forEach(v => {
          console.log(`    → ${v.usuario.nome} (${v.statusEntrega}) - ID: ${v.id}`);
        });
      });
    } else {
      console.log('\n✓ Nenhum equipamento com múltiplas vinculações ativas');
    }

    // 4. Verificar se há usuários com múltiplas vinculações ativas
    const usuariosComMultiplasVinculacoes = await prisma.usuario.findMany({
      where: {
        vinculacoes: {
          some: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
        },
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
          include: {
            equipamento: { select: { serialNumber: true } },
          },
        },
      },
    });

    const usuariosDuplicados = usuariosComMultiplasVinculacoes.filter(u => u.vinculacoes.length > 1);

    if (usuariosDuplicados.length > 0) {
      console.log(`\n⚠️  USUÁRIOS COM MÚLTIPLAS VINCULAÇÕES ATIVAS: ${usuariosDuplicados.length}`);
      usuariosDuplicados.forEach(u => {
        console.log(`  - ${u.nome}:`);
        u.vinculacoes.forEach(v => {
          console.log(`    → ${v.equipamento.serialNumber} (${v.statusEntrega}) - ID: ${v.id}`);
        });
      });
    } else {
      console.log('\n✓ Nenhum usuário com múltiplas vinculações ativas');
    }

    // 5. Mostrar lista completa de vinculações PENDENTES
    console.log('\n\n📋 VINCULAÇÕES PENDENTES (detalhado):');
    const pendentes = porStatus['PENDENTE'] || [];
    pendentes.forEach(v => {
      console.log(`  - ${v.usuario.nome} → ${v.equipamento.serialNumber}`);
      console.log(`    StatusProcesso: ${v.equipamento.statusProcesso}`);
      console.log(`    ID Vinculação: ${v.id}`);
      console.log('');
    });

    console.log('\n=== RESUMO FINAL ===');
    console.log(`Total vinculações ativas: ${todasVinculacoesAtivas.length}`);
    console.log(`ENTREGUE: ${porStatus['ENTREGUE']?.length || 0}`);
    console.log(`PENDENTE: ${porStatus['PENDENTE']?.length || 0}`);
    console.log(`OUTROS: ${todasVinculacoesAtivas.length - (porStatus['ENTREGUE']?.length || 0) - (porStatus['PENDENTE']?.length || 0)}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigar();
