#!/usr/bin/env bash
# scripts/health/wait.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/utils.sh"

wait_for_port() {
  local port=$1
  local service_name=$2
  local max_wait=${3:-30}
  local pid_file=$4
  
  debug_log "Aguardando porta $port para $service_name (timeout: ${max_wait}s)"
  
  local waited=0
  while [ $waited -lt $max_wait ]; do
    # Verificar se porta está aberta
    if lsof -ti:$port >/dev/null 2>&1; then
      debug_log "Porta $port aberta após ${waited}s"
      return 0
    fi
    
    # Se PID fornecido, verificar se processo ainda está vivo
    if [ -n "$pid_file" ] && [ -f "$pid_file" ]; then
      if ! kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
        echo ""
        echo -e "${RED}❌ $service_name morreu durante inicialização${NC}"
        echo -e "${YELLOW}💡 Veja os logs para mais detalhes${NC}"
        debug_log "Processo morreu durante inicialização (PID file: $pid_file)"
        return 1
      fi
    fi
    
    sleep 1
    waited=$((waited + 1))
  done
  
  echo ""
  echo -e "${RED}❌ $service_name não respondeu após $max_wait segundos${NC}"
  echo -e "${YELLOW}💡 O serviço pode estar travado ou com erro${NC}"
  debug_log "Timeout aguardando porta $port após ${max_wait}s"
  return 1
}
