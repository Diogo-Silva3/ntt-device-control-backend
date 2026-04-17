-- CreateTable
CREATE TABLE "solicitacoes_ativos" (
    "id" SERIAL NOT NULL,
    "numero_chamado" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "observacoes" TEXT,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "estado" TEXT NOT NULL DEFAULT 'Aberto',
    "data_definicao" TIMESTAMP(3),
    "data_definicao_confirmada" TIMESTAMP(3),
    "data_solicitacao_nf" TIMESTAMP(3),
    "data_emissao_nf" TIMESTAMP(3),
    "data_solicitacao_coleta" TIMESTAMP(3),
    "data_coleta" TIMESTAMP(3),
    "previsao_chegada" TIMESTAMP(3),
    "data_chegada" TIMESTAMP(3),
    "data_entrega" TIMESTAMP(3),
    "dias_atraso_chegada" INTEGER,
    "serial_origem" TEXT,
    "equipamento_id" INTEGER,
    "tecnico_id" INTEGER NOT NULL,
    "unidade_id" INTEGER NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "projeto_id" INTEGER,
    "importado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_ativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_auditoria" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "campo" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_ativos_numero_chamado_empresa_id_key" ON "solicitacoes_ativos"("numero_chamado", "empresa_id");

-- CreateIndex
CREATE INDEX "solicitacoes_ativos_empresa_id_idx" ON "solicitacoes_ativos"("empresa_id");

-- CreateIndex
CREATE INDEX "solicitacoes_ativos_tecnico_id_idx" ON "solicitacoes_ativos"("tecnico_id");

-- CreateIndex
CREATE INDEX "solicitacoes_ativos_unidade_id_idx" ON "solicitacoes_ativos"("unidade_id");

-- CreateIndex
CREATE INDEX "solicitacoes_ativos_status_idx" ON "solicitacoes_ativos"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_auditoria_solicitacao_id_idx" ON "solicitacoes_auditoria"("solicitacao_id");

-- AddForeignKey
ALTER TABLE "solicitacoes_ativos" ADD CONSTRAINT "solicitacoes_ativos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ativos" ADD CONSTRAINT "solicitacoes_ativos_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ativos" ADD CONSTRAINT "solicitacoes_ativos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ativos" ADD CONSTRAINT "solicitacoes_ativos_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_ativos" ADD CONSTRAINT "solicitacoes_ativos_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_auditoria" ADD CONSTRAINT "solicitacoes_auditoria_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes_ativos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
