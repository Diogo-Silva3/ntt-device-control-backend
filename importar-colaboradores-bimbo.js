const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importarColaboradores() {
  try {
    console.log('🚀 Iniciando importação de colaboradores...\n');

    // 1. Encontrar empresa "BIMBO BRASIL"
    console.log('📍 Procurando empresa "BIMBO BRASIL"...');
    const empresa = await prisma.empresa.findFirst({
      where: {
        nome: {
          contains: 'BIMBO',
          mode: 'insensitive'
        }
      }
    });

    if (!empresa) {
      console.error('❌ Empresa "BIMBO BRASIL" não encontrada!');
      console.log('\n📋 Empresas disponíveis:');
      const empresas = await prisma.empresa.findMany({
        select: { id: true, nome: true }
      });
      empresas.forEach(e => console.log(`   ID: ${e.id} - ${e.nome}`));
      process.exit(1);
    }

    console.log(`✅ Empresa encontrada: ID ${empresa.id} - ${empresa.nome}\n`);

    // 2. Ler arquivo Excel
    console.log('📂 Lendo arquivo modelo_colaboradores.xlsx...');
    const caminhoArquivo = 'C:\\Temp\\wickbold\\modelo_colaboradores.xlsx';
    
    if (!require('fs').existsSync(caminhoArquivo)) {
      console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(caminhoArquivo);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Arquivo lido: ${dados.length} colaboradores encontrados\n`);

    // 3. Buscar usuários existentes (TODA A PLATAFORMA)
    console.log('🔍 Verificando usuários existentes no sistema...');
    const usuariosExistentes = await prisma.usuario.findMany({
      select: { email: true, id: true, nome: true, empresaId: true }
    });

    const emailsExistentes = new Map();
    usuariosExistentes.forEach(u => {
      if (u.email) {
        emailsExistentes.set(u.email.toLowerCase(), {
          id: u.id,
          nome: u.nome,
          empresaId: u.empresaId
        });
      }
    });

    console.log(`✅ ${usuariosExistentes.length} usuários encontrados no sistema\n`);

    // 4. Processar importação
    console.log('⚙️  Processando importação...\n');
    
    const resultado = {
      criados: 0,
      pulados: 0,
      erros: 0,
      detalhes: []
    };

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;

      try {
        // Extrair dados
        const nome = linha['Nome']?.toString().trim();
        const email = linha['Email']?.toString().trim().toLowerCase();
        const funcao = linha['Função']?.toString().trim();
        const unidade = linha['Unidade']?.toString().trim();

        // Pular linhas vazias
        if (!nome || !email) {
          continue;
        }

        // Validar email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          resultado.erros++;
          resultado.detalhes.push({
            linha: numeroLinha,
            nome,
            email,
            status: 'ERRO',
            motivo: 'Email inválido'
          });
          continue;
        }

        // VERIFICAR SE EMAIL JÁ EXISTE (em qualquer empresa)
        if (emailsExistentes.has(email)) {
          const usuarioExistente = emailsExistentes.get(email);
          resultado.pulados++;
          resultado.detalhes.push({
            linha: numeroLinha,
            nome,
            email,
            status: 'PULADO',
            motivo: `Email já existe no sistema (ID: ${usuarioExistente.id}, Usuário: ${usuarioExistente.nome})`
          });
          continue;
        }

        // Inferir ROLE baseado na FUNCAO
        let role = 'TECNICO';
        if (funcao) {
          const funcaoUpper = funcao.toUpperCase();
          if (funcaoUpper.includes('DIRETOR')) {
            role = 'ADMIN';
          } else if (funcaoUpper.includes('GERENTE') || 
                     funcaoUpper.includes('SUPERVISOR') || 
                     funcaoUpper.includes('COORDENADOR')) {
            role = 'GERENTE';
          }
        }

        // Criar novo usuário
        const novoUsuario = await prisma.usuario.create({
          data: {
            nome: nome.toUpperCase(),
            email: email,
            funcao: funcao || null,
            role: role,
            ativo: true,
            empresaId: empresa.id,
            unidadeId: null  // Sem unidade por enquanto
          }
        });

        resultado.criados++;
        emailsExistentes.set(email, {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          empresaId: novoUsuario.empresaId
        });

        // Mostrar progresso a cada 50 linhas
        if ((idx + 1) % 50 === 0) {
          console.log(`   ✓ ${idx + 1}/${dados.length} processados...`);
        }

      } catch (erro) {
        resultado.erros++;
        console.error(`   ❌ Erro na linha ${numeroLinha}: ${erro.message}`);
      }
    }

    // 5. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DE IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Criados:        ${resultado.criados}`);
    console.log(`⏭️  Pulados:        ${resultado.pulados} (duplicados)`);
    console.log(`❌ Erros:          ${resultado.erros}`);
    console.log(`📈 Total:          ${dados.length}`);
    console.log('='.repeat(60) + '\n');

    if (resultado.pulados > 0) {
      console.log('📋 Primeiros 10 pulados (duplicados):');
      resultado.detalhes
        .filter(d => d.status === 'PULADO')
        .slice(0, 10)
        .forEach(d => {
          console.log(`   • ${d.nome} (${d.email}) - ${d.motivo}`);
        });
      console.log();
    }

    if (resultado.erros > 0) {
      console.log('⚠️  Primeiros 10 erros:');
      resultado.detalhes
        .filter(d => d.status === 'ERRO')
        .slice(0, 10)
        .forEach(d => {
          console.log(`   • ${d.nome} (${d.email}) - ${d.motivo}`);
        });
      console.log();
    }

    console.log('✨ Importação concluída com sucesso!');

  } catch (erro) {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
importarColaboradores();
