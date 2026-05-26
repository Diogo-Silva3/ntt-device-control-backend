const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function verificarLocalidades() {
  try {
    console.log('🚀 Verificando localidades...\n');

    // 1. Encontrar empresa BIMBO
    const empresa = await prisma.empresa.findFirst({
      where: {
        nome: {
          contains: 'BIMBO',
          mode: 'insensitive'
        }
      }
    });

    if (!empresa) {
      console.error('❌ Empresa BIMBO não encontrada!');
      process.exit(1);
    }

    console.log(`✅ Empresa: ${empresa.nome} (ID: ${empresa.id})\n`);

    // 2. Buscar unidades existentes
    const unidadesExistentes = await prisma.unidade.findMany({
      where: { empresaId: empresa.id },
      select: { id: true, nome: true }
    });

    console.log(`📍 Unidades no sistema: ${unidadesExistentes.length}\n`);
    unidadesExistentes.forEach(u => {
      console.log(`   • ${u.nome} (ID: ${u.id})`);
    });

    // 3. Ler arquivo Colaboradores.xlsx
    console.log('\n📂 Lendo arquivo Colaboradores.xlsx...');
    const workbook = XLSX.readFile('C:\\Temp\\wickbold\\Colaboradores.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const dados = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // 4. Extrair localidades do arquivo
    const localidadesArquivo = new Set();
    const localidadesComContagem = new Map();

    dados.forEach(d => {
      const unidade = d['UNIDADE ']?.toString().trim();
      if (unidade) {
        localidadesArquivo.add(unidade);
        localidadesComContagem.set(unidade, (localidadesComContagem.get(unidade) || 0) + 1);
      }
    });

    console.log(`\n📍 Localidades no arquivo: ${localidadesArquivo.size}\n`);

    // 5. Comparar
    const mapaUnidades = new Map();
    unidadesExistentes.forEach(u => {
      mapaUnidades.set(u.nome.toLowerCase(), u);
    });

    console.log('🔍 COMPARAÇÃO:\n');

    const localidadesOrdenadas = Array.from(localidadesComContagem.entries())
      .sort((a, b) => b[1] - a[1]);

    let encontradas = 0;
    let naoEncontradas = 0;

    localidadesOrdenadas.forEach(([local, qtd]) => {
      const existe = mapaUnidades.has(local.toLowerCase());
      const status = existe ? '✅' : '❌';
      console.log(`${status} "${local}": ${qtd} colaboradores`);
      
      if (existe) encontradas++;
      else naoEncontradas++;
    });

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Encontradas: ${encontradas}`);
    console.log(`   ❌ Não encontradas: ${naoEncontradas}`);

    if (naoEncontradas > 0) {
      console.log('\n⚠️  Localidades que NÃO existem no sistema:');
      localidadesOrdenadas.forEach(([local, qtd]) => {
        if (!mapaUnidades.has(local.toLowerCase())) {
          console.log(`   • "${local}" (${qtd} colaboradores)`);
        }
      });
    }

  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarLocalidades();
