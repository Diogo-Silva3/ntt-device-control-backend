const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("=== UNIDADES ===");
    const unidades = await prisma.unidade.findMany();
    for (const u of unidades) {
      console.log(`Unidade ID: ${u.id}, Nome: ${u.nome}`);
    }

    console.log("\n=== BUSCANDO PARA RAPOSO, BASTECK E WB - RJ ===");
    // Vamos buscar as unidades correspondentes
    const raposo = unidades.find(u => u.nome.toUpperCase().includes('RAPOSO'));
    const basteck = unidades.find(u => u.nome.toUpperCase().includes('BASTECK'));
    const wbrj = unidades.find(u => u.nome.toUpperCase().includes('RJ'));

    const targetUnidades = [
      { name: 'RAPOSO', u: raposo },
      { name: 'BASTECK', u: basteck },
      { name: 'WB - RJ', u: wbrj }
    ];

    for (const target of targetUnidades) {
      if (!target.u) {
        console.log(`Unidade ${target.name} não encontrada!`);
        continue;
      }
      const uId = target.u.id;
      console.log(`\n>>> ANALISANDO UNIDADE: ${target.name} (ID: ${uId}) <<<`);
      
      // Equipamentos com essa unidadeId no banco
      const eqs = await prisma.equipamento.findMany({
        where: {
          unidadeId: uId,
          status: { not: 'DESCARTADO' },
          projetoId: 1
        }
      });
      console.log(`Equipamentos no banco (projetoId=1, não descartados): ${eqs.length}`);
      
      const eqsEntregues = eqs.filter(e => ['Entregue ao Usuário', 'Em Uso'].includes(e.statusProcesso));
      console.log(`  - Entregues (statusProcesso in ['Entregue ao Usuário', 'Em Uso']): ${eqsEntregues.length}`);
      eqsEntregues.forEach(e => {
        console.log(`    * Eq ID: ${e.id}, Serial: ${e.serialNumber}, StatusProcesso: ${e.statusProcesso}`);
      });

      // Vinculações ativas com usuário dessa unidadeId
      const vincsPorUsuario = await prisma.vinculacao.findMany({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          usuario: { unidadeId: uId }
        },
        include: {
          usuario: true,
          equipamento: true
        }
      });
      console.log(`Vinculações (ativa=true, statusEntrega=ENTREGUE, usuário na unidade): ${vincsPorUsuario.length}`);
      vincsPorUsuario.forEach(v => {
        console.log(`    * Vinc ID: ${v.id}, Colaborador: ${v.usuario.nome} (Unidade: ${v.usuario.unidadeId}), Eq ID: ${v.equipamentoId}, Eq Serial: ${v.equipamento.serialNumber}, Eq UnidadeId: ${v.equipamento.unidadeId}`);
      });

      // Vinculações ativas com equipamento dessa unidadeId
      const vincsPorEquipamento = await prisma.vinculacao.findMany({
        where: {
          ativa: true,
          statusEntrega: 'ENTREGUE',
          equipamento: { unidadeId: uId }
        },
        include: {
          usuario: true,
          equipamento: true
        }
      });
      console.log(`Vinculações (ativa=true, statusEntrega=ENTREGUE, equipamento na unidade): ${vincsPorEquipamento.length}`);
      vincsPorEquipamento.forEach(v => {
        console.log(`    * Vinc ID: ${v.id}, Colaborador: ${v.usuario.nome} (Unidade: ${v.usuario.unidadeId}), Eq ID: ${v.equipamentoId}, Eq Serial: ${v.equipamento.serialNumber}, Eq UnidadeId: ${v.equipamento.unidadeId}`);
      });
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
