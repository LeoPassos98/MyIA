#!/bin/bash
# observability/validate-realtime-logs.sh
# Script de validação end-to-end para logs em tempo real

set -e

echo "=========================================="
echo "✅ VALIDAÇÃO: Logs em Tempo Real"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

PASSED=0
FAILED=0

# Função para testar
test_step() {
  local name="$1"
  local command="$2"
  
  echo -e "${BLUE}Testando: $name${NC}"
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSOU${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FALHOU${NC}"
    ((FAILED++))
  fi
  echo ""
}

# 1. Verificar serviços Docker
echo -e "${BLUE}1. Verificando serviços Docker...${NC}"
test_step "Loki está rodando" "docker-compose ps loki | grep -q 'Up'"
test_step "Promtail está rodando" "docker-compose ps promtail | grep -q 'Up'"
test_step "Grafana está rodando" "docker-compose ps grafana | grep -q 'Up'"

# 2. Verificar saúde dos serviços
echo -e "${BLUE}2. Verificando saúde dos serviços...${NC}"
test_step "Loki está saudável" "curl -sf http://localhost:3100/ready | grep -q 'ready'"
test_step "Grafana está saudável" "curl -sf http://localhost:3002/api/health | jq -e '.database == \"ok\"'"

# 3. Gerar log de teste
echo -e "${BLUE}3. Gerando log de teste...${NC}"
TIMESTAMP=$(date -u +%s)
TEST_MESSAGE="TESTE_VALIDACAO_$TIMESTAMP"

# Fazer requisição que gera log
curl -s http://localhost:3001/api/health > /dev/null 2>&1 || true
echo -e "${YELLOW}Log de teste gerado${NC}"
echo ""

# Aguardar processamento
echo -e "${BLUE}4. Aguardando processamento (10s)...${NC}"
sleep 10
echo ""

# 4. Verificar se log aparece no arquivo
echo -e "${BLUE}5. Verificando arquivo de log...${NC}"
test_step "Log foi escrito no arquivo" "test -f ../backend/logs/combined.log"
test_step "Arquivo foi modificado recentemente" "find ../backend/logs/combined.log -mmin -1 | grep -q '.'"

# 5. Verificar se Promtail leu o arquivo
echo -e "${BLUE}6. Verificando Promtail...${NC}"
test_step "Promtail não tem erros de streams" "! docker-compose logs promtail 2>&1 | grep -q 'streams limit exceeded'"

# 6. Verificar se logs aparecem no Loki
echo -e "${BLUE}7. Verificando Loki...${NC}"
QUERY='{job="myia-backend"}'
START=$(date -u -d '2 minutes ago' +%s)000000000
END=$(date -u +%s)000000000

RESULT=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode "query=$QUERY" \
  --data-urlencode "start=$START" \
  --data-urlencode "end=$END" \
  --data-urlencode "limit=100" | jq -r '.data.result | length' 2>/dev/null || echo "0")

if [ "$RESULT" -gt "0" ]; then
  echo -e "${GREEN}✅ Logs encontrados no Loki: $RESULT streams${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Nenhum log encontrado no Loki${NC}"
  ((FAILED++))
fi
echo ""

# 7. Verificar contagem de streams
echo -e "${BLUE}8. Verificando contagem de streams...${NC}"
LABELS=$(curl -s "http://localhost:3100/loki/api/v1/labels" | jq -r '.data | length' 2>/dev/null || echo "0")
echo "Labels únicos: $LABELS"

# Verificar se requestId não está nos labels
if curl -s "http://localhost:3100/loki/api/v1/labels" | jq -r '.data[]' | grep -q "requestId"; then
  echo -e "${RED}❌ requestId ainda está nos labels (problema!)${NC}"
  ((FAILED++))
else
  echo -e "${GREEN}✅ requestId não está nos labels (correto!)${NC}"
  ((PASSED++))
fi
echo ""

# 8. Verificar dashboard do Grafana
echo -e "${BLUE}9. Verificando dashboard do Grafana...${NC}"
test_step "Dashboard existe" "curl -sf -u admin:admin http://localhost:3002/api/dashboards/uid/myia-overview | jq -e '.dashboard.title'"

# 9. Teste de latência
echo -e "${BLUE}10. Teste de latência (tempo até log aparecer)...${NC}"
echo "Gerando log de teste com timestamp único..."
TEST_ID="TEST_$(date +%s%N)"

# Gerar log
curl -s "http://localhost:3001/api/health?test=$TEST_ID" > /dev/null 2>&1 || true

# Aguardar e verificar
for i in {1..30}; do
  sleep 1
  FOUND=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
    --data-urlencode "query={job=\"myia-backend\"}" \
    --data-urlencode "start=$(date -u -d '1 minute ago' +%s)000000000" \
    --data-urlencode "end=$(date -u +%s)000000000" \
    --data-urlencode "limit=1000" | jq -r '.data.result[].values[][1]' 2>/dev/null | grep -c "$TEST_ID" || echo "0")
  
  if [ "$FOUND" -gt "0" ]; then
    echo -e "${GREEN}✅ Log apareceu no Loki em ${i}s${NC}"
    ((PASSED++))
    break
  fi
  
  if [ "$i" -eq "30" ]; then
    echo -e "${RED}❌ Log não apareceu no Loki após 30s${NC}"
    ((FAILED++))
  fi
done
echo ""

# Resumo
echo "=========================================="
echo "📊 RESUMO DA VALIDAÇÃO"
echo "=========================================="
echo ""
echo -e "Testes passados: ${GREEN}$PASSED${NC}"
echo -e "Testes falhados: ${RED}$FAILED${NC}"
echo ""

if [ "$FAILED" -eq "0" ]; then
  echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
  echo ""
  echo "Logs estão aparecendo em tempo real no Grafana!"
  echo "Acesse: http://localhost:3002"
  exit 0
else
  echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
  echo ""
  echo "Verifique:"
  echo "1. Backend está rodando: ./start.sh status backend"
  echo "2. Logs do Promtail: docker-compose logs promtail"
  echo "3. Logs do Loki: docker-compose logs loki"
  exit 1
fi
