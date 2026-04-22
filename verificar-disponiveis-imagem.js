require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('=== VERIFICANDO DISPONÍVEIS E COM IMAGEM ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Total de equipamentos DISPONÍVEIS
    const totalDisponiveis = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
      },
    });

    // Equipamentos com imagem (Imagem Instalada ou Softwares Instalados)
    const comImagem = await prisma.equipamento.count({
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
        statusProcesso: { in: ['Imagem Instalada', 'Softwares Instalados'] },
      },
    });

    // Equipamentos DISPONÍVEIS sem imagem
    const disponiveisSemImagem = await prisma.equipamento.findMany({
      where: {
        projetoId: projeto.id,
        status: 'DISPONIVEL',
        statusProcesso: { notIn: ['Imagem Instalada', 'Softwares Instalados'] },
      },
      select: {
        id: true,
        serialNumber: true,
        statusProcesso: true,
        tipo: true,
      },
    });

    console.log(`📊 RESUMO:`);
    console.log(`   Total DISPONÍVEIS: ${totalDisponiveis}`);
    console.log(`   Com Imagem: ${comImagem}`);
    console.log(`   DISPONÍVEIS sem imagem: ${disponiveisSemImagem.length}\n`);

    if (disponiveisSemImagem.length > 0) {
      console.log('Equipamentos DISPONÍVEIS sem imagem:\n');
      disponiveisSemImagem.forEach(eq => {
        console.log(`${eq.serialNumber}:`);
        console.log(`  ID: ${eq.id}`);
        console.log(`  Tipo: ${eq.tipo || 'N/A'}`);
        console.log(`  StatusProcesso: ${eq.statusProcesso}\n`);
      });
    }

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificar();
