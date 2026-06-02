const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarVinculacoes() {
  try {
    console.log('🔄 Criando vinculações para equipamentos agendados do projeto de celulares...\n');

    // 1. Encontrar o projeto de celulares
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: { contains: 'CELULAR', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.log('❌ Projeto de celulares não encontrado');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Projeto encontrado: ${projeto.nome} (ID: ${projeto.id})\n`);

    // 2. Encontrar equipamentos agendados SEM vinculações
    const equipamentosAgendados = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega',
        vinculacoes: {
          none: {
            ativa: true,
            statusEntrega: 'PENDENTE'
          }
        }
      },
      include: {
        vinculacoes: true
      }
    });

    console.log(`📊 Equipamentos agendados sem vinculação PENDENTE: ${equipamentosAgendados.length}\n`);

    if (equipamentosAgendados.length === 0) {
      console.log('✅ Todos os equipamentos agendados já têm vinculações!');
      await prisma.$disconnect();
      return;
    }

    // 3. Para cada equipamento, criar uma vinculação PENDENTE
    let criadas = 0;
    let erros = 0;

    for (const eq of equipamentosAgendados) {
      try {
        // Verificar se já existe vinculação inativa
        const vinculacaoInativa = await prisma.vinculacao.findFirst({
          where: {
            equipamentoId: eq.id,
            statusEntrega: 'PENDENTE',
            ativa: false
          }
        });

        if (vinculacaoInativa) {
          // Reativar vinculação existente
          await prisma.vinculacao.update({
            where: { id: vinculacaoInativa.id },
            data: {
              ativa: true,
              dataFim: null
            }
          });
          console.log(`✅ Reativada vinculação para ${eq.serialNumber}`);
          criadas++;
        } else {
          // Criar nova vinculação
          // Precisamos de um usuário (colaborador) para a vinculação
          // Vamos usar o técnico como referência, mas precisamos de um usuário real
          
          // Buscar um usuário do projeto para usar como colaborador
          const usuario = await prisma.usuario.findFirst({
            where: {
              empresaId: eq.empresaId,
              projetoId: projeto.id,
              role: { not: 'TECNICO' }
            }
          });

          if (!usuario) {
            console.log(`⚠️  Sem usuário para vincular ${eq.serialNumber}`);
            erros++;
            continue;
          }

          await prisma.vinculacao.create({
            data: {
              equipamentoId: eq.id,
              usuarioId: usuario.id,
              tecnicoId: eq.tecnicoId,
              projetoId: projeto.id,
              statusEntrega: 'PENDENTE',
              ativa: true,
              tipoOperacao: 'Máquina nova e usuário novo'
            }
          });
          console.log(`✅ Criada vinculação para ${eq.serialNumber}`);
          criadas++;
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ${eq.serialNumber}:`, err.message);
        erros++;
      }
    }

    console.log(`\n✅ PROCESSO CONCLUÍDO!`);
    console.log(`📈 Vinculações criadas/reativadas: ${criadas}`);
    console.log(`❌ Erros: ${erros}`);

    // 4. Verificar resultado
    const agendadosComVinculacao = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        tipo: { contains: 'CELULAR', mode: 'insensitive' },
        statusProcesso: 'Agendado para Entrega',
        vinculacoes: {
          some: {
            ativa: true,
            statusEntrega: 'PENDENTE'
          }
        }
      }
    });

    console.log(`\n📊 Equipamentos agendados com vinculação PENDENTE: ${agendadosComVinculacao}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

criarVinculacoes();
