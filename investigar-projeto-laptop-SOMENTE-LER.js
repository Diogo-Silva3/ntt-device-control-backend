require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigar() {
  try {
    console.log('=== INVESTIGAÇÃO - APENAS LEITURA (NÃO ALTERA NADA) ===\n');

    // Buscar projeto LAPTOP
    const projeto = await prisma.projeto.findFirst({
      where: {
        nome: {
          contains: 'LAPTOP',
        },
      },
    });

    if (!projeto) {
      console.log('Projeto LAPTOP não encontrado');
      return;
    }

    console.log(`Projeto: ${projeto.nome} (ID: ${projeto.id})\n`);

    // Contar vinculações ENTREGUES do projeto
    const vinculacoesEntregues = await prisma.vinculacao.findMany({
      where: {
        statusEntrega: 'ENTREGUE',
        equipamento: {
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            statusProcesso: true,
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    });

    console.log(`Vinculações ENTREGUES: ${vinculacoesEntregues.length}`);
    console.log('(Deveria ser 34)\n');

    // Contar vinculações PENDENTES do projeto
    const vinculacoesPendentes = await prisma.vinculacao.findMany({
      where: {
        ativa: true,
        statusEntrega: 'PENDENTE',
        equipamento: {
          projetoId: projeto.id,
        },
      },
      include: {
        equipamento: {
          select: {
            serialNumber: true,
            statusProcesso: true,
          },
        },
      },
    });

    console.log(`Vinculações PENDENTES: ${vinculacoesPendentes.length}`);
    console.log('(Deveria ser 1)\n');

    // Verificar equipamentos com statusProcesso incorreto
    const entreguesComStatusErrado = vinculacoesEntregues.filter(v => 
      v.equipamento && 
      v.equipamento.statusProcesso !== 'Entregue ao Usuário' &&
      v.equipamento.statusProcesso !== 'Em Uso'
    );

    if (entreguesComStatusErrado.length > 0) {
      console.log(`\n⚠️  ${entreguesComStatusErrado.length} vinculações ENTREGUES mas equipamento com statusProcesso errado:\n`);
      entreguesComStatusErrado.forEach(v => {
        console.log(`- ${v.equipamento.serialNumber}`);
        console.log(`  Colaborador: ${v.usuario.nome}`);
        console.log(`  StatusProcesso atual: ${v.equipamento.statusProcesso}`);
        console.log(`  Deveria ser: "Entregue ao Usuário"`);
        console.log('');
      });
    }

    console.log('\n=== FIM DA INVESTIGAÇÃO (NADA FOI ALTERADO) ===');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigar();
