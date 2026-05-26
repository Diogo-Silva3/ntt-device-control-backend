const prisma = require('./src/config/prisma');

async function atualizarUnidadesEquipamentos() {
  try {
    console.log('🔄 Atualizando unidades dos equipamentos baseado em vinculações...\n');

    // Buscar todos os equipamentos
    const equipamentos = await prisma.equipamento.findMany({
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: { usuario: { select: { unidadeId: true, unidade: { select: { nome: true } } } } },
          take: 1
        }
      }
    });

    console.log(`📦 Total de equipamentos: ${equipamentos.length}\n`);

    let atualizados = 0;
    let semVinculacao = 0;
    let erros = 0;

    for (const eq of equipamentos) {
      try {
        // Se tem vinculação ativa
        if (eq.vinculacoes.length > 0) {
          const vinculacao = eq.vinculacoes[0];
          const novaUnidadeId = vinculacao.usuario?.unidadeId;
          const novaUnidadeNome = vinculacao.usuario?.unidade?.nome;

          // Se a unidade é diferente, atualizar
          if (novaUnidadeId && eq.unidadeId !== novaUnidadeId) {
            await prisma.equipamento.update({
              where: { id: eq.id },
              data: { unidadeId: novaUnidadeId }
            });

            console.log(`✅ ${eq.marca} ${eq.modelo} (${eq.serialNumber})`);
            console.log(`   ${eq.unidade?.nome || 'Sem unidade'} → ${novaUnidadeNome}`);
            atualizados++;
          }
        } else {
          semVinculacao++;
        }
      } catch (err) {
        console.error(`❌ Erro ao atualizar ${eq.serialNumber}:`, err.message);
        erros++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(80));
    console.log(`✅ Equipamentos atualizados: ${atualizados}`);
    console.log(`⚠️  Equipamentos sem vinculação: ${semVinculacao}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processado: ${equipamentos.length}`);
    console.log('='.repeat(80));

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarUnidadesEquipamentos();
