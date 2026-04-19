const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Busca a empresa
  const empresa = await prisma.empresa.findFirst({ orderBy: { id: 'asc' } });
  if (!empresa) { console.log('Empresa não encontrada'); return; }
  console.log('Empresa:', empresa.nome, '| ID:', empresa.id);

  // Busca unidade WICKBOLD como padrão para os novos técnicos
  const unidadeWickbold = await prisma.unidade.findFirst({
    where: { empresaId: empresa.id, nome: { contains: 'WICKBOLD' } }
  });
  const unidadeRaposo = await prisma.unidade.findFirst({
    where: { empresaId: empresa.id, nome: { contains: 'RAPOSO' } }
  });
  const unidadeRio = await prisma.unidade.findFirst({
    where: { empresaId: empresa.id, nome: { contains: 'RIO' } }
  });
  const unidadeRecife = await prisma.unidade.findFirst({
    where: { empresaId: empresa.id, nome: { contains: 'RECIFE' } }
  });

  console.log('Unidades encontradas:');
  console.log('  WICKBOLD:', unidadeWickbold?.id, unidadeWickbold?.nome);
  console.log('  RAPOSO:', unidadeRaposo?.id, unidadeRaposo?.nome);
  console.log('  RIO:', unidadeRio?.id, unidadeRio?.nome);
  console.log('  RECIFE:', unidadeRecife?.id, unidadeRecife?.nome);

  const tecnicos = [
    { nome: 'DANILLO DA SILVA OLIVEIRA',         unidade: unidadeRaposo },
    { nome: 'HERICLES FIRMINO DA SILVA ROZENDO', unidade: unidadeRio },
    { nome: 'DIOGO JOSE DA SILVA',               unidade: unidadeRecife },
    { nome: 'RICARDO LOPES SANTIAGO',            unidade: unidadeRaposo },
    { nome: 'ERICK SANCHES BERZIN',              unidade: unidadeRaposo },
    { nome: 'DOUGLAS CANDIDO MONTEIRO',          unidade: unidadeWickbold },
    { nome: 'GABRIEL SANTANA DE ARAUJO',         unidade: unidadeRio },
    { nome: 'TABATA ALVES DE SOUZA SANTOS',      unidade: unidadeRaposo },
    { nome: 'JENIFFER ALANA COELHO DA SILVA',    unidade: unidadeRecife },
    { nome: 'THIAGO CORREA LIMA FERREIRA',       unidade: unidadeWickbold },
  ];

  for (const tec of tecnicos) {
    const existe = await prisma.usuario.findFirst({
      where: { nome: tec.nome, empresaId: empresa.id }
    });
    if (existe) {
      console.log('Já existe:', tec.nome);
      continue;
    }
    const criado = await prisma.usuario.create({
      data: {
        nome: tec.nome,
        role: 'TECNICO',
        empresaId: empresa.id,
        unidadeId: tec.unidade?.id || null,
        ativo: true,
      }
    });
    console.log('Criado:', criado.nome, '| unidade:', tec.unidade?.nome || 'sem unidade');
  }

  console.log('\nConcluído!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
