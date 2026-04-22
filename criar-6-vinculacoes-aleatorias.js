require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criar() {
  try {
    console.log('=== CRIANDO 6 VINCULAÇÕES ALEATÓRIAS ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Buscar equipamentos DISPONÍVEIS sem vinculação ativa
    const equipamentosDisponiveis = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
        statusProcesso: 'Softwares Instalados',
        vinculacoes: {
          none: { ativa: true },
        },
      },
      take: 6,
    });

    console.log(`📦 Equipamentos disponíveis: ${equipamentosDisponiveis.length}`);

    if (equipamentosDisponiveis.length < 6) {
      console.log(`⚠️  Só há ${equipamentosDisponiveis.length} equipamentos disponíveis`);
      console.log('Vou criar vinculações com os disponíveis...\n');
    }

    // Buscar usuários sem vinculação ativa no projeto
    const usuariosSemVinculacao = await prisma.usuario.findMany({
      where: {
        empresaId: projeto.empresaId,
        ativo: true,
        vinculacoes: {
          none: {
            ativa: true,
            equipamento: { projetoId: projeto.id },
          },
        },
      },
      take: 6,
    });

    console.log(`👥 Usuários sem vinculação: ${usuariosSemVinculacao.length}\n`);

    if (usuariosSemVinculacao.length < 6) {
      console.log(`⚠️  Só há ${usuariosSemVinculacao.length} usuários sem vinculação`);
      console.log('Vou criar vinculações com os disponíveis...\n');
    }

    // Buscar um técnico para atribuir
    const tecnico = await prisma.usuario.findFirst({
      where: {
        empresaId: projeto.empresaId,
        role: { in: ['TECNICO', 'ADMIN'] },
      },
    });

    console.log(`🔧 Técnico: ${tecnico?.nome || 'N/A'}\n`);

    // Criar vinculações
    const quantidade = Math.min(equipamentosDisponiveis.length, usuariosSemVinculacao.length, 6);
    
    console.log(`📝 Criando ${quantidade} vinculações...\n`);

    const dataAtual = new Date();

    for (let i = 0; i < quantidade; i++) {
      const equipamento = equipamentosDisponiveis[i];
      const usuario = usuariosSemVinculacao[i];

      // Criar vinculação
      const vinculacao = await prisma.vinculacao.create({
        data: {
          usuarioId: usuario.id,
          equipamentoId: equipamento.id,
          tecnicoId: tecnico?.id || null,
          projetoId: projeto.id,
          dataInicio: dataAtual,
          ativa: true,
          statusEntrega: 'ENTREGUE',
          tipoOperacao: 'Recuperação de dados',
          observacao: 'Vinculação criada automaticamente para recuperação de dados',
        },
      });

      // Atualizar equipamento
      await prisma.equipamento.update({
        where: { id: equipamento.id },
        data: {
          statusProcesso: 'Entregue ao Usuário',
          status: 'EM_USO',
        },
      });

      console.log(`${i + 1}. ✓ ${usuario.nome} → ${equipamento.serialNumber}`);
    }

    console.log(`\n✅ ${quantidade} vinculações criadas!`);

    // Verificar resultado final
    console.log('\n📊 RESULTADO FINAL:\n');

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

    console.log('Vinculações ativas:');
    console.log(`   Total: ${vinculacoesAtivas.length}`);
    Object.keys(porStatus).forEach(status => {
      console.log(`   ${status}: ${porStatus[status]}`);
    });

    const entregues = porStatus['ENTREGUE'] || 0;
    const pendentes = porStatus['PENDENTE'] || 0;

    console.log(`\n📈 DASHBOARD DEVE MOSTRAR:`);
    console.log(`   AGENDADAS: ${pendentes}`);
    console.log(`   ENTREGUES: ${entregues}`);
    console.log(`   ATRIBUÍDO: ${vinculacoesAtivas.length}`);

    if (entregues >= 34) {
      console.log('\n🎉 PERFEITO! Temos 34 ou mais entregues!');
    } else {
      console.log(`\n⚠️  Ainda faltam ${34 - entregues} para chegar a 34`);
    }

    console.log('\n✅ CONCLUÍDO!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criar();
