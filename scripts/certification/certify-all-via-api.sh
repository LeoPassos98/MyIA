#!/bin/bash
# Script para certificar todos os modelos via API
# Modo interativo usando curl

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

API_URL="http://localhost:3001"

echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   Certificação de Todos os Modelos - MyIA     ║${NC}"
echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Fazer login
echo -e "${CYAN}[1/5]${NC} Fazendo login na API..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗${NC} Falha no login"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✓${NC} Login realizado com sucesso"
echo ""

# 2. Verificar modelos ativos
echo -e "${CYAN}[2/5]${NC} Verificando modelos ativos no banco de dados..."
MODELS_COUNT=$(psql -U leonardo -h localhost -d myia -t -c "SELECT COUNT(*) FROM ai_models WHERE \"isActive\" = true;")
MODELS_COUNT=$(echo "$MODELS_COUNT" | xargs)

echo -e "${GREEN}✓${NC} Total de modelos ativos: ${BOLD}$MODELS_COUNT${NC}"
echo ""

# Listar modelos
echo -e "${BLUE}Modelos que serão certificados:${NC}"
psql -U leonardo -h localhost -d myia -c "SELECT m.name, p.name as provider FROM ai_models m JOIN ai_providers p ON m.\"providerId\" = p.id WHERE m.\"isActive\" = true ORDER BY p.name, m.name;"
echo ""

# 3. Confirmar com usuário
echo -e "${YELLOW}⚠${NC}  Isso irá criar um job para certificar ${BOLD}TODOS${NC} os $MODELS_COUNT modelos ativos!"
echo -e "${YELLOW}⚠${NC}  Região: ${BOLD}us-east-1${NC}"
echo ""
read -p "Deseja continuar? (s/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo -e "${YELLOW}✗${NC} Operação cancelada pelo usuário"
  exit 0
fi

echo ""

# 4. Criar job de certificação
echo -e "${CYAN}[3/5]${NC} Criando job de certificação para todos os modelos..."

CERTIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/certification-queue/certify-all" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"regions":["us-east-1"]}')

# Verificar se foi bem-sucedido
STATUS=$(echo "$CERTIFY_RESPONSE" | jq -r '.status')

if [ "$STATUS" != "success" ]; then
  echo -e "${RED}✗${NC} Falha ao criar job de certificação"
  echo "$CERTIFY_RESPONSE" | jq .
  exit 1
fi

JOB_ID=$(echo "$CERTIFY_RESPONSE" | jq -r '.data.jobId')
TOTAL_JOBS=$(echo "$CERTIFY_RESPONSE" | jq -r '.data.totalJobs')

echo -e "${GREEN}✓${NC} Job criado com sucesso!"
echo -e "  ${BOLD}Job ID:${NC} $JOB_ID"
echo -e "  ${BOLD}Total de certificações:${NC} $TOTAL_JOBS"
echo ""

# 5. Buscar detalhes do job
echo -e "${CYAN}[4/5]${NC} Buscando detalhes do job..."
sleep 2

JOB_DETAILS=$(curl -s -X GET "$API_URL/api/certification-queue/jobs/$JOB_ID/status" \
  -H "Authorization: Bearer $TOKEN")

echo "$JOB_DETAILS" | jq '{
  id: .data.id,
  type: .data.type,
  status: .data.status,
  regions: .data.regions,
  totalModels: .data.totalModels,
  processedModels: .data.processedModels,
  successCount: .data.successCount,
  failureCount: .data.failureCount
}'

echo ""

# 6. Buscar estatísticas da fila
echo -e "${CYAN}[5/5]${NC} Verificando estatísticas da fila..."

STATS=$(curl -s -X GET "$API_URL/api/certification-queue/stats" \
  -H "Authorization: Bearer $TOKEN")

echo -e "\n${BOLD}Estatísticas da Fila:${NC}"
echo "$STATS" | jq '{
  waiting: .data.queue.queue.waiting,
  active: .data.queue.queue.active,
  completed: .data.queue.queue.completed,
  failed: .data.queue.queue.failed
}'

echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}✓ CERTIFICAÇÃO INICIADA COM SUCESSO!${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo -e "  1. Monitorar progresso: ${CYAN}./manage-certifications.sh${NC} (opção 4)"
echo -e "  2. Ver logs: ${CYAN}./manage-certifications.sh${NC} (opção 9)"
echo -e "  3. Ver estatísticas: ${CYAN}./manage-certifications.sh${NC} (opção 7)"
echo -e "  4. Bull Board: ${CYAN}http://localhost:3001/admin/queues${NC}"
echo ""
echo -e "${YELLOW}Job ID para referência:${NC} ${BOLD}$JOB_ID${NC}"
echo ""

# Salvar Job ID em arquivo para referência
echo "$JOB_ID" > .last-certification-job-id
echo -e "${GREEN}✓${NC} Job ID salvo em ${CYAN}.last-certification-job-id${NC}"
echo ""
