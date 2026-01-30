#!/bin/bash
# observability/diagnose-grafana-realtime.sh
# Script de diagnóstico completo para logs em tempo real no Grafana

set -e

echo "=========================================="
echo "🔍 DIAGNÓSTICO: Logs em Tempo Real no Grafana"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar serviços Docker
echo -e "${BLUE}1. Verificando serviços Docker...${NC}"
cd "$(dirname "$0")"
docker-compose ps
echo ""

# 2. Verificar logs do backend
echo -e "${BLUE}2. Verificando arquivos de log do backend...${NC}"
ls -lh ../backend/logs/*.log 2>/dev/null || echo "Nenhum arquivo .log encontrado"
echo ""

# 3. Verificar últimas linhas dos logs
echo -e "${BLUE}3. Últimas 5 linhas do combined.log:${NC}"
tail -n 5 ../backend/logs/combined.log 2>/dev/null || echo "Arquivo não encontrado"
echo ""

# 4. Verificar logs do Promtail
echo -e "${BLUE}4. Verificando logs do Promtail (últimas 20 linhas):${NC}"
docker-compose logs --tail=20 promtail 2>&1 | grep -E "(error|warn|Adding target)" || echo "Sem erros/warnings"
echo ""

# 5. Verificar configuração do Loki
echo -e "${BLUE}5. Verificando limites do Loki:${NC}"
echo "max_streams_per_user configurado:"
grep "max_streams_per_user" loki/loki-config.yml || echo "Não encontrado"
echo ""

# 6. Consultar streams ativos no Loki
echo -e "${BLUE}6. Consultando streams ativos no Loki:${NC}"
STREAMS=$(curl -s "http://localhost:3100/loki/api/v1/label/__name__/values" | jq -r '.data | length' 2>/dev/null || echo "0")
echo "Total de streams: $STREAMS"
echo ""

# 7. Consultar labels do Loki
echo -e "${BLUE}7. Labels configurados no Loki:${NC}"
curl -s "http://localhost:3100/loki/api/v1/labels" | jq -r '.data[]' 2>/dev/null | head -20 || echo "Erro ao consultar"
echo ""

# 8. Testar query do Grafana
echo -e "${BLUE}8. Testando query do Grafana (últimos 5 minutos):${NC}"
QUERY='{job="myia-backend"}'
START=$(date -u -d '5 minutes ago' +%s)000000000
END=$(date -u +%s)000000000
RESULT=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode "query=$QUERY" \
  --data-urlencode "start=$START" \
  --data-urlencode "end=$END" \
  --data-urlencode "limit=10" | jq -r '.data.result | length' 2>/dev/null || echo "0")
echo "Logs encontrados: $RESULT"
echo ""

# 9. Verificar timestamps
echo -e "${BLUE}9. Verificando timestamps dos logs:${NC}"
echo "Timezone do sistema: $(date +%Z)"
echo "Hora atual: $(date)"
echo "Hora UTC: $(date -u)"
echo ""

# 10. Diagnóstico final
echo -e "${BLUE}10. Diagnóstico Final:${NC}"
echo ""

# Verificar se há erro de streams
STREAM_ERROR=$(docker-compose logs promtail 2>&1 | grep -c "streams limit exceeded" || echo "0")
if [ "$STREAM_ERROR" -gt "0" ]; then
  echo -e "${RED}❌ PROBLEMA ENCONTRADO: Limite de streams excedido!${NC}"
  echo -e "${YELLOW}   Causa: requestId está sendo usado como label, criando muitos streams${NC}"
  echo -e "${YELLOW}   Solução: Remover requestId dos labels no promtail-config.yml${NC}"
  echo ""
else
  echo -e "${GREEN}✅ Sem erros de limite de streams${NC}"
fi

# Verificar se logs estão sendo gerados
LAST_LOG_TIME=$(stat -c %Y ../backend/logs/combined.log 2>/dev/null || echo "0")
CURRENT_TIME=$(date +%s)
TIME_DIFF=$((CURRENT_TIME - LAST_LOG_TIME))

if [ "$TIME_DIFF" -lt 300 ]; then
  echo -e "${GREEN}✅ Logs estão sendo gerados (última modificação: ${TIME_DIFF}s atrás)${NC}"
else
  echo -e "${RED}❌ Logs não estão sendo gerados recentemente (última modificação: ${TIME_DIFF}s atrás)${NC}"
fi

# Verificar se Promtail está lendo os logs
PROMTAIL_HEALTHY=$(docker-compose ps promtail | grep -c "Up" || echo "0")
if [ "$PROMTAIL_HEALTHY" -gt "0" ]; then
  echo -e "${GREEN}✅ Promtail está rodando${NC}"
else
  echo -e "${RED}❌ Promtail não está rodando${NC}"
fi

# Verificar se Loki está saudável
LOKI_HEALTHY=$(curl -s http://localhost:3100/ready 2>/dev/null || echo "error")
if [ "$LOKI_HEALTHY" == "ready" ]; then
  echo -e "${GREEN}✅ Loki está saudável${NC}"
else
  echo -e "${RED}❌ Loki não está respondendo${NC}"
fi

# Verificar se Grafana está saudável
GRAFANA_HEALTHY=$(curl -s http://localhost:3002/api/health 2>/dev/null | jq -r '.database' || echo "error")
if [ "$GRAFANA_HEALTHY" == "ok" ]; then
  echo -e "${GREEN}✅ Grafana está saudável${NC}"
else
  echo -e "${RED}❌ Grafana não está respondendo${NC}"
fi

echo ""
echo "=========================================="
echo "📋 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Para corrigir o problema de logs em tempo real:"
echo "1. Editar observability/promtail/promtail-config.yml"
echo "2. Remover 'requestId' da seção 'labels' (manter apenas em 'expressions')"
echo "3. Aumentar max_streams_per_user no loki-config.yml"
echo "4. Reiniciar os serviços: docker-compose restart"
echo ""
