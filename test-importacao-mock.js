const prisma = require('./src/config/prisma');
const ctrl = require('./src/controllers/importacao.controller');
const path = require('path');
const fs = require('fs');

async function testar() {
  console.log('🧪 Iniciando testes de importação mockados...\n');

  // Garante que as unidades usadas no teste existam temporariamente no banco
  console.log('🌱 Criando unidades temporárias para o teste...');
  await prisma.unidade.upsert({
    where: { nome_empresaId: { nome: 'WICKBOLD SP', empresaId: 1 } },
    update: {},
    create: { nome: 'WICKBOLD SP', empresaId: 1 }
  });
  await prisma.unidade.upsert({
    where: { nome_empresaId: { nome: 'WICKBOLD RJ', empresaId: 1 } },
    update: {},
    create: { nome: 'WICKBOLD RJ', empresaId: 1 }
  });
  await prisma.unidade.upsert({
    where: { nome_empresaId: { nome: 'WICKBOLD MG', empresaId: 1 } },
    update: {},
    create: { nome: 'WICKBOLD MG', empresaId: 1 }
  });
  console.log('✅ Unidades prontas!\n');

  // Usuário mockado (Admin da empresa Wickbold, ID 1)
  const reqUsuario = { id: 1, empresaId: 1, role: 'ADMIN' };

  // 1. Teste de PREVIEW
  console.log('--- Testando Preview ---');
  // Copia a planilha para um arquivo temporário simulando o upload
  const fileOriginal = path.join(__dirname, 'modelo_equipamentos.xlsx');
  const fileTemp = path.join(__dirname, 'uploads', 'temp-test-equipamentos.xlsx');
  
  if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
  }
  fs.copyFileSync(fileOriginal, fileTemp);

  const reqPreview = {
    usuario: reqUsuario,
    file: { path: fileTemp, originalname: 'modelo_equipamentos.xlsx' }
  };

  const resPreview = {
    status: (code) => ({
      json: (data) => {
        console.log(`❌ Erro no Preview (Status ${code}):`, data);
      }
    }),
    json: (data) => {
      console.log('✅ Sucesso no Preview:', data);
    }
  };

  await ctrl.preview(reqPreview, resPreview);

  // 2. Teste de VALIDAR ARQUIVO (Solicitações)
  console.log('\n--- Testando Validação de Arquivo (Solicitações) ---');
  const fileSolicitacoes = path.join(__dirname, '../planilha-solicitacoes.xlsx');
  const fileTempSol = path.join(__dirname, 'uploads', 'temp-test-solicitacoes.xlsx');
  fs.copyFileSync(fileSolicitacoes, fileTempSol);

  const reqValidar = {
    usuario: reqUsuario,
    file: { path: fileTempSol, originalname: 'planilha-solicitacoes.xlsx' },
    body: {}
  };

  const resValidar = {
    status: (code) => ({
      json: (data) => {
        console.log(`❌ Erro na Validação (Status ${code}):`, data);
      }
    }),
    json: (data) => {
      console.log('✅ Sucesso na Validação:');
      console.log(`   - Válidas: ${data.validacoes.validas?.length || 0}`);
      console.log(`   - Inválidas: ${data.validacoes.invalidas?.length || 0}`);
      console.log(`   - Avisos: ${data.validacoes.avisos?.length || 0}`);
      if (data.validacoes.invalidas && data.validacoes.invalidas.length > 0) {
        console.log('   - Amostra de erros de validação (primeiras 5 linhas):');
        data.validacoes.invalidas.slice(0, 5).forEach(item => {
          console.log(`     * Linha ${item.linha} (${item.numeroChamado}): ${item.erros.join('; ')}`);
        });
      }
    }
  };

  await ctrl.validarArquivo(reqValidar, resValidar);

  // 3. Teste de IMPORTAR EQUIPAMENTOS
  console.log('\n--- Testando Importação de Equipamentos ---');
  const fileTempEq = path.join(__dirname, 'uploads', 'temp-test-import-eq.xlsx');
  fs.copyFileSync(fileOriginal, fileTempEq);

  const reqImportEq = {
    usuario: reqUsuario,
    file: { path: fileTempEq, originalname: 'modelo_equipamentos.xlsx' },
    body: { projetoId: '1' } // Tech Refresh Laptop
  };

  const resImportEq = {
    status: (code) => ({
      json: (data) => {
        console.log(`❌ Erro na Importação (Status ${code}):`, data);
      }
    }),
    json: (data) => {
      console.log('✅ Sucesso na Importação:', data.mensagem);
      console.log(`   - Criados: ${data.criados}`);
      console.log(`   - Atualizados: ${data.atualizados}`);
      console.log(`   - Erros: ${data.erros}`);
      if (data.detalhes && data.detalhes.length > 0) {
        console.log('   - Detalhes dos erros/linhas:');
        data.detalhes.forEach(d => {
          if (d.status === 'ERRO') {
            console.log(`     * Linha ${d.linha} (S/N: ${d.serialNumber}): ${d.motivo}`);
          }
        });
      }
    }
  };

  await ctrl.importarEquipamentos(reqImportEq, resImportEq);

  // Limpeza dos dados de teste
  console.log('\n🧹 Limpando dados de teste do banco de dados...');
  const eqDeleted = await prisma.equipamento.deleteMany({
    where: {
      serialNumber: { in: ['SN123456', 'SN123457', 'SN789012', 'SN345678', 'SN901234'] }
    }
  });
  console.log(`   - Equipamentos deletados: ${eqDeleted.count}`);

  const unitDeleted = await prisma.unidade.deleteMany({
    where: {
      nome: { in: ['WICKBOLD SP', 'WICKBOLD RJ', 'WICKBOLD MG'] },
      empresaId: 1
    }
  });
  console.log(`   - Unidades deletadas: ${unitDeleted.count}`);

  console.log('\n🧪 Testes mockados finalizados.');
  await prisma.$disconnect();
}

testar().catch(err => console.error('Erro nos testes:', err));
