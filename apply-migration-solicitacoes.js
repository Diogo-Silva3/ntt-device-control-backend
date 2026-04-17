const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Aplicando migration: solicitacoes_ativos...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "solicitacoes_ativos" (
      "id" SERIAL PRIMARY KEY,
      "numero_chamado" TEXT NOT NULL,
      "data_criacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "descricao" TEXT,
      "observacoes" TEXT,
      "tipo" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ABERTO',
      "estado" TEXT NOT NULL DEFAULT 'Aberto',
      "data_definicao" TIMESTAMP,
      "data_definicao_confirmada" TIMESTAMP,
      "data_solicitacao_nf" TIMESTAMP,
      "data_emissao_nf" TIMESTAMP,
      "data_solicitacao_coleta" TIMESTAMP,
      "data_coleta" TIMESTAMP,
      "previsao_chegada" TIMESTAMP,
      "data_chegada" TIMESTAMP,
      "data_entrega" TIMESTAMP,
      "dias_atraso_chegada" INTEGER,
      "serial_origem" TEXT,
      "equipamento_id" INTEGER REFERENCES "equipamentos"("id") ON DELETE SET NULL,
      "tecnico_id" INTEGER NOT NULL REFERENCES "usuarios"("id"),
      "unidade_id" INTEGER NOT NULL REFERENCES "unidades"("id"),
      "empresa_id" INTEGER NOT NULL REFERENCES "empresas"("id"),
      "projeto_id" INTEGER REFERENCES "projetos"("id") ON DELETE SET NULL,
      "importado" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("numero_chamado", "empresa_id")
    )
  `);
  console.log('✅ Tabela solicitacoes_ativos criada');

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "solicitacoes_ativos_empresa_id_idx" ON "solicitacoes_ativos"("empresa_id")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "solicitacoes_ativos_tecnico_id_idx" ON "solicitacoes_ativos"("tecnico_id")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "solicitacoes_ativos_unidade_id_idx" ON "solicitacoes_ativos"("unidade_id")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "solicitacoes_ativos_status_idx" ON "solicitacoes_ativos"("status")`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "solicitacoes_auditoria" (
      "id" SERIAL PRIMARY KEY,
      "solicitacao_id" INTEGER NOT NULL REFERENCES "solicitacoes_ativos"("id"),
      "usuario_id" INTEGER,
      "campo" TEXT NOT NULL,
      "valor_anterior" TEXT,
      "valor_novo" TEXT,
      "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela solicitacoes_auditoria criada');

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "solicitacoes_auditoria_solicitacao_id_idx" ON "solicitacoes_auditoria"("solicitacao_id")`);

  console.log('\n✅ Migration aplicada com sucesso!');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
