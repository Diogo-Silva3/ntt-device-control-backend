/**
 * reconstruir-logs.js
 * Reconstrói o log de auditoria a partir dos dados históricos existentes no banco.
 * Roda uma única vez: node reconstruir-logs.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando reconstrução do log de auditoria...\n');

  // Evita duplicar se rodar mais de uma vez — apaga logs com origem "RECONSTRUIDO"
  await prisma.logAcesso.deleteMany({ where: { userAgent: 'RECONSTRUIDO' } });

  const logs = [];

  // ─── 1. Equipamentos criados ────────────────────────────────────────────────
  const equipamentos = await prisma.equipamento.findMany({
    include: { empresa: true, tecnico: { select: { id: true, nome: true } } },
  });

  for (const eq of equipamentos) {
    logs.push({
      usuarioId: eq.tecnicoId || null,
      empresaId: eq.empresaId,
      acao: 'EQUIPAMENTO_CRIADO',
      detalhes: `Equipamento criado: ${eq.tipo || ''} ${eq.marca || ''} ${eq.modelo || ''} — S/N: ${eq.serialNumber || '—'}`.trim(),
      ip: null,
      userAgent: 'RECONSTRUIDO',
      createdAt: eq.createdAt,
    });
  }

  // ─── 2. Históricos de equipamentos (atribuições, devoluções, transferências, etapas) ──
  const historicos = await prisma.historico.findMany({
    include: {
      equipamento: { select: { empresaId: true, serialNumber: true } },
      usuario: { select: { id: true, nome: true, empresaId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const ACAO_MAP = {
    ATRIBUIDO:             'EQUIPAMENTO_ATRIBUIDO',
    TRANSFERIDO:           'TRANSFERIDO',
    DEVOLUCAO_OK:          'DEVOLUCAO_OK',
    DEVOLUCAO_COM_PROBLEMA:'DEVOLUCAO_COM_PROBLEMA',
    ETAPA_AVANCADA:        'EQUIPAMENTO_EDITADO',
  };

  for (const h of historicos) {
    const acao = ACAO_MAP[h.acao] || h.acao;
    logs.push({
      usuarioId: h.usuarioId || null,
      empresaId: h.equipamento?.empresaId || h.usuario?.empresaId || null,
      acao,
      detalhes: h.descricao || `Ação: ${h.acao} — Equipamento #${h.equipamentoId}`,
      ip: null,
      userAgent: 'RECONSTRUIDO',
      createdAt: h.createdAt,
    });
  }

  // ─── 3. Vinculações (agendamentos) ──────────────────────────────────────────
  const vinculacoes = await prisma.vinculacao.findMany({
    include: {
      usuario: { select: { nome: true, empresaId: true } },
      equipamento: { select: { empresaId: true, serialNumber: true } },
      tecnico: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const v of vinculacoes) {
    if (v.dataAgendamento) {
      logs.push({
        usuarioId: v.tecnicoId || null,
        empresaId: v.equipamento?.empresaId || v.usuario?.empresaId || null,
        acao: 'AGENDAMENTO_CRIADO',
        detalhes: `Agendamento para ${v.usuario?.nome || '—'} — data: ${new Date(v.dataAgendamento).toLocaleDateString('pt-BR')}`,
        ip: null,
        userAgent: 'RECONSTRUIDO',
        createdAt: v.createdAt,
      });
    }

    if (v.statusEntrega === 'ENTREGUE' && v.dataFim) {
      logs.push({
        usuarioId: v.tecnicoId || null,
        empresaId: v.equipamento?.empresaId || v.usuario?.empresaId || null,
        acao: 'ENTREGA_CONFIRMADA',
        detalhes: `Equipamento ${v.equipamento?.serialNumber || '#' + v.equipamentoId} entregue a ${v.usuario?.nome || '—'}`,
        ip: null,
        userAgent: 'RECONSTRUIDO',
        createdAt: v.dataFim,
      });
    }
  }

  // ─── 4. Usuários criados ─────────────────────────────────────────────────────
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, empresaId: true, createdAt: true },
  });

  for (const u of usuarios) {
    logs.push({
      usuarioId: null, // não sabemos quem criou
      empresaId: u.empresaId,
      acao: 'USUARIO_CRIADO',
      detalhes: `Usuário criado: ${u.nome} (${u.email || '—'}) — role: ${u.role}`,
      ip: null,
      userAgent: 'RECONSTRUIDO',
      createdAt: u.createdAt,
    });
  }

  // ─── Insere via SQL raw para preservar datas históricas ────────────────────
  logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const BATCH = 50;
  let inseridos = 0;

  for (let i = 0; i < logs.length; i += BATCH) {
    const lote = logs.slice(i, i + BATCH);

    // Monta INSERT com VALUES múltiplos
    const values = lote.map(l =>
      `(${l.usuarioId ?? 'NULL'}, ${l.empresaId ?? 'NULL'}, '${l.acao.replace(/'/g, "''")}', ${l.detalhes ? `'${l.detalhes.replace(/'/g, "''")}'` : 'NULL'}, NULL, 'RECONSTRUIDO', '${new Date(l.createdAt).toISOString()}')`
    ).join(',\n');

    await prisma.$executeRawUnsafe(`
      INSERT INTO log_acessos (usuario_id, empresa_id, acao, detalhes, ip, user_agent, created_at)
      VALUES ${values}
    `);

    inseridos += lote.length;
    process.stdout.write(`\r  Inserindo... ${inseridos}/${logs.length}`);
  }

  console.log(`\n\n✅ Concluído! ${logs.length} registros reconstruídos no log de auditoria.`);
}

main()
  .catch(e => { console.error('\n❌ Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
