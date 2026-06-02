const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importar3ProjetosCorreto() {
  try {
    console.log('📱 Importando 3 projetos com UNIDADES CORRETAS...\n');

    const ARQUIVO = path.join(__dirname, '..', 'template-celulares-2026.xlsx');

    if (!fs.existsSync(ARQUIVO)) {
      console.error(`❌ Arquivo não encontrado: ${ARQUIVO}`);
      process.exit(1);
    }

    // Ler arquivo Excel
    const workbook = XLSX.readFile(ARQUIVO);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de linhas no arquivo: ${dados.length}\n`);

    // Buscar empresa
    const empresa = await prisma.empresa.findFirst({
      where: { nome: { contains: 'BIMBO', mode: 'insensitive' } }
    });

    if (!empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    console.log(`✅ Empresa: ${empresa.nome}\n`);

    // Buscar os 3 projetos
    const ck65 = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'CK65', mode: 'insensitive' }
      }
    });

    const pm45 = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'PM45', mode: 'insensitive' }
      }
    });

    const celulares = await prisma.projeto.findFirst({
      where: {
        empresaId: empresa.id,
        nome: { contains: 'CELULARES', mode: 'insensitive' }
      }
    });

    console.log(`✅ Projetos encontrados:`);
    console.log(`   - HONEYWELL CK65 (ID: ${ck65.id})`);
    console.log(`   - HONEYWELL PM45 (ID: ${pm45.id})`);
    console.log(`   - CELULARES (ID: ${celulares.id})\n`);

    // Buscar todas as unidades
    const unidades = await prisma.unidade.findMany({
      where: { empresaId: empresa.id }
    });

    const unidadeMap = {};
    unidades.forEach(u => {
      unidadeMap[u.nome.toUpperCase()] = u;
    });

    console.log(`✅ Unidades disponíveis:`);
    Object.keys(unidadeMap).forEach(nome => {
      console.log(`   - ${nome}`);
    });
    console.log();

    // Agrupar dados por projeto
    const dadosPorProjeto = {};
    dados.forEach(linha => {
      const nomeProjeto = (linha['Projeto'] || 'SEM PROJETO').toUpperCase();
      if (!dadosPorProjeto[nomeProjeto]) {
        dadosPorProjeto[nomeProjeto] = [];
      }
      dadosPorProjeto[nomeProjeto].push(linha);
    });

    // Importar APENAS os 3 projetos
    const projetosParaImportar = [
      { nome: 'TECH REFRESH HONEYWELL CK65 2026', projeto: ck65, linhas: dadosPorProjeto['TECH REFRESH HONEYWELL CK65 2026'] || [] },
      { nome: 'TECH REFRESH HONEYWELL PM 45 2026', projeto: pm45, linhas: dadosPorProjeto['TECH REFRESH HONEYWELL PM 45 2026'] || [] },
      { nome: 'TECH REFRESH CELULARES 2026', projeto: celulares, linhas: dadosPorProjeto['TECH REFRESH CELULARES 2026'] || [] }
    ];

    let totalCriados = 0;
    let totalAtualizados = 0;
    let totalErros = 0;

    for (const item of projetosParaImportar) {
      console.log(`📦 ${item.nome}`);
      console.log(`   Equipamentos: ${item.linhas.length}`);

      let criados = 0;
      let atualizados = 0;
      let erros = 0;

      for (const linha of item.linhas) {
        try {
          const serialNumber = linha['N° Série'] || linha['Serial Number'] || linha['Serie'];
          const marca = linha['Marca'] || 'N/A';
          const modelo = linha['Modelo'] || 'N/A';
          const tipo = linha['Tipo'] || 'EQUIPAMENTO';
          const unidadeNome = (linha['Unidade'] || 'WB - RJ').toUpperCase();
          const patrimonio = linha['Patrimônio'] || null;
          const observacao = linha['Observação'] || null;

          if (!serialNumber) {
            erros++;
            continue;
          }

          // Encontrar unidade
          const unidade = unidadeMap[unidadeNome] || unidadeMap[unidadeNome.trim()];
          if (!unidade) {
            console.warn(`   ⚠️  Unidade "${unidadeNome}" não encontrada`);
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
            // Atualizar unidade se estiver diferente
            if (existe.unidadeId !== unidade.id) {
              await prisma.equipamento.update({
                where: { id: existe.id },
                data: { unidadeId: unidade.id }
              });
              atualizados++;
            }
            continue;
          }

          // Criar equipamento
          await prisma.equipamento.create({
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
              projetoId: item.projeto.id,
              unidadeId: unidade.id
            }
          });

          criados++;

        } catch (err) {
          console.error(`   ❌ Erro: ${err.message}`);
          erros++;
        }
      }

      console.log(`   ✅ Criados: ${criados}`);
      console.log(`   🔄 Atualizados: ${atualizados}`);
      console.log(`   ❌ Erros: ${erros}\n`);
      totalCriados += criados;
      totalAtualizados += atualizados;
      totalErros += erros;
    }

    console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log(`✅ Total criados: ${totalCriados}`);
    console.log(`🔄 Total atualizados: ${totalAtualizados}`);
    console.log(`❌ Total erros: ${totalErros}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importar3ProjetosCorreto();
