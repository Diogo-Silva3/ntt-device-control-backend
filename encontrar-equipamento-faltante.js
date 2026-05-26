const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function encontrar() {
  try {
    console.log('Procurando equipamento faltante...\n');

    // Status que o dashboard conta
    const statusContados = [
      'Novo',
      'Imagem Instalada',
      'Softwares Instalados',
      'Asset Registrado',
      'Agendado para Entrega',
      'Entregue ao Usuário'
    ];

    // Contar equipamentos por status
    const equipamentosPorStatus = await prisma.equipamento.groupBy({
      by: ['statusProcesso'],
      _count: true,
    });

    console.log('=== EQUIPAMENTOS POR STATUS ===');
    let totalContado = 0;
    equipamentosPorStatus.forEach(item => {
      const status = item.statusProcesso || 'NULL/VAZIO';
      const count = item._count;
      const estaContado = statusContados.includes(item.statusProcesso);
      console.log(`${status}: ${count} ${estaContado ? '✓' : '✗ NÃO CONTADO'}`);
      if (estaContado) totalContado += count;
    });

    console.log('\n=== RESUMO ===');
    console.log('Total contado no dashboard:', totalContado);
    console.log('Total no banco:', equipamentosPorStatus.reduce((sum, item) => sum + item._count, 0));

    // Encontrar equipamentos com status não contado
    console.log('\n=== EQUIPAMENTOS NÃO CONTABILIZADOS ===');
    const naoContados = await prisma.equipamento.findMany({
      where: {
        statusProcesso: {
          notIn: statusContados
        }
      },
      select: {
        id: true,
        serialNumber: true,
        marca: true,
        modelo: true,
        statusProcesso: true,
        tipo: true,
      }
    });

    if (naoContados.length > 0) {
      console.log(`Encontrados ${naoContados.length} equipamento(s) não contabilizado(s):\n`);
      naoContados.forEach(eq => {
        console.log(`ID: ${eq.id}`);
        console.log(`Serial: ${eq.serialNumber}`);
        console.log(`Marca/Modelo: ${eq.marca} ${eq.modelo}`);
        console.log(`Tipo: ${eq.tipo}`);
        console.log(`Status: "${eq.statusProcesso}"`);
        console.log('---');
      });
    } else {
      console.log('Nenhum equipamento com status não contado encontrado.');
      console.log('\nVerificando se há equipamentos com statusProcesso NULL ou vazio...');
      
      const comStatusNulo = await prisma.equipamento.findMany({
        where: {
          statusProcesso: null
        },
        select: {
          id: true,
          serialNumber: true,
          marca: true,
          modelo: true,
          statusProcesso: true,
        }
      });

      if (comStatusNulo.length > 0) {
        console.log(`\nEncontrados ${comStatusNulo.length} equipamento(s) com statusProcesso NULL:\n`);
        comStatusNulo.forEach(eq => {
          console.log(`ID: ${eq.id}`);
          console.log(`Serial: ${eq.serialNumber}`);
          console.log(`Marca/Modelo: ${eq.marca} ${eq.modelo}`);
          console.log('---');
        });
      }
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch(err) {
    console.error('Erro:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

encontrar();
