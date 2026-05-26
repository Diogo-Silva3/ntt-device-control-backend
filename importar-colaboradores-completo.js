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
    console.log('📂 Lendo arquivo Colaboradores.xlsx...');
    const caminhoArquivo = 'C:\\Temp\\wickbold\\Colaboradores.xlsx';
    
    const fs = require('fs');
    if (!fs.existsSync(caminhoArquivo)) {
      console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
      process.exit(1);
    }

    const workbook = XLSX.readFile(caminhoArquivo);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Arquivo lido: ${dados.length} colaboradores encontrados\n`);

    // 3. Buscar unidades existentes
    console.log('🏢 Verificando unidades existentes...');
    const unidadesExistentes = await prisma.unidade.findMany({
      where: { empresaId: empresa.id },
      select: { id: true, nome: true }
    });

    const mapaUnidades = new Map();
    unidadesExistentes.forEach(u => {
      mapaUnidades.set(u.nome.toLowerCase(), u);
    });

    console.log(`✅ ${unidadesExistentes.length} unidades encontradas\n`);

    // 4. Buscar usuários existentes (TODA A PLATAFORMA)
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

    // 5. Processar importação
    console.log('⚙️  Processando importação...\n');
    
    const resultado = {
      criados: 0,
      pulados: 0,
      erros: 0,
      unidadesNaoEncontradas: new Set(),
      detalhes: []
    };

    for (let idx = 0; idx < dados.length; idx++) {
      const linha = dados[idx];
      const numeroLinha = idx + 2;

      try {
        // Extrair dados
        const nome = linha['NOME']?.toString().trim();
        const email = linha['E-MAIL']?.toString().trim().toLowerCase();
        const cargo = linha['CARGO']?.toString().trim();
        const unidadeNome = linha['UNIDADE']?.toString().trim();

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
            unidade: unidadeNome || '—',
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
            unidade: unidadeNome || '—',
            status: 'PULADO',
            motivo: `Email já existe no sistema (ID: ${usuarioExistente.id})`
          });
          continue;
        }

        // Inferir ROLE baseado no CARGO
        let role = 'TECNICO';
        if (cargo) {
          const cargoUpper = cargo.toUpperCase();
          if (cargoUpper.includes('DIRETOR')) {
            role = 'ADMIN';
          } else if (cargoUpper.includes('GERENTE') || 
                     cargoUpper.includes('SUPERVISOR') || 
                     cargoUpper.includes('COORDENADOR')) {
            role = 'GERENTE';
          }
        }

        // Encontrar unidade
        let unidadeId = null;
        if (unidadeNome) {
          const unidadeLower = unidadeNome.toLowerCase();
          if (mapaUnidades.has(unidadeLower)) {
            unidadeId = mapaUnidades.get(unidadeLower).id;
          } else {
            resultado.unidadesNaoEncontradas.add(unidadeNome);
            resultado.erros++;
            resultado.detalhes.push({
              linha: numeroLinha,
              nome,
              email,
              unidade: unidadeNome,
              status: 'ERRO',
              motivo: `Unidade "${unidadeNome}" não encontrada no sistema`
            });
            continue;
          }
        }

        // Criar novo usuário
        const novoUsuario = await prisma.usuario.create({
          data: {
            nome: nome.toUpperCase(),
            email: email,
            funcao: cargo || null,
            role: role,
            ativo: true,
            empresaId: empresa.id,
            unidadeId: unidadeId
          }
        });

        resultado.criados++;
        emailsExistentes.set(email, {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          empresaId: novoUsuario.empresaId
        });

        resultado.detalhes.push({
          linha: numeroLinha,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          unidade: unidadeNome || '—',
          status: 'CRIADO',
          id: novoUsuario.id
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

    // 6. Relatório final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RELATÓRIO FINAL DE IMPORTAÇÃO');
    console.log('='.repeat(70));
    console.log(`✅ Criados:                ${resultado.criados}`);
    console.log(`⏭️  Pulados:                ${resultado.pulados} (duplicados no sistema)`);
    console.log(`❌ Erros:                  ${resultado.erros}`);
    console.log(`📈 Total processado:       ${dados.length}`);
    console.log('='.repeat(70) + '\n');

    if (resultado.unidadesNaoEncontradas.size > 0) {
      console.log('⚠️  Unidades não encontradas no sistema:');
      Array.from(resultado.unidadesNaoEncontradas).forEach(u => {
        console.log(`   • ${u}`);
      });
      console.log();
    }

    if (resultado.pulados > 0) {
      console.log('📋 Primeiros 5 pulados (duplicados):');
      resultado.detalhes
        .filter(d => d.status === 'PULADO')
        .slice(0, 5)
        .forEach(d => {
          console.log(`   • ${d.nome} (${d.email})`);
        });
      console.log();
    }

    if (resultado.erros > 0) {
      console.log('⚠️  Primeiros 5 erros:');
      resultado.detalhes
        .filter(d => d.status === 'ERRO')
        .slice(0, 5)
        .forEach(d => {
          console.log(`   • ${d.nome} (${d.email}) - ${d.motivo}`);
        });
      console.log();
    }

    console.log('✨ Importação concluída!');

  } catch (erro) {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
importarColaboradores();
