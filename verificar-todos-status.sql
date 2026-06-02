-- Verificar TODOS os status únicos no banco
SELECT DISTINCT status, COUNT(*) as quantidade
FROM equipamentos 
WHERE empresa_id = 1 
GROUP BY status
ORDER BY status;

-- Verificar se tem mais variações de DISPONÍVEL
SELECT DISTINCT status
FROM equipamentos 
WHERE empresa_id = 1 AND status ILIKE '%disponivel%'
ORDER BY status;

-- Verificar se tem mais variações de EM_USO
SELECT DISTINCT status
FROM equipamentos 
WHERE empresa_id = 1 AND status ILIKE '%em_uso%' OR status ILIKE '%em uso%'
ORDER BY status;

-- Listar todos os status diferentes
SELECT status, COUNT(*) as quantidade
FROM equipamentos 
WHERE empresa_id = 1 
GROUP BY status
HAVING status NOT IN ('DISPONÍVEL', 'EM_USO', 'MANUTENCAO', 'DESCARTADO', 'EMPRESTADO')
ORDER BY quantidade DESC;
