#!/bin/bash
# backend/scripts/test-logs-api.sh
# Script para testar a API de logs

echo "🔐 Fazendo login para obter token..."

# Login (usando credenciais do .env ou padrão)
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao obter token. Resposta:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Token obtido: ${TOKEN:0:20}..."
echo ""

BASE_URL="http://localhost:3001/api/logs"

# Função para fazer requisição e medir tempo
test_endpoint() {
  local name="$1"
  local url="$2"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪 Teste: $name"
  echo "📍 URL: $url"
  echo ""
  
  START=$(date +%s%3N)
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$url")
  END=$(date +%s%3N)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)
  
  DURATION=$((END - START))
  
  echo "⏱️  Tempo: ${DURATION}ms"
  echo "📊 Status: $HTTP_CODE"
  echo "📦 Resposta:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  
  # Verificar se passou no critério de performance
  if [ $DURATION -lt 100 ]; then
    echo "✅ Performance OK (< 100ms)"
  else
    echo "⚠️  Performance acima do esperado (> 100ms)"
  fi
  echo ""
}

# Testes
echo "🚀 Iniciando testes da API de Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Buscar todos os logs (paginado)
test_endpoint "Buscar todos os logs (paginado)" \
  "${BASE_URL}?page=1&limit=5"

# 2. Buscar logs de erro
test_endpoint "Buscar logs de erro" \
  "${BASE_URL}?level=error"

# 3. Buscar logs de um usuário específico
test_endpoint "Buscar logs de usuário específico" \
  "${BASE_URL}?userId=550e8400-e29b-41d4-a716-446655440000"

# 4. Buscar logs por requestId (correlação)
test_endpoint "Buscar logs por requestId (correlação)" \
  "${BASE_URL}/request/req-test-123"

# 5. Buscar logs com texto
test_endpoint "Buscar logs com texto 'provider'" \
  "${BASE_URL}?search=provider"

# 6. Buscar erros recentes
test_endpoint "Buscar erros recentes" \
  "${BASE_URL}/errors/recent?limit=5"

# 7. Estatísticas de logs
test_endpoint "Estatísticas de logs" \
  "${BASE_URL}/stats"

# 8. Buscar com múltiplos filtros
test_endpoint "Buscar com múltiplos filtros" \
  "${BASE_URL}?level=error&sort=desc&limit=3"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testes concluídos!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
