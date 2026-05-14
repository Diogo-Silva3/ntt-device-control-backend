const prisma = require('./src/config/prisma');

async function criarAtribuicoesFaltantes() {
  try {
    console.log('\n🔧 CRIANDO ATRIBUIÇÕES FALTANTES...\n');

    // Buscar TODOS equipamentos agendados (com ou sem atribuição)
    const equipamentosAgendados = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
        agendamento: { not: null }
      },
      include: {
        tecnico: { select: { id: true, nome: true } },
        vinculacoes: {
          where: { ativa: true },
          select: { id: true }
        }
      }
    });

    console.log(`📦 Encontrados ${equipamentosAgendados.length} equipamentos em "Agendado para Entrega"\n`);

    let criadas = 0;
    let atualizadas = 0;
    let erros = 0;

    for (const eq of equipamentosAgendados) {
      try {
        const agendamento = eq.agendamento ? JSON.parse(eq.agendamento) : null;
        
        if (!agendamento || !agendamento.colaboradorId) {
          console.log(`⚠️  Equipamento #${eq.id}: Sem colaborador no agendamento`);
          continue;
        }

        // Converter data para ISO
        let dataAgendamentoISO = null;
        if (agendamento.data && agendamento.horario) {
          const dataObj = new Date(agendamento.data + 'T' + agendamento.horario + ':00');
          dataAgendamentoISO = dataObj.toISOString();
        }

        // Se já tem atribuição ativa, atualiza com o agendamento
        if (eq.vinculacoes.length > 0) {
          const atribuicaoAtiva = eq.vinculacoes[0];
          await prisma.vinculacao.update({
            where: { id: atribuicaoAtiva.id },
            data: {
              dataAgendamento: dataAgendamentoISO,
              statusEntrega: 'PENDENTE'
            }
          });
          console.log(`🔄 Atribuição atualizada #${atribuicaoAtiva.id} (Equipamento #${eq.id})\n`);
          atualizadas++;
        } else {
          // Se não tem, cria nova
          const vinculacao = await prisma.vinculacao.create({
            data: {
              usuarioId: parseInt(agendamento.colaboradorId),
              equipamentoId: eq.id,
              tecnicoId: eq.tecnicoId || null,
              tipoOperacao: 'Agendamento na Preparação',
              dataAgendamento: dataAgendamentoISO,
              statusEntrega: 'PENDENTE',
              ativa: true,
            },
            include: {
              usuario: { select: { nome: true } },
              equipamento: { select: { marca: true, modelo: true } }
            }
          });

          console.log(`✅ Atribuição criada #${vinculacao.id}`);
          console.log(`   Equipamento: ${vinculacao.equipamento.marca} ${vinculacao.equipamento.modelo}`);
          console.log(`   Colaborador: ${vinculacao.usuario.nome}`);
          console.log(`   Data: ${agendamento.data} ${agendamento.horario}\n`);
          
          criadas++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar equipamento #${eq.id}:`, err.message);
        erros++;
      }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`✅ Atribuições criadas: ${criadas}`);
    console.log(`🔄 Atribuições atualizadas: ${atualizadas}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`Total processado: ${criadas + atualizadas + erros}\n`);

  } catch (err) {
    console.error('❌ Erro geral:', err);
  } finally {
    await prisma.$disconnect();
  }
}

criarAtribuicoesFaltantes();
