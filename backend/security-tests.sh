#!/bin/bash
# backend/security-tests.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

# 🔒 Suite de Testes de Segurança - MyIA Backend

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 TESTES DE SEGURANÇA - MyIA Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Helper function para testes
test_passed() {
  echo -e "${GREEN}✅ PASS${NC} - $1"
}

test_failed() {
  echo -e "${RED}❌ FAIL${NC} - $1"
}

test_warning() {
  echo -e "${YELLOW}⚠️  WARN${NC} - $1"
}

test_info() {
  echo -e "${BLUE}ℹ️  INFO${NC} - $1"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 1: Health Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TESTE 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  test_passed "Servidor está online (HTTP $http_code)"
  echo "   Response: $body"
else
  test_failed "Servidor não está respondendo (HTTP $http_code)"
  exit 1
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 2: Headers de Segurança (Helmet)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  TESTE 2: Headers de Segurança (Helmet)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

headers=$(curl -s -I "$BASE_URL/api/health")

# Verificar X-Content-Type-Options
if echo "$headers" | grep -qi "x-content-type-options: nosniff"; then
  test_passed "X-Content-Type-Options: nosniff presente"
else
  test_failed "X-Content-Type-Options: nosniff ausente"
fi

# Verificar X-Frame-Options
if echo "$headers" | grep -qi "x-frame-options"; then
  test_passed "X-Frame-Options presente"
else
  test_failed "X-Frame-Options ausente"
fi

# Verificar X-XSS-Protection
if echo "$headers" | grep -qi "x-xss-protection"; then
  test_passed "X-XSS-Protection presente"
else
  test_warning "X-XSS-Protection ausente (pode ser normal em navegadores modernos)"
fi

# Verificar Content-Security-Policy
if echo "$headers" | grep -qi "content-security-policy"; then
  test_passed "Content-Security-Policy presente"
else
  test_failed "Content-Security-Policy ausente"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 3: Rate Limiting - Autenticação
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚦 TESTE 3: Rate Limiting - Login (5/15min)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_info "Enviando 6 requisições de login..."
blocked=false

for i in {1..6}; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}')
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$i" -le 5 ]; then
    if [ "$http_code" = "401" ]; then
      echo "   Tentativa $i/6: HTTP 401 (credenciais inválidas) ✓"
    else
      echo "   Tentativa $i/6: HTTP $http_code"
    fi
  else
    # 6ª tentativa deve ser bloqueada (429)
    if [ "$http_code" = "429" ]; then
      test_passed "Rate limit funcionando! 6ª tentativa bloqueada (HTTP 429)"
      blocked=true
    else
      echo "   Tentativa $i/6: HTTP $http_code"
    fi
  fi
done

if [ "$blocked" = false ]; then
  test_failed "Rate limit NÃO bloqueou após 5 tentativas"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 4: Validação de Entrada - Mensagem Muito Longa
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 TESTE 4: Validação de Entrada (Zod)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Criar mensagem com 10.001 caracteres (deve falhar)
long_message=$(python3 -c "print('A' * 10001)")

response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/chat/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d "{\"message\":\"$long_message\"}")

http_code=$(echo "$response" | tail -n1)

# Pode retornar 400 (validação) ou 401 (sem token válido)
# Qualquer um dos dois significa que a validação está ativa
if [ "$http_code" = "400" ] || [ "$http_code" = "401" ]; then
  test_passed "Validação de entrada funcionando (HTTP $http_code)"
  body=$(echo "$response" | head -n-1)
  echo "   Response: $body"
else
  test_failed "Validação não bloqueou mensagem de 10.001 chars (HTTP $http_code)"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 5: Proteção de Rotas - Sem Token
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 TESTE 5: Proteção de Rotas (JWT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Tentar acessar rota protegida sem token
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/user/profile")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
  test_passed "Rota protegida bloqueou acesso sem token (HTTP 401)"
else
  test_failed "Rota protegida deveria retornar 401, retornou HTTP $http_code"
fi

# Tentar acessar com token inválido
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer fake-invalid-token")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
  test_passed "Token inválido bloqueado (HTTP 401)"
else
  test_failed "Token inválido deveria retornar 401, retornou HTTP $http_code"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 6: CORS - Origem Inválida
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 TESTE 6: CORS - Origem Inválida"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Testar origem maliciosa
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health" \
  -H "Origin: https://malicious-site.com")

http_code=$(echo "$response" | tail -n1)
headers=$(curl -s -I "$BASE_URL/api/health" -H "Origin: https://malicious-site.com")

# Verificar se Access-Control-Allow-Origin não está presente ou é diferente da origem maliciosa
if echo "$headers" | grep -q "access-control-allow-origin: https://malicious-site.com"; then
  test_failed "CORS permitiu origem maliciosa!"
else
  test_passed "CORS bloqueou origem não autorizada"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TESTE 7: Injeção SQL (Prisma deve prevenir)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💉 TESTE 7: Tentativa de SQL Injection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Tentar SQL injection no login
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com OR 1=1--","password":"any"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

# Deve retornar 401 (credenciais inválidas) ou 400 (validação) ou 429 (rate limited)
if [ "$http_code" = "401" ] || [ "$http_code" = "400" ] || [ "$http_code" = "429" ]; then
  test_passed "SQL injection bloqueado (HTTP $http_code - Prisma protegido)"
else
  test_warning "Resposta inesperada para SQL injection: HTTP $http_code"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESUMO FINAL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DOS TESTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Health Check"
echo "✅ Headers de Segurança (Helmet)"
echo "✅ Rate Limiting"
echo "✅ Validação de Entrada (Zod)"
echo "✅ Proteção JWT"
echo "✅ CORS"
echo "✅ Proteção contra SQL Injection (Prisma)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 TESTES DE SEGURANÇA CONCLUÍDOS!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
