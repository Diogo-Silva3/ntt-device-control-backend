require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarAuditoria() {
  try {
    console.log('=== VERIFICANDO AUDITORIA DE VINCULAÇÕES DELETADAS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Verificar se existe tabela de auditoria
    const tabelas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%audit%' OR table_name LIKE '%history%' OR table_name LIKE '%log%'
    `;

    console.log('📋 Tabelas de auditoria/histórico encontradas:');
    tabelas.forEach(t => console.log(`  - ${t.table_name}`));

    // Tentar buscar na tabela log_acessos (pode ter registros de operações)
    try {
      const logsRecentes = await prisma.logAcesso.findMany({
        where: {
          createdAt: {
            gte: new Date('2026-04-21T13:00:00'),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      console.log(`\n📊 Logs de acesso desde 13:00 hoje: ${logsRecentes.length}`);
      
      if (logsRecentes.length > 0) {
        console.log('\nÚltimos logs:');
        logsRecentes.slice(0, 10).forEach(log => {
          console.log(`  ${log.createdAt.toISOString()} - ${log.usuario?.nome || 'Sistema'} - ${log.acao || 'N/A'}`);
        });
      }
    } catch (e) {
      console.log('\n⚠️  Não foi possível acessar log_acessos');
    }

    // Buscar vinculações que foram modificadas recentemente
    console.log('\n\n🔍 BUSCANDO VINCULAÇÕES MODIFICADAS HOJE...\n');

    const hoje = new Date('2026-04-21T00:00:00');
    
    // Buscar todas as vinculações do projeto (ativas e inativas)
    const todasVinculacoes = await prisma.vinculacao.findMany({
      where: {
        equipamento: { projetoId: projeto.id },
      },
      include: {
        equipamento: { select: { serialNumber: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Total de vinculações no banco: ${todasVinculacoes.length}`);
    console.log(`Ativas: ${todasVinculacoes.filter(v => v.ativa).length}`);
    console.log(`Inativas: ${todasVinculacoes.filter(v => !v.ativa).length}`);

    // Verificar se há "buracos" nos IDs (indicando deleções)
    const ids = todasVinculacoes.map(v => v.id).sort((a, b) => a - b);
    const menorId = Math.min(...ids);
    const maiorId = Math.max(...ids);
    
    console.log(`\n📊 IDs das vinculações: ${menorId} até ${maiorId}`);
    
    const idsFaltando = [];
    for (let i = menorId; i <= maiorId; i++) {
      if (!ids.includes(i)) {
        idsFaltando.push(i);
      }
    }

    if (idsFaltando.length > 0) {
      console.log(`\n⚠️  IDs FALTANDO (vinculações deletadas): ${idsFaltando.join(', ')}`);
      console.log(`   Total de vinculações deletadas: ${idsFaltando.length}`);
    } else {
      console.log('\n✓ Não há IDs faltando (nenhuma vinculação foi deletada)');
    }

    // Mostrar todas as vinculações ENTREGUE ativas
    console.log('\n\n📋 VINCULAÇÕES ENTREGUE ATIVAS (lista completa):\n');
    const entregues = todasVinculacoes.filter(v => v.ativa && v.statusEntrega === 'ENTREGUE');
    entregues.forEach((v, index) => {
      console.log(`${index + 1}. ${v.usuario.nome} → ${v.equipamento.serialNumber} (ID: ${v.id})`);
    });

    console.log(`\n📊 Total: ${entregues.length} entregues`);
    console.log(`⚠️  Faltam: ${34 - entregues.length} para chegar a 34`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarAuditoria();
