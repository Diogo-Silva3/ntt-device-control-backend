const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importarColaboradores() {
  try {
    console.log('🔍 Iniciando importação de colaboradores...\n');

    // Ler arquivo Excel
    const caminhoArquivo = process.argv[2];
    if (!caminhoArquivo) {
      console.error('❌ Erro: Forneça o caminho do arquivo Excel');
      console.error('Uso: node importar-colaboradores-bimbo.js <caminho-do-arquivo>');
      process.exit(1);
    }

    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`❌ Erro: Arquivo não encontrado: ${caminhoArquivo}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(caminhoArquivo);
    const worksheet = workbook.Sheets['Ativos'];
    
    if (!worksheet) {
      console.error('❌ Erro: Planilha "Ativos" não encontrada');
      process.exit(1);
    }

    const dados = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Total de linhas na planilha: ${dados.length}\n`);

    // Buscar colaboradores existentes no banco
    const colaboradoresExistentes = await prisma.usuario.findMany({
      select: { email: true, matricula: true }
    });

    const emailsExistentes = new Set(
      colaboradoresExistentes
        .filter(c => c.email)
        .map(c => c.email.toLowerCase())
    );

    const matriculasExistentes = new Set(
      colaboradoresExistentes
        .filter(c => c.matricula)
        .map(c => c.matricula)
    );

    console.log(`📦 Colaboradores já no banco: ${colaboradoresExistentes.length}`);
    console.log(`   - Emails únicos: ${emailsExistentes.size}`);
    console.log(`   - Matrículas únicas: ${matriculasExistentes.size}\n`);

    // Processar dados
    const resultado = {
      importados: [],
      duplicados: [],
      demitidos: [],
      erros: []
    };

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2; // +2 porque começa em linha 2 (depois do header)

      // Extrair dados
      const idBB = linha['ID BB']?.toString().trim();
      const nome = linha['NOME']?.toString().trim();
      const email = linha['E-MAIL']?.toString().trim().toLowerCase();
      const cargo = linha['CARGO']?.toString().trim();
      const status = linha['STATUS']?.toString().trim();

      // Validações básicas
      if (!nome || !email) {
        resultado.erros.push({
          linha: numeroLinha,
          motivo: 'Nome ou Email vazio'
        });
        continue;
      }

      // Pular DEMITIDO
      if (status === 'DEMITIDO') {
        resultado.demitidos.push({
          linha: numeroLinha,
          nome,
          email,
          matricula: idBB
        });
        continue;
      }

      // Verificar duplicata por EMAIL
      if (emailsExistentes.has(email)) {
        resultado.duplicados.push({
          linha: numeroLinha,
          nome,
          email,
          matricula: idBB,
          motivo: 'Email já existe no banco'
        });
        continue;
      }

      // Verificar duplicata por MATRÍCULA
      if (idBB && matriculasExistentes.has(idBB)) {
        resultado.duplicados.push({
          linha: numeroLinha,
          nome,
          email,
          matricula: idBB,
          motivo: 'Matrícula já existe no banco'
        });
        continue;
      }

      // Importar
      try {
        const novoColaborador = await prisma.usuario.create({
          data: {
            nome: nome.toUpperCase(),
            email,
            funcao: cargo || null,
            matricula: idBB || null,
            role: 'TECNICO',
            ativo: status === 'ATIVO' ? true : true, // Todos entram como ativo
            empresaId: 1 // Assumindo empresa ID 1 (ajuste conforme necessário)
          }
        });

        resultado.importados.push({
          linha: numeroLinha,
          id: novoColaborador.id,
          nome,
          email,
          matricula: idBB
        });

        emailsExistentes.add(email);
        if (idBB) matriculasExistentes.add(idBB);

      } catch (erro) {
        resultado.erros.push({
          linha: numeroLinha,
          nome,
          email,
          motivo: erro.message
        });
      }
    }

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RELATÓRIO DE IMPORTAÇÃO');
    console.log('='.repeat(60) + '\n');

    console.log(`✅ IMPORTADOS: ${resultado.importados.length}`);
    if (resultado.importados.length > 0) {
      console.log('   Primeiros 5:');
      resultado.importados.slice(0, 5).forEach(item => {
        console.log(`   - ${item.nome} (${item.email}) [Matrícula: ${item.matricula}]`);
      });
      if (resultado.importados.length > 5) {
        console.log(`   ... e mais ${resultado.importados.length - 5}`);
      }
    }

    console.log(`\n⚠️  DUPLICADOS (pulados): ${resultado.duplicados.length}`);
    if (resultado.duplicados.length > 0) {
      console.log('   Primeiros 5:');
      resultado.duplicados.slice(0, 5).forEach(item => {
        console.log(`   - ${item.nome} (${item.email}) - ${item.motivo}`);
      });
      if (resultado.duplicados.length > 5) {
        console.log(`   ... e mais ${resultado.duplicados.length - 5}`);
      }
    }

    console.log(`\n🚫 DEMITIDOS (não importados): ${resultado.demitidos.length}`);
    if (resultado.demitidos.length > 0) {
      console.log('   Primeiros 5:');
      resultado.demitidos.slice(0, 5).forEach(item => {
        console.log(`   - ${item.nome} (${item.email})`);
      });
      if (resultado.demitidos.length > 5) {
        console.log(`   ... e mais ${resultado.demitidos.length - 5}`);
      }
    }

    console.log(`\n❌ ERROS: ${resultado.erros.length}`);
    if (resultado.erros.length > 0) {
      console.log('   Primeiros 5:');
      resultado.erros.slice(0, 5).forEach(item => {
        console.log(`   - Linha ${item.linha}: ${item.motivo}`);
      });
      if (resultado.erros.length > 5) {
        console.log(`   ... e mais ${resultado.erros.length - 5}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESUMO FINAL`);
    console.log('='.repeat(60));
    console.log(`Total processado: ${dados.length}`);
    console.log(`✅ Importados: ${resultado.importados.length}`);
    console.log(`⚠️  Duplicados: ${resultado.duplicados.length}`);
    console.log(`🚫 Demitidos: ${resultado.demitidos.length}`);
    console.log(`❌ Erros: ${resultado.erros.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (erro) {
    console.error('❌ Erro fatal:', erro.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importarColaboradores();
