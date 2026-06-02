const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importarEquipamentosVPS() {
  try {
    console.log('📥 Importando equipamentos na VPS...');

    const arquivo = path.join(__dirname, '..', 'equipamentos-export.json');

    if (!fs.existsSync(arquivo)) {
      console.error(`❌ Arquivo não encontrado: ${arquivo}`);
      process.exit(1);
    }

    const equipamentos = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    console.log(`📊 Total de equipamentos para importar: ${equipamentos.length}`);

    let criados = 0;
    let atualizados = 0;
    let erros = 0;

    for (const eq of equipamentos) {
      try {
        // Verificar se já existe
        const existe = await prisma.equipamento.findUnique({
          where: { id: eq.id }
        });

        if (existe) {
          // Atualizar
          await prisma.equipamento.update({
            where: { id: eq.id },
            data: {
              serialNumber: eq.serialNumber,
              marca: eq.marca,
              modelo: eq.modelo,
              tipo: eq.tipo,
              patrimonio: eq.patrimonio,
              status: eq.status,
              statusProcesso: eq.statusProcesso,
              observacao: eq.observacao,
              projetoId: eq.projetoId,
              unidadeId: eq.unidadeId
            }
          });
          atualizados++;
        } else {
          // Criar
          await prisma.equipamento.create({
            data: {
              id: eq.id,
              serialNumber: eq.serialNumber,
              marca: eq.marca,
              modelo: eq.modelo,
              tipo: eq.tipo,
              patrimonio: eq.patrimonio,
              status: eq.status,
              statusProcesso: eq.statusProcesso,
              observacao: eq.observacao,
              empresaId: eq.empresaId,
              projetoId: eq.projetoId,
              unidadeId: eq.unidadeId,
              createdAt: new Date(eq.createdAt),
              updatedAt: new Date(eq.updatedAt)
            }
          });
          criados++;
        }

        if ((criados + atualizados) % 50 === 0) {
          console.log(`  ✅ Processados: ${criados + atualizados}/${equipamentos.length}`);
        }

      } catch (err) {
        console.error(`  ❌ Erro ao processar ID ${eq.id}: ${err.message}`);
        erros++;
      }
    }

    console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log(`✅ Criados: ${criados}`);
    console.log(`🔄 Atualizados: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importarEquipamentosVPS();
