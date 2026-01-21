#!/bin/bash
# get-test-token.sh - Faz login e retorna o token

API_URL="http://localhost:3001/api"
EMAIL="${1:-leo@leo.com}"
PASSWORD="${2:-leoleo}"

echo "🔐 Fazendo login com $EMAIL..."

response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$API_URL/auth/login")

token=$(echo "$response" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -z "$token" ] || [ "$token" = "null" ]; then
  echo "❌ Erro ao obter token"
  echo "Response: $response"
  exit 1
fi

echo "✅ Token obtido!"
echo ""
echo "$token"
