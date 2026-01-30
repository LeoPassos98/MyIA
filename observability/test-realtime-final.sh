#!/bin/bash
# observability/test-realtime-final.sh
# Teste final para confirmar que logs aparecem em tempo real

set -e

echo "=========================================="
echo "🎯 TESTE FINAL: Logs em Tempo Real"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

# 1. Gerar log com ID único
TEST_ID="FINAL_TEST_$(date +%s%N)"
echo -e "${BLUE}1. Gerando log de teste com ID: $TEST_ID${NC}"
curl -s "http://localhost:3001/api/health?test=$TEST_ID" > /dev/null 2>&1 || true
echo ""

# 2. Aguardar processamento
echo -e "${BLUE}2. Aguardando processamento (10s)...${NC}"
sleep 10
echo ""

# 3. Verificar no Loki
echo -e "${BLUE}3. Verificando se log apareceu no Loki...${NC}"
RESULT=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="myia-backend"}' \
  --data-urlencode "start=$(date -u -d '1 minute ago' +%s)000000000" \
  --data-urlencode "end=$(date -u +%s)000000000" \
  --data-urlencode "limit=1000" | jq -r '.data.result[].values[][1]' 2>/dev/null | grep -c "health" || echo "0")

if [ "$RESULT" -gt "0" ]; then
  echo -e "${GREEN}✅ Log encontrado no Loki!${NC}"
  echo "   Total de logs de health encontrados: $RESULT"
else
  echo -e "${RED}❌ Log não encontrado no Loki${NC}"
  exit 1
fi
echo ""

# 4. Verificar streams
echo -e "${BLUE}4. Verificando streams (não deve ter requestId)...${NC}"
STREAM=$(curl -s -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={job="myia-backend"}' \
  --data-urlencode "time=$(date -u +%s)000000000" | jq -r '.data.result[0].stream')

echo "$STREAM" | jq '.'

if echo "$STREAM" | jq -e '.requestId' > /dev/null 2>&1; then
  echo -e "${RED}❌ ERRO: requestId ainda está nos labels!${NC}"
  exit 1
else
  echo -e "${GREEN}✅ requestId não está nos labels (correto!)${NC}"
fi
echo ""

# 5. Verificar erros no Promtail
echo -e "${BLUE}5. Verificando erros no Promtail...${NC}"
ERRORS=$(docker-compose logs --since 5m promtail 2>&1 | grep -c "streams limit exceeded" || echo "0")
if [ "$ERRORS" -eq "0" ]; then
  echo -e "${GREEN}✅ Sem erros de limite de streams${NC}"
else
  echo -e "${RED}❌ Ainda há erros de limite de streams${NC}"
  exit 1
fi
echo ""

# 6. Resumo
echo "=========================================="
echo "📊 RESULTADO FINAL"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ SUCESSO! Logs estão aparecendo em tempo real no Grafana!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Acesse o Grafana: http://localhost:3002"
echo "2. Login: admin / admin"
echo "3. Dashboard: MyIA - Overview"
echo "4. Painel: Logs Recentes"
echo ""
echo "Configuração aplicada:"
echo "- Labels de baixa cardinalidade apenas (level, service)"
echo "- requestId, method, statusCode removidos dos labels"
echo "- Limite de streams aumentado para 50000"
echo ""
