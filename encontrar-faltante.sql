-- Contar equipamentos por statusProcesso
SELECT 
  statusProcesso,
  COUNT(*) as quantidade
FROM equipamentos
GROUP BY statusProcesso
ORDER BY quantidade DESC;

-- Mostrar total
SELECT COUNT(*) as total_equipamentos FROM equipamentos;

-- Encontrar equipamentos com statusProcesso NULL ou vazio
SELECT 
  id,
  "serialNumber",
  marca,
  modelo,
  tipo,
  "statusProcesso"
FROM equipamentos
WHERE "statusProcesso" IS NULL 
   OR "statusProcesso" = ''
   OR "statusProcesso" NOT IN (
     'Novo',
     'Imagem Instalada',
     'Softwares Instalados',
     'Asset Registrado',
     'Agendado para Entrega',
     'Entregue ao Usuário'
   );
