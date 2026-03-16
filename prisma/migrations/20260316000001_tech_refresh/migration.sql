-- Tech Refresh: novos campos em vinculacoes
ALTER TABLE "vinculacoes"
  ADD COLUMN IF NOT EXISTS "tecnico_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "numero_chamado" TEXT,
  ADD COLUMN IF NOT EXISTS "tipo_operacao" TEXT DEFAULT 'Máquina nova / Usuário novo',
  ADD COLUMN IF NOT EXISTS "softwares_de" TEXT,
  ADD COLUMN IF NOT EXISTS "softwares_para" TEXT,
  ADD COLUMN IF NOT EXISTS "data_agendamento" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reagendamentos" TEXT,
  ADD COLUMN IF NOT EXISTS "status_entrega" TEXT DEFAULT 'PENDENTE';

-- FK para técnico responsável
ALTER TABLE "vinculacoes"
  ADD CONSTRAINT "vinculacoes_tecnico_id_fkey"
  FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
