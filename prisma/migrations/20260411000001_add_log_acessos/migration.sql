CREATE TABLE IF NOT EXISTS "log_acessos" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER REFERENCES "usuarios"("id"),
  "empresa_id" INTEGER REFERENCES "empresas"("id"),
  "acao" TEXT NOT NULL,
  "detalhes" TEXT,
  "ip" VARCHAR(45),
  "user_agent" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "log_acessos_empresa_id_idx" ON "log_acessos"("empresa_id");
CREATE INDEX IF NOT EXISTS "log_acessos_usuario_id_idx" ON "log_acessos"("usuario_id");
