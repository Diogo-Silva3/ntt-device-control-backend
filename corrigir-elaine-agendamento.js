require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corrigir() {
  try {
    console.log('=== CORRIGINDO AGENDAMENTO DA ELAINE LOPES DOS SANTOS ===\n');

    // Buscar ELAINE LOPES DOS SANTOS
    const elaine = await prisma.usuario.findFirst({
      where: {
        nome: { contains: 'ELAINE LOPES' },
      },
      include: {
        vinculacoes: {
          where: { ativa: true },
          include: {
            equipamento: { 
              select: { 
                id: true,
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

    if (!elaine) {
      console.log('❌ ELAINE LOPES DOS SANTOS não encontrada');
      return;
    }

    console.log(`✓ Usuário: ${elaine.nome} (ID: ${elaine.id})`);
    console.log(`  Vinculações ativas: ${elaine.vinculacoes.length}\n`);

    if (elaine.vinculacoes.length === 0) {
      console.log('❌ ELAINE não tem vinculações ativas!');
      console.log('Vou buscar se existe vinculação inativa...\n');

      const vinculacaoInativa = await prisma.vinculacao.findFirst({
        where: {
          usuarioId: elaine.id,
          ativa: false,
          equipamento: {
            projeto: { nome: { contains: 'LAPTOP' } },
          },
        },
        include: {
          equipamento: { 
            select: { 
              id: true,
              serialNumber: true, 
              statusProcesso: true,
            } 
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (vinculacaoInativa) {
        console.log(`✓ Encontrada vinculação inativa (ID: ${vinculacaoInativa.id})`);
        console.log(`  Equipamento: ${vinculacaoInativa.equipamento.serialNumber}`);
        console.log(`  StatusEntrega: ${vinculacaoInativa.statusEntrega}`);
        console.log('\n🔧 Reativando vinculação...\n');

        await prisma.vinculacao.update({
          where: { id: vinculacaoInativa.id },
          data: { 
            ativa: true,
            statusEntrega: 'PENDENTE',
          },
        });

        await prisma.equipamento.update({
          where: { id: vinculacaoInativa.equipamento.id },
          data: { statusProcesso: 'Agendado para Entrega' },
        });

        console.log('✓ Vinculação reativada como PENDENTE');
        console.log('✓ Equipamento atualizado para "Agendado para Entrega"');
      } else {
        console.log('❌ Nenhuma vinculação inativa encontrada');
        console.log('Preciso criar uma nova vinculação para ELAINE');
      }

      console.log('\n✅ CORREÇÃO CONCLUÍDA!');
      console.log('\n⚠️  PRÓXIMO PASSO: Reiniciar o backend');
      console.log('   pm2 restart ntt-backend');
      return;
    }

    // Se tem vinculação ativa, verificar se está correta
    elaine.vinculacoes.forEach((v, index) => {
      console.log(`${index + 1}. Vinculação ID: ${v.id}`);
      console.log(`   Projeto: ${v.equipamento.projeto.nome}`);
      console.log(`   Equipamento: ${v.equipamento.serialNumber}`);
      console.log(`   StatusProcesso: ${v.equipamento.statusProcesso}`);
      console.log(`   StatusEntrega: ${v.statusEntrega}`);
      console.log(`   Técnico: ${v.tecnico?.nome || 'N/A'}`);
      console.log('');
    });

    // Verificar se precisa corrigir
    const vinculacaoLaptop = elaine.vinculacoes.find(v => 
      v.equipamento.projeto.nome.includes('LAPTOP')
    );

    if (!vinculacaoLaptop) {
      console.log('❌ ELAINE não tem vinculação no projeto LAPTOP');
      return;
    }

    console.log('📊 STATUS ATUAL:');
    console.log(`   StatusEntrega: ${vinculacaoLaptop.statusEntrega}`);
    console.log(`   StatusProcesso: ${vinculacaoLaptop.equipamento.statusProcesso}`);

    let corrigido = false;

    if (vinculacaoLaptop.statusEntrega !== 'PENDENTE') {
      console.log(`\n⚠️  StatusEntrega está como "${vinculacaoLaptop.statusEntrega}" mas deveria ser "PENDENTE"`);
      console.log('🔧 Corrigindo...\n');

      await prisma.vinculacao.update({
        where: { id: vinculacaoLaptop.id },
        data: { statusEntrega: 'PENDENTE' },
      });

      console.log('✓ StatusEntrega atualizado para PENDENTE');
      corrigido = true;
    }

    if (vinculacaoLaptop.equipamento.statusProcesso !== 'Agendado para Entrega') {
      console.log(`\n⚠️  StatusProcesso está como "${vinculacaoLaptop.equipamento.statusProcesso}" mas deveria ser "Agendado para Entrega"`);
      console.log('🔧 Corrigindo...\n');

      await prisma.equipamento.update({
        where: { id: vinculacaoLaptop.equipamento.id },
        data: { statusProcesso: 'Agendado para Entrega' },
      });

      console.log('✓ StatusProcesso atualizado para "Agendado para Entrega"');
      corrigido = true;
    }

    if (!corrigido) {
      console.log('\n✓ Vinculação já está correta!');
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

corrigir();
