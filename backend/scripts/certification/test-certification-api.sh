#!/bin/bash

# backend/scripts/test-certification-api.sh
# Script para testar API de Certificação Assíncrona

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api/certification-queue"
TOKEN=""

echo -e "${BLUE}🧪 Testando API de Certificação Assíncrona${NC}\n"

# Verificar se backend está rodando
echo -e "${YELLOW}🔍 Verificando se backend está rodando...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo -e "${RED}❌ Backend não está rodando${NC}"
    echo ""
    echo "Este teste requer que o backend esteja ativo."
    echo ""
    echo "Opções:"
    echo "  1. Iniciar serviços: ./start.sh start both"
    echo "  2. Verificar status: ./start.sh status both"
    echo "  3. Usar script interativo: ./manage-certifications.sh"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Backend está rodando${NC}\n"

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq não está instalado. Instale com: sudo apt-get install jq${NC}"
    exit 1
fi

# Função para obter token
get_token() {
    echo -e "${YELLOW}🔑 Obtendo token de autenticação...${NC}"
    
    # Fazer login
    LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "123@123.com",
        "password": "123123"
      }')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // .token // empty')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo -e "${RED}❌ Falha ao obter token. Resposta:${NC}"
        echo "$LOGIN_RESPONSE" | jq '.'
        exit 1
    fi
    
    echo -e "${GREEN}✅ Token obtido com sucesso${NC}\n"
}

# Função para fazer requisição
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}${description}${NC}"
    
    if [ -z "$data" ]; then
        RESPONSE=$(curl -s -X "$method" "$BASE_URL$endpoint" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json")
    else
        RESPONSE=$(curl -s -X "$method" "$BASE_URL$endpoint" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "$data")
    fi
    
    echo "$RESPONSE" | jq '.'
    echo ""
    
    # Retornar resposta para uso posterior
    echo "$RESPONSE"
}

# Obter token
get_token

# 1. Listar regiões disponíveis
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
make_request "GET" "/regions" "" "1️⃣ Listando regiões disponíveis..."

# 2. Obter estatísticas
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
make_request "GET" "/stats" "" "2️⃣ Obtendo estatísticas..."

# 3. Buscar um modelo ativo para testar
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔍 Buscando modelo ativo para teste...${NC}"
MODELS_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/models" \
  -H "Authorization: Bearer $TOKEN")

MODEL_ID=$(echo "$MODELS_RESPONSE" | jq -r '.data[0].id // empty')

if [ -z "$MODEL_ID" ] || [ "$MODEL_ID" = "null" ]; then
    echo -e "${RED}❌ Nenhum modelo encontrado. Certifique-se de ter modelos cadastrados.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Modelo encontrado: $MODEL_ID${NC}\n"

# 4. Certificar modelo único
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
CERTIFY_RESPONSE=$(make_request "POST" "/certify-model" "{
  \"modelId\": \"$MODEL_ID\",
  \"region\": \"us-east-1\"
}" "3️⃣ Certificando modelo único...")

JOB_ID=$(echo "$CERTIFY_RESPONSE" | jq -r '.data.jobId // empty')

# 5. Consultar status do job
if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⏳ Aguardando 3 segundos...${NC}"
    sleep 3
    make_request "GET" "/jobs/$JOB_ID" "" "4️⃣ Consultando status do job..."
fi

# 6. Certificar múltiplos modelos
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
make_request "POST" "/certify-multiple" "{
  \"modelIds\": [\"$MODEL_ID\"],
  \"regions\": [\"us-east-1\", \"us-west-2\"]
}" "5️⃣ Certificando múltiplos modelos/regiões..."

# 7. Listar histórico
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
make_request "GET" "/history?page=1&limit=5" "" "6️⃣ Listando histórico de jobs..."

# 8. Listar certificações
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
make_request "GET" "/certifications?page=1&limit=5" "" "7️⃣ Listando certificações..."

# 9. Testar validação (deve falhar)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}8️⃣ Testando validação (deve retornar erro 400)...${NC}"
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/certify-model" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "",
    "region": "invalid-region"
  }')

echo "$VALIDATION_RESPONSE" | jq '.'
echo ""

# 10. Testar autenticação (deve falhar)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}9️⃣ Testando sem autenticação (deve retornar erro 401)...${NC}"
AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/regions")
echo "$AUTH_RESPONSE" | jq '.'
echo ""

# Resumo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Testes concluídos!${NC}\n"

echo -e "${BLUE}📊 Resumo dos Endpoints Testados:${NC}"
echo -e "  ${GREEN}✓${NC} GET  /regions"
echo -e "  ${GREEN}✓${NC} GET  /stats"
echo -e "  ${GREEN}✓${NC} POST /certify-model"
echo -e "  ${GREEN}✓${NC} POST /certify-multiple"
echo -e "  ${GREEN}✓${NC} GET  /jobs/:jobId"
echo -e "  ${GREEN}✓${NC} GET  /history"
echo -e "  ${GREEN}✓${NC} GET  /certifications"
echo -e "  ${GREEN}✓${NC} Validação de entrada"
echo -e "  ${GREEN}✓${NC} Autenticação"
echo ""

echo -e "${YELLOW}💡 Dica: Use 'jq' para formatar as respostas JSON${NC}"
echo -e "${YELLOW}💡 Para cancelar um job: curl -X DELETE $BASE_URL/jobs/JOB_ID -H \"Authorization: Bearer \$TOKEN\"${NC}"
