#!/bin/bash

echo "=== RESTAURANDO VINCULAÇÕES DO BACKUP ==="
echo ""

BACKUP_FILE="/var/backups/postgres/backup_20260421_020001.sql.gz"
DB_NAME="tech_refresh"
DB_USER="postgres"

echo "Backup: $BACKUP_FILE"
echo "Banco: $DB_NAME"
echo ""

# 1. Extrair backup
echo "📦 Extraindo backup..."
gunzip -c $BACKUP_FILE > /tmp/backup_full.sql
echo "✓ Backup extraído"
echo ""

# 2. Fazer backup da tabela atual (segurança)
echo "💾 Fazendo backup da tabela atual..."
pg_dump -U $DB_USER -d $DB_NAME -t vinculacoes --data-only > /tmp/vinculacoes_atual.sql
echo "✓ Backup atual salvo em /tmp/vinculacoes_atual.sql"
echo ""

# 3. Limpar tabela vinculacoes
echo "🗑️  Limpando tabela vinculacoes..."
psql -U $DB_USER -d $DB_NAME -c "TRUNCATE TABLE vinculacoes RESTART IDENTITY CASCADE;"
echo "✓ Tabela limpa"
echo ""

# 4. Extrair e restaurar apenas vinculacoes do backup
echo "📥 Restaurando vinculacoes do backup..."
grep -A 100000 "COPY public.vinculacoes" /tmp/backup_full.sql | grep -B 100000 "^\\\." > /tmp/vinculacoes_restore.sql

# Adicionar comando COPY no início se não existir
if ! grep -q "COPY public.vinculacoes" /tmp/vinculacoes_restore.sql; then
    echo "❌ Erro: Não foi possível extrair dados da tabela vinculacoes"
    exit 1
fi

psql -U $DB_USER -d $DB_NAME < /tmp/vinculacoes_restore.sql
echo "✓ Vinculacoes restauradas"
echo ""

# 5. Verificar resultado
echo "📊 Verificando resultado..."
TOTAL=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vinculacoes WHERE equipamento_id IN (SELECT id FROM equipamentos WHERE projeto_id = 1);")
ATIVAS=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vinculacoes WHERE ativa = true AND equipamento_id IN (SELECT id FROM equipamentos WHERE projeto_id = 1);")
ENTREGUES=$(psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM vinculacoes WHERE ativa = true AND status_entrega = 'ENTREGUE' AND equipamento_id IN (SELECT id FROM equipamentos WHERE projeto_id = 1);")

echo "   Total de vinculacoes: $TOTAL"
echo "   Ativas: $ATIVAS"
echo "   Entregues: $ENTREGUES"
echo ""

if [ "$ENTREGUES" -ge 34 ]; then
    echo "🎉 SUCESSO! Temos $ENTREGUES entregues (34 ou mais)!"
else
    echo "⚠️  Ainda faltam $((34 - ENTREGUES)) para chegar a 34"
fi

echo ""
echo "✅ RESTAURAÇÃO CONCLUÍDA!"
echo ""
echo "⚠️  PRÓXIMO PASSO: Reiniciar o backend"
echo "   pm2 restart ntt-backend"
