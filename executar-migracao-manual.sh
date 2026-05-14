#!/bin/bash

# Script para executar migração de estados no PostgreSQL
# Execute na VPS com: bash executar-migracao-manual.sh

echo "=========================================="
echo "   Migração de Estados - PostgreSQL"
echo "=========================================="
echo ""

# Tentar com diferentes senhas
SENHAS=("TechRefresh2026!" "postgres" "tech_refresh" "")

for SENHA in "${SENHAS[@]}"; do
  echo "Tentando com senha: $SENHA"
  
  if [ -z "$SENHA" ]; then
    PGPASSWORD="" psql -h localhost -U postgres -d tech_refresh << 'EOF' 2>/dev/null
UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Entrega' WHERE estado = 'Aguardando Entrega';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Definição' WHERE estado = 'Aguardando NF';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguardando Coleta' WHERE estado = 'Coleta Solicitada';
SELECT estado, COUNT(*) as total FROM "SolicitacaoAtivo" GROUP BY estado ORDER BY estado;
EOF
  else
    PGPASSWORD="$SENHA" psql -h localhost -U postgres -d tech_refresh << 'EOF' 2>/dev/null
UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Entrega' WHERE estado = 'Aguardando Entrega';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguard.Definição' WHERE estado = 'Aguardando NF';
UPDATE "SolicitacaoAtivo" SET estado = 'Aguardando Coleta' WHERE estado = 'Coleta Solicitada';
SELECT estado, COUNT(*) as total FROM "SolicitacaoAtivo" GROUP BY estado ORDER BY estado;
EOF
  fi
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração concluída com sucesso!"
    exit 0
  fi
done

echo ""
echo "❌ Erro ao conectar ao banco de dados"
exit 1
