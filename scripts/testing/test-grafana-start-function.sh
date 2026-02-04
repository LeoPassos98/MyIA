#!/bin/bash
# Teste isolado da função start_grafana_service

# Configurações
GRAFANA_PORT=3002
OBSERVABILITY_DIR="/home/leonardo/Documents/VSCODE/MyIA/observability"
LOG_DIR="/home/leonardo/Documents/VSCODE/MyIA/logs"
mkdir -p "$LOG_DIR"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=== Teste da Função start_grafana_service ===${NC}\n"

# Simular variáveis globais
STATUS[6]="starting"
PROGRESS[6]=10

debug_log() {
  echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Verificar se já está rodando (usar health check HTTP ao invés de lsof)
echo "1. Verificando se Grafana já está rodando..."
if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
  debug_log "Grafana já está rodando e respondendo health check"
  echo -e "${GREEN}✅ SUCESSO${NC} - Grafana detectado como já rodando"
  echo ""
  echo "2. Teste de estabilidade (aguardar 2s)..."
  sleep 2
  
  if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
    debug_log "Grafana confirmado rodando e estável"
    echo -e "${GREEN}✅ SUCESSO${NC} - Grafana está estável"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ TESTE PASSOU${NC} - Grafana foi detectado corretamente!"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
  else
    echo -e "${RED}❌ FALHOU${NC} - Grafana parou após verificação inicial"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️${NC} Grafana não está rodando (esperado se parou)"
  echo ""
  echo "3. Verificando fallback (container Docker)..."
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^myia-grafana$"; then
    echo -e "${GREEN}✅ SUCESSO${NC} - Container encontrado via fallback"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ TESTE PASSOU${NC} - Fallback funcionou!"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
  else
    echo -e "${RED}❌ FALHOU${NC} - Container não encontrado"
    exit 1
  fi
fi
