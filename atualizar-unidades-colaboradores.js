const prisma = require('./src/config/prisma');
const XLSX = require('xlsx');
const path = require('path');

async function atualizarUnidades() {
  try {
    console.log('📋 Lendo arquivo de colaboradores...\n');

    // Ler arquivo Excel
    const filePath = path.join('C:\\Temp\\wickbold', 'Colaboradores.xlsx');
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Arquivo lido com sucesso! Total de linhas: ${dados.length}\n`);

    // Buscar todas as unidades para mapear nomes para IDs
    const unidades = await prisma.unidade.findMany({
      select: { id: true, nome: true }
    });
    const unidadeMap = {};
    unidades.forEach(u => {
      unidadeMap[u.nome.toUpperCase().trim()] = u.id;
    });

    console.log('🔍 Processando colaboradores...\n');

    let atualizados = 0;
    let erros = 0;
    const relatorio = [];

    for (const linha of dados) {
      try {
        // Extrair dados da linha (com tratamento de espaços)
        const email = (linha['E-MAIL'] || linha['Email'] || linha['email'] || '').trim();
        const nome = (linha['NOME'] || linha['Nome'] || linha['nome'] || '').trim();
        const cargo = (linha['CARGO'] || linha['Cargo'] || linha['cargo'] || '').trim();
        let unidadeNova = (linha['UNIDADE '] || linha['UNIDADE'] || linha['unidade'] || '').toString().trim();

        if (!email || !unidadeNova) {
          console.log(`⚠️  Linha incompleta: email="${email}", unidade="${unidadeNova}"`);
          erros++;
          relatorio.push({
            email,
            unidade: unidadeNova,
            status: 'ERRO',
            motivo: 'Dados incompletos'
          });
          continue;
        }

        // Ignorar linhas onde a unidade é um número
        if (/^\d+$/.test(unidadeNova)) {
          console.log(`⏭️  Ignorando (unidade é número): ${email} - Unidade: ${unidadeNova}`);
          continue;
        }

        // Buscar ID da unidade nova
        const unidadeNovaId = unidadeMap[unidadeNova.toUpperCase()];
        if (!unidadeNovaId) {
          console.log(`❌ Unidade não encontrada: "${unidadeNova}"`);
          erros++;
          relatorio.push({
            email,
            unidade: unidadeNova,
            status: 'ERRO',
            motivo: `Unidade "${unidadeNova}" não existe no sistema`
          });
          continue;
        }

        // Buscar usuário pelo email
        let usuario = await prisma.usuario.findFirst({
          where: { email: email.toLowerCase() },
          select: { id: true, nome: true, email: true, unidadeId: true, unidade: { select: { nome: true } } }
        });

        // Se não encontrou, criar novo usuário
        if (!usuario) {
          console.log(`➕ Criando novo usuário: ${nome} (${email})`);
          usuario = await prisma.usuario.create({
            data: {
              nome: nome.toUpperCase(),
              email: email.toLowerCase(),
              funcao: cargo || null,
              role: 'TECNICO',
              empresaId: 1, // Assumindo empresa ID 1 (ajuste se necessário)
              unidadeId: unidadeNovaId,
              ativo: true
            },
            select: { id: true, nome: true, email: true, unidadeId: true, unidade: { select: { nome: true } } }
          });
          console.log(`✅ Usuário criado: ${usuario.nome}`);
          atualizados++;
          relatorio.push({
            email,
            nome: usuario.nome,
            unidadeAnterior: 'Novo usuário',
            unidadeNova: usuario.unidade?.nome,
            status: 'CRIADO'
          });
          continue;
        }

        // Se encontrou, atualizar unidade
        const usuarioAtualizado = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { unidadeId: unidadeNovaId },
          select: { id: true, nome: true, email: true, unidade: { select: { nome: true } } }
        });

        console.log(`✅ ${usuario.nome} (${email})`);
        console.log(`   ${usuario.unidade?.nome || 'Sem unidade'} → ${usuarioAtualizado.unidade?.nome}`);

        atualizados++;
        relatorio.push({
          email,
          nome: usuario.nome,
          unidadeAnterior: usuario.unidade?.nome || 'Sem unidade',
          unidadeNova: usuarioAtualizado.unidade?.nome,
          status: 'ATUALIZADO'
        });

      } catch (err) {
        console.error(`❌ Erro ao processar ${linha['E-MAIL']}:`, err.message);
        erros++;
        relatorio.push({
          email: linha['E-MAIL'],
          unidade: linha['UNIDADE '],
          status: 'ERRO',
          motivo: err.message
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(80));
    console.log(`✅ Atualizados com sucesso: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processado: ${dados.length}`);
    console.log('='.repeat(80));

    // Salvar relatório em arquivo
    const fs = require('fs');
    const relatorioPath = path.join('backend', `relatorio-unidades-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
    console.log(`\n📄 Relatório salvo em: ${relatorioPath}`);

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

atualizarUnidades();
