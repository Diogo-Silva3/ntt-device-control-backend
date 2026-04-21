-- AddColumn projetoIdAtivo to usuario
ALTER TABLE "usuario" ADD COLUMN "projetoIdAtivo" INTEGER;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_projetoIdAtivo_fkey" FOREIGN KEY ("projetoIdAtivo") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
