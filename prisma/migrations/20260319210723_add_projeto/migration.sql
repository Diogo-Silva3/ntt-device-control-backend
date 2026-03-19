-- AlterTable
ALTER TABLE "equipamentos" ADD COLUMN     "projeto_id" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "projeto_id" INTEGER;

-- AlterTable
ALTER TABLE "vinculacoes" ADD COLUMN     "projeto_id" INTEGER,
ALTER COLUMN "tipo_operacao" SET DEFAULT 'Máquina nova e usuário novo';

-- CreateTable
CREATE TABLE "projetos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "empresa_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projetos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculacoes" ADD CONSTRAINT "vinculacoes_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
