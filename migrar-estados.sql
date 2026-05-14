-- Migração de Estados para Padronização
-- Execute este script no banco de dados PostgreSQL

UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Entrega' WHERE estado = 'Aguardando Entrega';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Definição' WHERE estado = 'Aguardando NF';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguardando Coleta' WHERE estado = 'Coleta Solicitada';

-- Verificar resultados
SELECT estado, COUNT(*) as total FROM "SolicitacaoAtivo" GROUP BY estado ORDER BY estado;
