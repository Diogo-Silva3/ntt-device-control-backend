require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigar() {
  try {
    console.log('=== INVESTIGANDO EQUIPAMENTOS COM statusProcesso "Agendado para Entrega" ===\n');

    // Buscar equipamentos com statusProcesso "Agendado para Entrega"
    const equipamentosAgendados = await prisma.equipamento.findMany({
      where: {
        statusProcesso: 'Agendado para Entrega',
      },
      include: {
        vinculacoes: {
          where: {
            ativa: true,
          },
          include: {
            usuario: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    console.log(`Total de equipamentos com statusProcesso "Agendado para Entrega": ${equipamentosAgendados.length}\n`);

    if (equipamentosAgendados.length === 0) {
      console.log('Nenhum equipamento encontrado.');
      return;
    }

    console.log('Lista de equipamentos:\n');
    equipamentosAgendados.forEach((eq, i) => {
      console.log(`${i + 1}. Serial: ${eq.serialNumber}`);
      console.log(`   Status: ${eq.status}`);
      console.log(`   StatusProcesso: ${eq.statusProcesso}`);
      
      if (eq.vinculacoes.length === 0) {
        console.log(`   ⚠️  SEM VINCULAÇÃO ATIVA`);
      } else {
        eq.vinculacoes.forEach(v => {
          console.log(`   Vinculação: ${v.usuario?.nome || 'N/A'} - Status: ${v.statusEntrega}`);
        });
      }
      console.log('');
    });

    // Identificar equipamentos que deveriam ser corrigidos
    const semVinculacaoPendente = equipamentosAgendados.filter(eq => {
      const temPendente = eq.vinculacoes.some(v => v.statusEntrega === 'PENDENTE');
      return !temPendente;
    });

    if (semVinculacaoPendente.length > 0) {
      console.log(`\n⚠️  ${semVinculacaoPendente.length} equipamentos estão como "Agendado para Entrega" mas NÃO têm vinculação PENDENTE:\n`);
      semVinculacaoPendente.forEach(eq => {
        const vinculacao = eq.vinculacoes[0];
        console.log(`- ${eq.serialNumber}`);
        if (vinculacao) {
          console.log(`  Tem vinculação ${vinculacao.statusEntrega} com ${vinculacao.usuario?.nome}`);
          if (vinculacao.statusEntrega === 'ENTREGUE') {
            console.log(`  → Deveria estar como "Entregue ao Usuário"`);
          }
        } else {
          console.log(`  Sem vinculação ativa`);
          console.log(`  → Deveria voltar para status anterior (ex: "Softwares Instalados")`);
        }
      });

      console.log('\n\nDeseja corrigir esses equipamentos? (Execute o script de correção)');
    }

    console.log('\n=== FIM DA INVESTIGAÇÃO ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigar();
