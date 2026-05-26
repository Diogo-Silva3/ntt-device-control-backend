#!/bin/bash

echo "Testando API de colaboradores na VPS..."
echo ""

echo "1. Teste com comAcesso=true (deve retornar 0):"
curl -s "http://localhost:3000/api/usuarios?role=COLABORADOR&comAcesso=true&limit=10000" \
  -H "Authorization: Bearer test" | jq '.total, (.data | length)'

echo ""
echo "2. Teste SEM comAcesso (deve retornar 678):"
curl -s "http://localhost:3000/api/usuarios?role=COLABORADOR&limit=10000" \
  -H "Authorization: Bearer test" | jq '.total, (.data | length)'

echo ""
echo "3. Primeiros 5 colaboradores:"
curl -s "http://localhost:3000/api/usuarios?role=COLABORADOR&limit=10000" \
  -H "Authorization: Bearer test" | jq '.data[0:5] | .[] | .nome'
