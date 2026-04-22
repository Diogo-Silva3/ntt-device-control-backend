require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO ATRIBUÍDO ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Contar vinculações ENTREGUES (como está no dashboard)
    const totalAtribuido = await prisma.vinculacao.count({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { 
          projetoId: projeto.id,
        },
      },
    });

    // Contar equipamentos com statusProcesso ENTREGUE
    const maquinasEntregues = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Entregue ao Usuário', 'Em Uso'] },
      },
    });

    console.log('📊 CONTADORES:');
    console.log(`   Total Atribuído (vinculações ENTREGUE): ${totalAtribuido}`);
    console.log(`   Máquinas Entregues (statusProcesso): ${maquinasEntregues}\n`);

    // Buscar todas as vinculações ativas ENTREGUES
    const vinculacoes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'ENTREGUE',
        equipamento: { 
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            id: true,
            serialNumber: true,
            statusProcesso: true,
            status: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            role: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Total de vinculações ativas ENTREGUE: ${vinculacoes.length}\n`);

    // Verificar se há alguma vinculação com equipamento que não está "Entregue ao Usuário"
    const vinculacoesInconsistentes = vinculacoes.filter(v => 
      !['Entregue ao Usuário', 'Em Uso'].includes(v.equipamento.statusProcesso)
    );

    if (vinculacoesInconsistentes.length > 0) {
      console.log('⚠️  VINCULAÇÕES INCONSISTENTES (ENTREGUE mas equipamento não está "Entregue ao Usuário"):');
      vinculacoesInconsistentes.forEach(v => {
        console.log(`\n   Vinculação ID: ${v.id}`);
        console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
        console.log(`   Status Equipamento: ${v.equipamento.status}`);
        console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
        console.log(`   Usuário: ${v.usuario.nome} (${v.usuario.role})`);
        console.log(`   Status Entrega: ${v.statusEntrega}`);
      });
      console.log('\n');
    }

    // Verificar se há técnicos com vinculações
    const vinculacoesTecnicos = vinculacoes.filter(v => 
      v.usuario.role === 'TECNICO' || v.usuario.role === 'ADMIN'
    );

    if (vinculacoesTecnicos.length > 0) {
      console.log('⚠️  TÉCNICOS COM VINCULAÇÕES ATIVAS:');
      vinculacoesTecnicos.forEach(v => {
        console.log(`\n   Vinculação ID: ${v.id}`);
        console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
        console.log(`   Técnico: ${v.usuario.nome} (${v.usuario.role})`);
        console.log(`   Status Entrega: ${v.statusEntrega}`);
      });
      console.log('\n');
    }

    // Listar todas as vinculações
    console.log('📋 TODAS AS VINCULAÇÕES ATIVAS ENTREGUE:\n');
    vinculacoes.forEach((v, idx) => {
      console.log(`${idx + 1}. ${v.equipamento.serialNumber} → ${v.usuario.nome}`);
      console.log(`   Vinculação ID: ${v.id}`);
      console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
      console.log(`   Role: ${v.usuario.role}\n`);
    });

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
