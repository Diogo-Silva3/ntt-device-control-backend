require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO AGENDAMENTO DA ADRIANA ===\n');

    // Buscar ADRIANA MAIA DE MORAIS
    const adriana = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'ADRIANA MAIA' },
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            equipamento: { 
              select: { 
                serialNumber: true, 
                statusProcesso: true,
                projeto: { select: { nome: true } },
              } 
            },
            tecnico: { select: { nome: true } },
          },
        },
      },
    });

    if (!adriana) {
      console.log('❌ ADRIANA não encontrada');
      return;
    }

    console.log(`✓ Usuário: ${adriana.nome} (ID: ${adriana.id})`);
    console.log(`  Vinculações ativas: ${adriana.vinculacoes.length}\n`);

    if (adriana.vinculacoes.length === 0) {
      console.log('❌ ADRIANA não tem vinculações ativas!');
      return;
    }

    adriana.vinculacoes.forEach((v, index) => {
      console.log(`${index + 1}. Vinculação ID: ${v.id}`);
      console.log(`   Projeto: ${v.equipamento.projeto.nome}`);
      console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
      console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
      console.log(`   StatusEntrega: ${v.statusEntrega}`);
      console.log(`   Técnico: ${v.tecnico?.nome || 'N/A'}`);
      console.log(`   Data Agendamento: ${v.dataAgendamento || 'N/A'}`);
      console.log('');
    });

    // Verificar se precisa corrigir
    const vinculacaoLaptop = adriana.vinculacoes.find(v => 
      v.equipamento.projeto.nome.includes('LAPTOP')
    );

    if (!vinculacaoLaptop) {
      console.log('❌ ADRIANA não tem vinculação no projeto LAPTOP');
      return;
    }

    console.log('📊 STATUS ATUAL:');
    console.log(`   StatusEntrega: ${vinculacaoLaptop.statusEntrega}`);
    console.log(`   StatusProcesso: ${vinculacaoLaptop.equipamento.statusProcesso}`);

    if (vinculacaoLaptop.statusEntrega !== 'PENDENTE') {
      console.log(`\n⚠️  StatusEntrega está como "${vinculacaoLaptop.statusEntrega}" mas deveria ser "PENDENTE"`);
      console.log('🔧 Corrigindo...\n');

      await prisma.vinculacao.update({
        where: { id: vinculacaoLaptop.id },
        data: { statusEntrega: 'PENDENTE' },
      });

      console.log('✓ StatusEntrega atualizado para PENDENTE');
    }

    if (vinculacaoLaptop.equipamento.statusProcesso !== 'Agendado para Entrega') {
      console.log(`\n⚠️  StatusProcesso está como "${vinculacaoLaptop.equipamento.statusProcesso}" mas deveria ser "Agendado para Entrega"`);
      console.log('🔧 Corrigindo...\n');

      await prisma.equipamento.update({
        where: { serialNumber: vinculacaoLaptop.equipamento.serialNumber },
        data: { statusProcesso: 'Agendado para Entrega' },
      });

      console.log('✓ StatusProcesso atualizado para "Agendado para Entrega"');
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
    console.log('   pm2 restart ntt-backend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
