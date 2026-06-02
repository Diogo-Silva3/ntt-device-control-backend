-- Normalizar status para uppercase com acento
UPDATE equipamentos 
SET status = 'DISPONÍVEL' 
WHERE empresa_id = 1 AND status = 'DISPONIVEL';

-- Verificar resultado
SELECT status, COUNT(*) as quantidade 
FROM equipamentos 
WHERE empresa_id = 1 
GROUP BY status;
