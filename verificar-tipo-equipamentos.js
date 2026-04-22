require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarTipos() {
  try {
    console.log('=== VERIFICANDO TIPOS DE EQUIPAMENTOS NO PROJETO LAPTOP ===\n');

    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'LAPTOP' } },
    });

    // Buscar todos os equipamentos do projeto agrupados por tipo
    const equipamentosPorTipo = await prisma.equipamento.groupBy({
      by: ['tipo'],
      where: {
        projetoId: projeto.id,
        status: { not: 'DESCARTADO' },
      },
      _count: { tipo: true },
    });

    console.log('Equipamentos por tipo:\n');
    
    let totalLaptops = 0;
    let totalOutros = 0;

    equipamentosPorTipo.forEach(grupo => {
      const tipo = grupo.tipo || 'SEM TIPO';
      const count = grupo._count.tipo;
      
      console.log(`${tipo}: ${count}`);
      
      if (tipo.toUpperCase().includes('LAPTOP') || tipo.toUpperCase().includes('NOTEBOOK')) {
        totalLaptops += count;
      } else {
        totalOutros += count;
      }
    });

    console.log(`\n📊 RESUMO:`);
    console.log(`   Laptops: ${totalLaptops}`);
    console.log(`   Outros: ${totalOutros}`);
    console.log(`   Total: ${totalLaptops + totalOutros}`);

    if (totalOutros > 0) {
      console.log(`\n❌ ENCONTRADOS ${totalOutros} EQUIPAMENTOS QUE NÃO SÃO LAPTOPS!\n`);
      
      // Listar os equipamentos que não são laptops
      const naoLaptops = await prisma.equipamento.findMany({
        where: {
          projetoId: projeto.id,
          status: { not: 'DESCARTADO' },
          tipo: {
            not: {
              contains: 'Laptop',
            },
          },
        },
        select: {
          id: true,
          serialNumber: true,
          tipo: true,
          marca: true,
          modelo: true,
          status: true,
          statusProcesso: true,
        },
      });

      console.log('Equipamentos que NÃO são laptops:\n');
      naoLaptops.forEach(eq => {
        console.log(`${eq.serialNumber}:`);
        console.log(`  ID: ${eq.id}`);
        console.log(`  Tipo: ${eq.tipo || 'SEM TIPO'}`);
        console.log(`  Marca: ${eq.marca}`);
        console.log(`  Modelo: ${eq.modelo}`);
        console.log(`  Status: ${eq.status}`);
        console.log(`  StatusProcesso: ${eq.statusProcesso}\n`);
      });
    } else {
      console.log('\n✅ Todos os equipamentos são laptops!');
    }

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTipos();
