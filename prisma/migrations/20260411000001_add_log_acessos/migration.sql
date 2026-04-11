CREATE TABLE "log_acessos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "empresa_id" INTEGER,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_acessos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "log_acessos_empresa_id_idx" ON "log_acessos"("empresa_id");
CREATE INDEX "log_acessos_usuario_id_idx" ON "log_acessos"("usuario_id");
