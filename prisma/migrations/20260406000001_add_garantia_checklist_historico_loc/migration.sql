ALTER TABLE "equipamentos" ADD COLUMN IF NOT EXISTS "data_garantia" TIMESTAMP;
ALTER TABLE "vinculacoes" ADD COLUMN IF NOT EXISTS "checklist_devolucao" TEXT;
CREATE TABLE IF NOT EXISTS "historico_localizacao" (
  "id" SERIAL PRIMARY KEY,
  "equipamento_id" INTEGER NOT NULL REFERENCES "equipamentos"("id"),
  "unidade_anterior_id" INTEGER REFERENCES "unidades"("id"),
  "unidade_nova_id" INTEGER REFERENCES "unidades"("id"),
  "tecnico_id" INTEGER REFERENCES "usuarios"("id"),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
