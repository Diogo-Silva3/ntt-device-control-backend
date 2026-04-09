ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "reset_token" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "reset_token_expira" TIMESTAMP;
