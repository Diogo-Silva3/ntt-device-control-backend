#!/bin/bash

# Script para atribuir projeto ao técnico na VPS
# Conecta ao banco PostgreSQL e atualiza o técnico

cd /var/www/backend

# Executar script Node.js que conecta ao banco local
node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔍 Buscando técnico PEDRO SEVERO...');
    const tecnico = await prisma.usuario.findFirst({
      where: { nome: { contains: 'PEDRO', mode: 'insensitive' } },
      select: { id: true, nome: true, email: true, projetoId: true, role: true }
    });
    
    if (!tecnico) {
      console.error('❌ Técnico não encontrado');
      process.exit(1);
    }
    console.log('✓ Técnico encontrado:', tecnico);
    
    console.log('\n🔍 Buscando projeto TECH REFRESH...');
    const projeto = await prisma.projeto.findFirst({
      where: { nome: { contains: 'TECH REFRESH', mode: 'insensitive' } },
      select: { id: true, nome: true }
    });
    
    if (!projeto) {
      console.error('❌ Projeto não encontrado');
      process.exit(1);
    }
    console.log('✓ Projeto encontrado:', projeto);
    
    // Atribuir projeto ao técnico
    console.log('\n📝 Atribuindo projeto ao técnico...');
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: tecnico.id },
      data: { projetoId: projeto.id },
      include: { projeto: true }
    });
    
    console.log('\n✅ Projeto atribuído com sucesso!');
    console.log('Técnico:', usuarioAtualizado.nome);
    console.log('Projeto:', usuarioAtualizado.projeto.nome);
    console.log('ID do Técnico:', usuarioAtualizado.id);
    console.log('ID do Projeto:', usuarioAtualizado.projetoId);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
EOF
