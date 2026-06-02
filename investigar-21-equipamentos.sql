-- Verificar distribuição de status
SELECT status, COUNT(*) as quantidade 
FROM equipamentos 
WHERE empresa_id = 1 
GROUP BY status 
ORDER BY quantidade DESC;

-- Verificar equipamentos que não estão DISPONÍVEL
SELECT status, tipo, marca, modelo, COUNT(*) as quantidade
FROM equipamentos 
WHERE empresa_id = 1 AND status != 'DISPONÍVEL'
GROUP BY status, tipo, marca, modelo
ORDER BY quantidade DESC;

-- Contar DESCARTADO
SELECT COUNT(*) as descartados 
FROM equipamentos 
WHERE empresa_id = 1 AND status = 'DESCARTADO';

-- Contar EM_USO
SELECT COUNT(*) as em_uso
FROM equipamentos 
WHERE empresa_id = 1 AND status = 'EM_USO';

-- Contar MANUTENCAO
SELECT COUNT(*) as manutencao
FROM equipamentos 
WHERE empresa_id = 1 AND status = 'MANUTENCAO';

-- Contar EMPRESTADO
SELECT COUNT(*) as emprestado
FROM equipamentos 
WHERE empresa_id = 1 AND status = 'EMPRESTADO';
