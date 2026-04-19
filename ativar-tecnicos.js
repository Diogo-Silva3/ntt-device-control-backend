const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('Ntt@2024', 10);

  const nomes = [
    'DANILLO DA SILVA OLIVEIRA',
    'HERICLES FIRMINO DA SILVA ROZENDO',
    'DIOGO JOSE DA SILVA',
    'RICARDO LOPES SANTIAGO',
    'ERICK SANCHES BERZIN',
    'DOUGLAS CANDIDO MONTEIRO',
    'GABRIEL SANTANA DE ARAUJO',
    'TABATA ALVES DE SOUZA SANTOS',
    'JENIFFER ALANA COELHO DA SILVA',
    'THIAGO CORREA LIMA FERREIRA',
  ];

  for (const nome of nomes) {
    const usuario = await prisma.usuario.findFirst({ where: { nome } });
    if (!usuario) { console.log('Nao encontrado:', nome); continue; }
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: senhaHash, role: 'TECNICO' }
    });
    console.log('Atualizado:', nome);
  }

  console.log('\nConcluido! Senha padrao: Ntt@2024');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
