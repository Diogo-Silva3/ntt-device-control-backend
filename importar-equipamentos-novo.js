const prisma = require('./src/config/prisma');
const XLSX = require('xlsx');
const path = require('path');

async function importarEquipamentos() {
  try {
    console.log('📦 Importando equipamentos...\n');

    // Ler arquivo
    const filePath = path.join('C:\\Temp\\wickbold', 'template-equipamentos-importacao.xlsx');
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Arquivo lido com sucesso! Total: ${dados.length}\n`);

    // Buscar unidades e projetos
    const unidades = await prisma.unidade.findMany({ select: { id: true, nome: true } });
    const projetos = await prisma.projeto.findMany({ select: { id: true, nome: true } });

    const unidadeMap = {};
    const projetoMap = {};

    unidades.forEach(u => {
      unidadeMap[u.nome.toUpperCase().trim()] = u.id;
    });

    projetos.forEach(p => {
      projetoMap[p.nome.toUpperCase().trim()] = p.id;
    });

    let importados = 0;
    let erros = 0;
    const relatorio = [];

    for (const linha of dados) {
      try {
        const serialNumber = (linha['Serial Number'] || '').toString().trim();
        const marca = (linha['Marca'] || '').toString().trim();
        const modelo = (linha['Modelo'] || '').toString().trim();
        const tipo = (linha['Tipo'] || '').toString().trim();
        const unidadeNome = (linha['Unidade'] || '').toString().trim();
        const projetoNome = (linha['Projeto'] || '').toString().trim();
        const patrimonio = (linha['Patrimônio'] || '').toString().trim() || null;
        const status = (linha['Status'] || 'DISPONIVEL').toString().trim();
        const observacoes = (linha['Observações'] || '').toString().trim() || null;

        // Validar dados obrigatórios
        if (!serialNumber || !marca || !modelo || !tipo || !unidadeNome || !projetoNome) {
          console.log(`❌ Linha incompleta: ${serialNumber}`);
          erros++;
          continue;
        }

        // Buscar IDs
        const unidadeId = unidadeMap[unidadeNome.toUpperCase()];
        const projetoId = projetoMap[projetoNome.toUpperCase()];

        if (!unidadeId) {
          console.log(`❌ Unidade não encontrada: ${unidadeNome}`);
          erros++;
          continue;
        }

        if (!projetoId) {
          console.log(`❌ Projeto não encontrado: ${projetoNome}`);
          erros++;
          continue;
        }

        // Verificar se já existe
        const existe = await prisma.equipamento.findFirst({
          where: { serialNumber }
        });

        if (existe) {
          console.log(`⚠️  Equipamento já existe: ${serialNumber}`);
          erros++;
          continue;
        }

        // Criar equipamento
        const equipamento = await prisma.equipamento.create({
          data: {
            serialNumber,
            marca,
            modelo,
            tipo,
            patrimonio,
            status,
            statusProcesso: 'Novo',
            observacao: observacoes,
            unidadeId,
            projetoId,
            empresaId: 1 // Assumindo empresa ID 1
          },
          include: { unidade: true, projeto: true }
        });

        console.log(`✅ ${serialNumber} - ${marca} ${modelo}`);
        console.log(`   Unidade: ${equipamento.unidade?.nome} | Projeto: ${equipamento.projeto?.nome}`);

        importados++;
        relatorio.push({
          serialNumber,
          marca,
          modelo,
          unidade: equipamento.unidade?.nome,
          projeto: equipamento.projeto?.nome,
          status: 'OK'
        });

      } catch (err) {
        console.error(`❌ Erro ao importar ${linha['Serial Number']}:`, err.message);
        erros++;
        relatorio.push({
          serialNumber: linha['Serial Number'],
          status: 'ERRO',
          motivo: err.message
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(80));
    console.log(`✅ Equipamentos importados: ${importados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processado: ${dados.length}`);
    console.log('='.repeat(80));

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

importarEquipamentos();
