#!/bin/bash
# test-jsend-routes.sh - Testa todas as rotas migradas para JSend
# Uso: ./test-jsend-routes.sh <TOKEN>

set -e

if [ -z "$1" ]; then
  echo "❌ Uso: ./test-jsend-routes.sh <TOKEN>"
  echo "   Obtenha o token fazendo login primeiro"
  exit 1
fi

TOKEN="$1"
API_URL="http://localhost:3001/api"

echo "🧪 Testando Rotas JSend - MyIA"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para testar rota
test_route() {
  local method=$1
  local endpoint=$2
  local description=$3
  local data=$4
  
  echo -n "Testing $method $endpoint ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer $TOKEN" \
      "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" \
      -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Verifica se tem "status" no JSON
  has_status=$(echo "$body" | grep -o '"status"' || echo "")
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ] && [ -n "$has_status" ]; then
    echo -e "${GREEN}✓${NC} ($http_code) - $description"
    echo "   Response: $(echo "$body" | jq -c '.status, .data | keys' 2>/dev/null || echo "$body" | head -c 100)"
  elif [ "$http_code" -ge 400 ] && [ -n "$has_status" ]; then
    echo -e "${YELLOW}⚠${NC}  ($http_code) - $description [Expected error]"
    echo "   Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body" | head -c 100)"
  else
    echo -e "${RED}✗${NC} ($http_code) - $description [Missing JSend format]"
    echo "   Response: $(echo "$body" | head -c 200)"
  fi
  echo ""
}

# 1. AI Controller
echo "📦 AI Controller"
echo "----------------"
test_route "GET" "/ai/providers" "List all AI providers"
test_route "POST" "/ai/test/groq" "Test Groq provider"
echo ""

# 2. Analytics Controller
echo "📊 Analytics Controller"
echo "-----------------------"
test_route "GET" "/analytics" "Get analytics data"
echo ""

# 3. Audit Controller
echo "🔍 Audit Controller"
echo "-------------------"
test_route "GET" "/audit/messages?limit=5" "List audits (limited)"
# Nota: /audit/messages/:messageId precisa de um messageId real
echo "   ⚠️  Skipping GET /audit/messages/:messageId (needs real messageId)"
echo ""

# 4. User Settings Controller
echo "⚙️  User Settings Controller"
echo "---------------------------"
test_route "GET" "/settings" "Get user settings"
test_route "PUT" "/settings" "Update user settings" '{"theme":"dark"}'
test_route "GET" "/settings/credentials" "Get API credentials"
test_route "POST" "/settings/credentials" "Update API credentials" '{"groq":"test-key"}'
echo ""

# 5. Auth Controller (já tinha JSend)
echo "🔐 Auth Controller (baseline)"
echo "-----------------------------"
test_route "GET" "/auth/me" "Get current user"
echo ""

# 6. Chat History Controller (já tinha JSend)
echo "💬 Chat History Controller (baseline)"
echo "-------------------------------------"
test_route "GET" "/chat-history" "List user chats"
echo ""

echo "================================"
echo "✅ Testes concluídos!"
echo ""
echo "📝 Legenda:"
echo "   ${GREEN}✓${NC} = Sucesso com JSend"
echo "   ${YELLOW}⚠${NC}  = Erro esperado com JSend"
echo "   ${RED}✗${NC} = Faltando formato JSend"
