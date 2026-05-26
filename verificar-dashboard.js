const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function verificar() {
  try {
    console.log('Conectando ao banco de dados...');

    const novo = await prisma.equipamento.count({ where: { statusProcesso: 'Novo' } });
    const imagemInstalada = await prisma.equipamento.count({ where: { statusProcesso: 'Imagem Instalada' } });
    const softwaresInstalados = await prisma.equipamento.count({ where: { statusProcesso: 'Softwares Instalados' } });
    const assetRegistrado = await prisma.equipamento.count({ where: { statusProcesso: 'Asset Registrado' } });
    const agendadoEntrega = await prisma.equipamento.count({ where: { statusProcesso: 'Agendado para Entrega' } });
    const entregueUsuario = await prisma.equipamento.count({ where: { statusProcesso: 'Entregue ao Usuário' } });
    
    const total = novo + imagemInstalada + softwaresInstalados + assetRegistrado + agendadoEntrega + entregueUsuario;

    console.log('\n=== DASHBOARD COUNTS ===');
    console.log('Novo:', novo);
    console.log('Imagem Instalada:', imagemInstalada);
    console.log('Softwares Instalados:', softwaresInstalados);
    console.log('Asset Registrado:', assetRegistrado);
    console.log('Agendado para Entrega:', agendadoEntrega);
    console.log('Entregue ao Usuário:', entregueUsuario);
    console.log('------------------------');
    console.log('TOTAL:', total);

    await prisma.$disconnect();
    process.exit(0);
  } catch(err) {
    console.error('Erro:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verificar();
