-- Atualizar todos os desktops DELL para o projeto TECH REFRESH DESKTOP 2026 (ID 2)
UPDATE equipamentos 
SET projeto_id = 2 
WHERE tipo = 'DESKTOP' 
  AND projeto_id = 1 
  AND marca = 'DELL'
  AND modelo = 'PRO MICRO QCM1250';

-- Verificar quantos foram atualizados
SELECT COUNT(*) as desktops_atualizados FROM equipamentos 
WHERE tipo = 'DESKTOP' AND projeto_id = 2 AND marca = 'DELL';
