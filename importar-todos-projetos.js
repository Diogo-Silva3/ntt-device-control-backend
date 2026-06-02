const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importarTodosProjetos() {
  try {
    console.log('📱 Iniciando importação de TODOS os projetos...\n');

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

    console.log(`📊 Total de linhas: ${dados.length}\n`);

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

    console.log(`✅ Empresa encontrada: ${empresa.nome}\n`);

    // Buscar todos os projetos
    const projetos = await prisma.projeto.findMany({
      where: { empresaId: empresa.id }
    });

    const projetoMap = {};
    projetos.forEach(p => {
      projetoMap[p.nome.toUpperCase()] = p;
    });

    console.log(`✅ Projetos encontrados: ${projetos.length}`);
    projetos.forEach(p => console.log(`   - ${p.nome}`));
    console.log();

    // Buscar todas as unidades
    const unidades = await prisma.unidade.findMany({
      where: { empresaId: empresa.id }
    });

    const unidadeMap = {};
    unidades.forEach(u => {
      unidadeMap[u.nome.toUpperCase()] = u;
    });

    // Agrupar dados por projeto
    const dadosPorProjeto = {};
    dados.forEach(linha => {
      const nomeProjeto = (linha['Projeto'] || 'SEM PROJETO').toUpperCase();
      if (!dadosPorProjeto[nomeProjeto]) {
        dadosPorProjeto[nomeProjeto] = [];
      }
      dadosPorProjeto[nomeProjeto].push(linha);
    });

    // Importar por projeto
    let totalCriados = 0;
    let totalErros = 0;

    for (const [nomeProjeto, linhas] of Object.entries(dadosPorProjeto)) {
      console.log(`\n📦 Importando projeto: ${nomeProjeto}`);
      console.log(`   Equipamentos: ${linhas.length}`);

      // Encontrar projeto
      const projeto = projetos.find(p => p.nome.toUpperCase().includes(nomeProjeto.split(' ')[0]));
      
      if (!projeto) {
        console.warn(`   ⚠️  Projeto não encontrado, pulando...`);
        totalErros += linhas.length;
        continue;
      }

      console.log(`   ✅ Projeto ID: ${projeto.id}`);

      let criados = 0;
      let erros = 0;

      for (let idx = 0; idx < linhas.length; idx++) {
        const linha = linhas[idx];
        const numeroLinha = dados.indexOf(linha) + 2;

        try {
          const serialNumber = linha['N° Série'] || linha['Serial Number'] || linha['Serie'];
          const marca = linha['Marca'] || 'N/A';
          const modelo = linha['Modelo'] || 'N/A';
          const tipo = linha['Tipo'] || 'EQUIPAMENTO';
          const unidadeNome = (linha['Unidade'] || 'RAPOSO').toUpperCase();
          const patrimonio = linha['Patrimônio'] || null;
          const observacao = linha['Observação'] || null;

          if (!serialNumber) {
            console.warn(`   ⚠️  Linha ${numeroLinha}: Número de série vazio`);
            erros++;
            continue;
          }

          // Encontrar unidade
          const unidade = unidadeMap[unidadeNome] || unidades[0];

          // Verificar se já existe
          const existe = await prisma.equipamento.findFirst({
            where: {
              serialNumber: String(serialNumber).trim(),
              empresaId: empresa.id
            }
          });

          if (existe) {
            console.log(`   ⏭️  Linha ${numeroLinha}: ${serialNumber} já existe`);
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

          console.log(`   ✅ ${serialNumber} (ID: ${equipamento.id})`);
          criados++;

        } catch (err) {
          console.error(`   ❌ Linha ${numeroLinha}: ${err.message}`);
          erros++;
        }
      }

      console.log(`   📊 Resultado: ${criados} criados, ${erros} erros`);
      totalCriados += criados;
      totalErros += erros;
    }

    console.log('\n\n🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log(`✅ Total criados: ${totalCriados}`);
    console.log(`❌ Total erros: ${totalErros}`);
    console.log(`📱 Total processado: ${dados.length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importarTodosProjetos();
