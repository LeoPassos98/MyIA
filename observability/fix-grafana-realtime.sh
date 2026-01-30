#!/bin/bash
# observability/fix-grafana-realtime.sh
# Script para corrigir logs em tempo real no Grafana

set -e

echo "=========================================="
echo "🔧 CORREÇÃO: Logs em Tempo Real no Grafana"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

# 1. Parar os serviços
echo -e "${BLUE}1. Parando serviços...${NC}"
docker-compose down
echo ""

# 2. Limpar dados do Loki (streams antigos)
echo -e "${BLUE}2. Limpando dados antigos do Loki...${NC}"
echo -e "${YELLOW}   Isso removerá todos os logs antigos para resetar os streams${NC}"
read -p "   Confirma limpeza dos dados do Loki? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  rm -rf data/loki/chunks/*
  rm -rf data/loki/tsdb-*
  echo -e "${GREEN}   ✅ Dados do Loki limpos${NC}"
else
  echo -e "${YELLOW}   ⚠️  Limpeza cancelada. Streams antigos podem causar problemas.${NC}"
fi
echo ""

# 3. Iniciar os serviços
echo -e "${BLUE}3. Iniciando serviços...${NC}"
docker-compose up -d
echo ""

# 4. Aguardar serviços ficarem saudáveis
echo -e "${BLUE}4. Aguardando serviços ficarem saudáveis...${NC}"
sleep 10

# Verificar Loki
for i in {1..30}; do
  if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Loki está pronto${NC}"
    break
  fi
  echo -e "${YELLOW}   ⏳ Aguardando Loki... ($i/30)${NC}"
  sleep 2
done

# Verificar Grafana
for i in {1..30}; do
  if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Grafana está pronto${NC}"
    break
  fi
  echo -e "${YELLOW}   ⏳ Aguardando Grafana... ($i/30)${NC}"
  sleep 2
done
echo ""

# 5. Gerar logs de teste
echo -e "${BLUE}5. Gerando logs de teste...${NC}"
echo -e "${YELLOW}   Gerando 10 requisições para criar logs novos${NC}"
for i in {1..10}; do
  curl -s http://localhost:3001/api/health > /dev/null 2>&1 || true
  sleep 0.5
done
echo -e "${GREEN}   ✅ Logs de teste gerados${NC}"
echo ""

# 6. Aguardar Promtail processar
echo -e "${BLUE}6. Aguardando Promtail processar logs...${NC}"
sleep 5
echo ""

# 7. Verificar se logs aparecem no Loki
echo -e "${BLUE}7. Verificando logs no Loki...${NC}"
QUERY='{job="myia-backend"}'
START=$(date -u -d '1 minute ago' +%s)000000000
END=$(date -u +%s)000000000
RESULT=$(curl -s -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode "query=$QUERY" \
  --data-urlencode "start=$START" \
  --data-urlencode "end=$END" \
  --data-urlencode "limit=10" | jq -r '.data.result | length' 2>/dev/null || echo "0")

if [ "$RESULT" -gt "0" ]; then
  echo -e "${GREEN}   ✅ Logs encontrados no Loki: $RESULT streams${NC}"
else
  echo -e "${RED}   ❌ Nenhum log encontrado no Loki${NC}"
  echo -e "${YELLOW}   Verifique os logs do Promtail: docker-compose logs promtail${NC}"
fi
echo ""

# 8. Verificar erros no Promtail
echo -e "${BLUE}8. Verificando erros no Promtail...${NC}"
ERRORS=$(docker-compose logs promtail 2>&1 | grep -c "error" || echo "0")
if [ "$ERRORS" -eq "0" ]; then
  echo -e "${GREEN}   ✅ Sem erros no Promtail${NC}"
else
  echo -e "${YELLOW}   ⚠️  $ERRORS erros encontrados no Promtail${NC}"
  echo -e "${YELLOW}   Execute: docker-compose logs promtail | grep error${NC}"
fi
echo ""

# 9. Instruções finais
echo "=========================================="
echo "📋 PRÓXIMOS PASSOS"
echo "=========================================="
echo ""
echo "1. Acesse o Grafana: http://localhost:3002"
echo "   - Usuário: admin"
echo "   - Senha: admin"
echo ""
echo "2. Abra o dashboard 'MyIA - Overview'"
echo ""
echo "3. Verifique se os logs aparecem no painel 'Logs Recentes'"
echo ""
echo "4. Se não aparecer, verifique:"
echo "   - Intervalo de tempo (canto superior direito)"
echo "   - Auto-refresh está habilitado (10s)"
echo "   - Backend está rodando e gerando logs"
echo ""
echo "5. Para gerar mais logs de teste:"
echo "   curl http://localhost:3001/api/health"
echo ""
echo -e "${GREEN}✅ Correção aplicada com sucesso!${NC}"
echo ""
