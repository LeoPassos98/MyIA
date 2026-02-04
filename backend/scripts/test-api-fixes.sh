#!/bin/bash
# backend/scripts/test-api-fixes.sh
# Script para testar as correções da API de certificação

set -e

API_URL="http://localhost:3001/api/certification-queue"
TOKEN=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer login e obter token
login() {
    echo -e "${BLUE}🔐 Fazendo login...${NC}"
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"123@123.com","password":"123123"}')
    
    TOKEN=$(echo $RESPONSE | jq -r '.data.token')
    
    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Falha no login${NC}"
        echo $RESPONSE | jq .
        exit 1
    fi
    
    echo -e "${GREEN}✅ Login bem-sucedido${NC}"
    echo ""
}

# Função para testar endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local description="$5"
    
    echo -e "${BLUE}🧪 Teste: ${test_name}${NC}"
    echo -e "   ${description}"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "${API_URL}${endpoint}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSOU - Status: $HTTP_CODE${NC}"
        echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ FALHOU - Esperado: $expected_status, Recebido: $HTTP_CODE${NC}"
        echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"
    fi
    
    echo ""
}

# Função para testar POST endpoint
test_post_endpoint() {
    local test_name="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    local description="$5"
    
    echo -e "${BLUE}🧪 Teste: ${test_name}${NC}"
    echo -e "   ${description}"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}${endpoint}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSOU - Status: $HTTP_CODE${NC}"
        echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ FALHOU - Esperado: $expected_status, Recebido: $HTTP_CODE${NC}"
        echo "$BODY" | jq -C '.' 2>/dev/null || echo "$BODY"
    fi
    
    echo ""
}

# Início dos testes
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  TESTES DE CORREÇÕES DA API DE CERTIFICAÇÃO               ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Login
login

# ============================================================================
# ISSUE #1: Falha ao buscar detalhes de job com ID inválido
# ============================================================================
echo -e "${YELLOW}═══ ISSUE #1: Validação de Job ID ═══${NC}"
echo ""

test_endpoint \
    "Job ID Inválido (não é UUID)" \
    "GET" \
    "/jobs/invalid-id-123" \
    "400" \
    "Deve retornar erro 400 para ID inválido"

test_endpoint \
    "Job ID Inexistente (UUID válido)" \
    "GET" \
    "/jobs/00000000-0000-0000-0000-000000000000" \
    "404" \
    "Deve retornar erro 404 para UUID que não existe"

# ============================================================================
# ISSUE #2: Erro ao filtrar por status (QUEUED, PROCESSING, FAILED)
# ============================================================================
echo -e "${YELLOW}═══ ISSUE #2: Filtros de Status ═══${NC}"
echo ""

test_endpoint \
    "Filtro por Status Válido: COMPLETED" \
    "GET" \
    "/history?status=COMPLETED" \
    "200" \
    "Deve retornar sucesso para status válido"

test_endpoint \
    "Filtro por Status Válido: QUEUED" \
    "GET" \
    "/history?status=QUEUED" \
    "200" \
    "Deve retornar sucesso para status QUEUED"

test_endpoint \
    "Filtro por Status Válido: PROCESSING" \
    "GET" \
    "/history?status=PROCESSING" \
    "200" \
    "Deve retornar sucesso para status PROCESSING"

test_endpoint \
    "Filtro por Status Válido: FAILED" \
    "GET" \
    "/history?status=FAILED" \
    "200" \
    "Deve retornar sucesso para status FAILED"

test_endpoint \
    "Filtro por Status Inválido" \
    "GET" \
    "/history?status=INVALID_STATUS" \
    "400" \
    "Deve retornar erro 400 para status inválido"

test_endpoint \
    "Filtro por Type Válido: ALL_MODELS" \
    "GET" \
    "/history?type=ALL_MODELS" \
    "200" \
    "Deve retornar sucesso para type válido"

test_endpoint \
    "Filtro por Type Inválido" \
    "GET" \
    "/history?type=INVALID_TYPE" \
    "400" \
    "Deve retornar erro 400 para type inválido"

# ============================================================================
# ISSUE #3: Listagem com limite alto (10000) retorna erro
# ============================================================================
echo -e "${YELLOW}═══ ISSUE #3: Validação de Limite ═══${NC}"
echo ""

test_endpoint \
    "Limite Normal (20)" \
    "GET" \
    "/history?limit=20" \
    "200" \
    "Deve retornar sucesso para limite normal"

test_endpoint \
    "Limite Máximo (100)" \
    "GET" \
    "/history?limit=100" \
    "200" \
    "Deve retornar sucesso para limite máximo"

test_endpoint \
    "Limite Alto (10000) - Deve Ajustar para 100" \
    "GET" \
    "/history?limit=10000" \
    "200" \
    "Deve ajustar automaticamente para 100 e retornar sucesso"

test_endpoint \
    "Limite Inválido (0)" \
    "GET" \
    "/history?limit=0" \
    "400" \
    "Deve retornar erro 400 para limite inválido"

test_endpoint \
    "Limite Inválido (negativo)" \
    "GET" \
    "/history?limit=-1" \
    "400" \
    "Deve retornar erro 400 para limite negativo"

# ============================================================================
# TESTES ADICIONAIS: Certificações
# ============================================================================
echo -e "${YELLOW}═══ TESTES ADICIONAIS: Certificações ═══${NC}"
echo ""

test_endpoint \
    "Listar Certificações - Status Válido" \
    "GET" \
    "/certifications?status=COMPLETED" \
    "200" \
    "Deve retornar sucesso para status válido"

test_endpoint \
    "Listar Certificações - Status Inválido" \
    "GET" \
    "/certifications?status=INVALID" \
    "400" \
    "Deve retornar erro 400 para status inválido"

test_endpoint \
    "Listar Certificações - Região Válida" \
    "GET" \
    "/certifications?region=us-east-1" \
    "200" \
    "Deve retornar sucesso para região válida"

test_endpoint \
    "Listar Certificações - Região Inválida" \
    "GET" \
    "/certifications?region=invalid-region" \
    "400" \
    "Deve retornar erro 400 para região inválida"

test_endpoint \
    "Listar Certificações - Limite Alto" \
    "GET" \
    "/certifications?limit=5000" \
    "200" \
    "Deve ajustar automaticamente para 100 e retornar sucesso"

# ============================================================================
# RESUMO
# ============================================================================
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  TESTES CONCLUÍDOS                                         ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Todos os testes foram executados${NC}"
echo -e "${BLUE}📊 Verifique os resultados acima para confirmar as correções${NC}"
echo ""
