const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.logAcesso.count();
  console.log('Total logs:', total);

  const porEmpresa = await p.logAcesso.groupBy({
    by: ['empresaId'],
    _count: { id: true },
  });
  console.log('Por empresa:', JSON.stringify(porEmpresa));

  const empresas = await p.empresa.findMany({ select: { id: true, nome: true } });
  console.log('Empresas:', JSON.stringify(empresas));

  const ultimo = await p.logAcesso.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('Último log:', JSON.stringify(ultimo));
}

main().catch(console.error).finally(() => p.$disconnect());
