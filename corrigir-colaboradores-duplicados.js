const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== INICIANDO MESCLAGEM E CORREÇÃO DE COLABORADORES DUPLICADOS ===\n');

  // 1. Buscar todos os colaboradores ativos
  const colaboradores = await prisma.usuario.findMany({
    where: { 
      role: 'COLABORADOR',
      ativo: true 
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Total de colaboradores ativos encontrados: ${colaboradores.length}\n`);

  // 2. Agrupar colaboradores por nome normalizado
  const porNome = {};
  for (const c of colaboradores) {
    const key = c.nome.trim().toUpperCase();
    if (!porNome[key]) porNome[key] = [];
    porNome[key].push(c);
  }

  let totalGruposDuplicados = 0;
  let totalUsuariosDesativados = 0;

  // 3. Processar cada grupo de duplicatas
  for (const [nome, lista] of Object.entries(porNome)) {
    if (lista.length > 1) {
      totalGruposDuplicados++;
      console.log(`--------------------------------------------------`);
      console.log(`DUPLICATA ENCONTRADA: "${nome}" (${lista.length} registros)`);

      // 4. Analisar os relacionamentos de cada ID para escolher o melhor ID Principal
      const candidatos = [];
      for (const u of lista) {
        const [cntVinculacoes, cntHistoricos, cntChamados, cntSolicitacoes] = await Promise.all([
          prisma.vinculacao.count({ where: { OR: [{ usuarioId: u.id }, { tecnicoId: u.id }] } }),
          prisma.historico.count({ where: { usuarioId: u.id } }),
          prisma.chamado.count({ where: { usuarioId: u.id } }),
          prisma.solicitacaoAtivo.count({ where: { tecnicoId: u.id } })
        ]);

        const totalRelacionamentos = cntVinculacoes + cntHistoricos + cntChamados + cntSolicitacoes;
        
        candidatos.push({
          usuario: u,
          vinculacoes: cntVinculacoes,
          historicos: cntHistoricos,
          chamados: cntChamados,
          solicitacoes: cntSolicitacoes,
          total: totalRelacionamentos
        });
      }

      // Ordenar candidatos por:
      // 1. Quem tem mais relacionamentos
      // 2. Menor ID (mais antigo)
      candidatos.sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        return a.usuario.id - b.usuario.id;
      });

      const principal = candidatos[0];
      const secundarios = candidatos.slice(1);

      console.log(`=> PRINCIPAL ELEITO: ID ${principal.usuario.id} | Email: ${principal.usuario.email || 'sem email'} (Relacionamentos: ${principal.total})`);

      for (const sec of secundarios) {
        const uSec = sec.usuario;
        console.log(`   -> Secundário a mesclar: ID ${uSec.id} | Email: ${uSec.email || 'sem email'} (Relacionamentos: ${sec.total})`);

        // 5. Mover relacionamentos do secundário para o principal
        if (sec.total > 0) {
          console.log(`      Transferindo relacionamentos...`);
          
          // Vinculações como Usuário
          const vUsr = await prisma.vinculacao.updateMany({
            where: { usuarioId: uSec.id },
            data: { usuarioId: principal.usuario.id }
          });
          if (vUsr.count > 0) console.log(`      ✓ ${vUsr.count} vinculações de usuário transferidas`);

          // Vinculações como Técnico (se houver)
          const vTec = await prisma.vinculacao.updateMany({
            where: { tecnicoId: uSec.id },
            data: { tecnicoId: principal.usuario.id }
          });
          if (vTec.count > 0) console.log(`      ✓ ${vTec.count} atribuições de técnico transferidas`);

          // Históricos
          const hist = await prisma.historico.updateMany({
            where: { usuarioId: uSec.id },
            data: { usuarioId: principal.usuario.id }
          });
          if (hist.count > 0) console.log(`      ✓ ${hist.count} históricos transferidos`);

          // Chamados
          const cham = await prisma.chamado.updateMany({
            where: { usuarioId: uSec.id },
            data: { usuarioId: principal.usuario.id }
          });
          if (cham.count > 0) console.log(`      ✓ ${cham.count} chamados transferidos`);

          // Solicitações
          const sol = await prisma.solicitacaoAtivo.updateMany({
            where: { tecnicoId: uSec.id },
            data: { tecnicoId: principal.usuario.id }
          });
          if (sol.count > 0) console.log(`      ✓ ${sol.count} solicitações transferidas`);
        }

        // 6. Desativar o usuário secundário
        await prisma.usuario.update({
          where: { id: uSec.id },
          data: { ativo: false }
        });
        console.log(`      ✓ Usuário ID ${uSec.id} desativado com sucesso (ativo = false)`);
        totalUsuariosDesativados++;
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`=== MIGRACAO CONCLUIDA COM SUCESSO! ===`);
  console.log(`Total de nomes duplicados tratados: ${totalGruposDuplicados}`);
  console.log(`Total de usuários secundários desativados: ${totalUsuariosDesativados}`);
  console.log(`==================================================`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Erro durante a execução:', e);
  process.exit(1);
});
