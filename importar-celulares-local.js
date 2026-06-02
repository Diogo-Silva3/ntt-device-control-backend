const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importarCelulares() {
  try {
    console.log('📱 Iniciando importação de celulares...');

    const ARQUIVO = path.join(__dirname, '..', 'template-celulares-2026.xlsx');

    // Verificar se arquivo existe
    if (!fs.existsSync(ARQUIVO)) {
      console.error(`❌ Arquivo não encontrado: ${ARQUIVO}`);
      process.exit(1);
    }

    // Ler arquivo Excel
    const workbook = XLSX.readFile(ARQUIVO);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de linhas: ${dados.length}`);

    if (dados.length === 0) {
      console.error('❌ Planilha vazia!');
      process.exit(1);
    }

    // Buscar empresa (BIMBO BRASIL)
    const empresa = await prisma.empresa.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    if (!empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    console.log(`✅ Empresa encontrada: ${empresa.nome}`);

    // Buscar projeto TECH REFRESH CELULARES 2026
    const projeto = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'CELULARES', mode: 'insensitive' }
      }
    });

    if (!projeto) {
      console.error('❌ Projeto TECH REFRESH CELULARES 2026 não encontrado');
      process.exit(1);
    }

    console.log(`✅ Projeto encontrado: ${projeto.nome}`);

    // Buscar unidade
    const unidade = await prisma.unidade.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'RAPOSO', mode: 'insensitive' }
      }
    });

    if (!unidade) {
      console.error('❌ Unidade não encontrada');
      process.exit(1);
    }

    console.log(`✅ Unidade encontrada: ${unidade.nome}`);

    // Importar equipamentos
    let criados = 0;
    let erros = 0;

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;

      try {
        const serialNumber = linha['N° Série'] || linha['Serial Number'] || linha['Serie'];
        const marca = linha['Marca'] || 'Samsung';
        const modelo = linha['Modelo'] || 'Galaxy A17 256GB';
        const tipo = linha['Tipo'] || 'Celular';
        const patrimonio = linha['Patrimônio'] || null;
        const observacao = linha['Observação'] || null;

        if (!serialNumber) {
          console.warn(`⚠️  Linha ${numeroLinha}: Número de série vazio`);
          erros++;
          continue;
        }

        // Verificar se já existe
        const existe = await prisma.equipamento.findFirst({
          where: {
            serialNumber: String(serialNumber).trim(),
            empresaId: empresa.id
          }
        });

        if (existe) {
          console.log(`⏭️  Linha ${numeroLinha}: ${serialNumber} já existe`);
          continue;
        }

        // Criar equipamento
        const equipamento = await prisma.equipamento.create({
          data: {
            serialNumber: String(serialNumber).trim(),
            marca,
            modelo,
            tipo,
            patrimonio,
            observacao,
            status: 'DISPONIVEL',
            statusProcesso: 'Novo',
            empresaId: empresa.id,
            projetoId: projeto.id,
            unidadeId: unidade.id
          }
        });

        console.log(`✅ Linha ${numeroLinha}: ${serialNumber} importado (ID: ${equipamento.id})`);
        criados++;

      } catch (err) {
        console.error(`❌ Linha ${numeroLinha}: ${err.message}`);
        erros++;
      }
    }

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Criados: ${criados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📱 Total: ${dados.length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importarCelulares();
