#!/bin/bash

echo "🔄 Reiniciando o backend na VPS..."
echo ""

# Conectar à VPS e reiniciar o PM2
ssh -o StrictHostKeyChecking=no root@187.127.8.112 << 'EOF'
  echo "✅ Conectado à VPS"
  echo ""
  
  # Listar processos PM2
  echo "📋 Processos PM2 atuais:"
  pm2 list
  echo ""
  
  # Reiniciar o processo tech-refresh
  echo "🔄 Reiniciando tech-refresh..."
  pm2 restart tech-refresh
  echo ""
  
  # Verificar status
  echo "✅ Status após reinicialização:"
  pm2 status tech-refresh
  echo ""
  
  echo "✅ Backend reiniciado com sucesso!"
EOF

echo ""
echo "✅ Reinicialização concluída!"
