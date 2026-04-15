ALTER TABLE "log_acessos" ADD COLUMN IF NOT EXISTS "projeto_id" INTEGER REFERENCES "projetos"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "log_acessos_projeto_id_idx" ON "log_acessos"("projeto_id");
