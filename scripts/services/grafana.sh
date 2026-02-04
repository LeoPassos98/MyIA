#!/usr/bin/env bash
# scripts/services/grafana.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

# Carregar dependências
MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"
source "$MODULE_DIR/../common/utils.sh"

# ============================================================================
# SERVIÇO: GRAFANA (Observability Stack)
# ============================================================================
# CORREÇÃO APLICADA: Usa health check HTTP ao invés de lsof (funciona com Docker)
# ============================================================================

start_grafana_service() {
  debug_log "Iniciando Grafana em $OBSERVABILITY_DIR"
  
  STATUS[6]="starting"
  PROGRESS[6]=10
  show_progress
  
  # Verificar se já está rodando (usar health check HTTP ao invés de lsof)
  if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
    debug_log "Grafana já está rodando e respondendo health check"
    PROGRESS[6]=100
    STATUS[6]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[6]=20
  show_progress
  
  # Verificar se script de inicialização existe
  if [ ! -f "$OBSERVABILITY_DIR/start.sh" ]; then
    debug_log "ERRO: Script start.sh não encontrado em $OBSERVABILITY_DIR"
    STATUS[6]="error"
    show_progress
    show_error_logs "Grafana" "$LOG_DIR/grafana.err.log"
    echo -e "${YELLOW}💡 Script start.sh não encontrado em: $OBSERVABILITY_DIR${NC}"
    echo ""
    return 1
  fi
  
  PROGRESS[6]=30
  show_progress
  
  # Iniciar Grafana via Docker Compose
  # NOTA: O script start.sh termina após iniciar containers Docker, mas os containers continuam rodando
  debug_log "Executando: cd $OBSERVABILITY_DIR && ./start.sh"
  (cd "$OBSERVABILITY_DIR" && ./start.sh) >"$LOG_DIR/grafana.out.log" 2>"$LOG_DIR/grafana.err.log" &
  local grafana_pid=$!
  debug_log "Grafana iniciado com PID $grafana_pid (script termina mas containers permanecem)"
  
  PROGRESS[6]=50
  show_progress
  
  # Aguardar inicialização com timeout aumentado
  local max_wait=30
  local waited=0
  local health_check_failed=0
  
  debug_log "Aguardando Grafana responder (timeout: ${max_wait}s)"
  
  while [ $waited -lt $max_wait ]; do
    # MÉTODO PRINCIPAL: Health check HTTP (funciona com Docker)
    if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
      debug_log "Grafana health check OK após ${waited}s"
      PROGRESS[6]=100
      STATUS[6]="running"
      show_progress
      
      # Aguardar 2 segundos para estabilizar
      sleep 2
      
      # Verificar novamente via health check
      if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
        debug_log "Grafana confirmado rodando e estável"
        return 0
      else
        echo ""
        echo -e "${YELLOW}⚠️  Grafana parou logo após iniciar${NC}"
        debug_log "AVISO: Grafana parou após health check bem-sucedido"
        health_check_failed=1
        break
      fi
    fi
    
    sleep 1
    waited=$((waited + 1))
    PROGRESS[6]=$((50 + waited * 50 / max_wait))
    show_progress
  done
  
  # Se chegou aqui, timeout ou falha
  if [ $health_check_failed -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Grafana não respondeu após $max_wait segundos${NC}"
    debug_log "AVISO: Timeout aguardando Grafana após ${max_wait}s"
  fi
  
  # FALLBACK: Verificar container Docker diretamente
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^myia-grafana$"; then
    echo -e "${YELLOW}💡 Container Grafana está rodando, mas health check não respondeu${NC}"
    echo -e "${CYAN}   Grafana pode estar iniciando ainda. Verifique em: http://localhost:$GRAFANA_PORT${NC}"
    debug_log "Container encontrado mas health check falhou - marcando como running"
    PROGRESS[6]=100
    STATUS[6]="running"
    show_progress
    return 0
  fi
  
  debug_log "ERRO: Grafana não iniciou - container não encontrado"
  STATUS[6]="error"
  PROGRESS[6]=100
  show_progress
  show_error_logs "Grafana" "$LOG_DIR/grafana.err.log"
  echo -e "${YELLOW}💡 Health check falhou após ${max_wait}s - container não encontrado${NC}"
  echo ""
  return 1
}

restart_grafana() {
  echo -e "${CYAN}Reiniciando Grafana...${NC}"
  
  # Parar Grafana (via Docker Compose)
  if [ -f "$OBSERVABILITY_DIR/stop.sh" ]; then
    (cd "$OBSERVABILITY_DIR" && ./stop.sh) >/dev/null 2>&1
  else
    # Tentar parar containers manualmente
    docker stop myia-grafana myia-loki myia-promtail 2>/dev/null || true
  fi
  
  sleep 3
  
  # Iniciar novamente
  start_grafana_service
}
