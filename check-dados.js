const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const usuarios = await prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true, role: true }, orderBy: { nome: 'asc' } });
  const unidades = await prisma.unidade.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } });
  console.log('=== USUARIOS ===');
  usuarios.forEach(u => console.log(u.id, u.role, u.nome));
  console.log('=== UNIDADES ===');
  unidades.forEach(u => console.log(u.id, u.nome));
  await prisma.$disconnect();
}
main().catch(console.error);
