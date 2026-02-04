#!/usr/bin/env bash
# scripts/services/backend.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"
source "$MODULE_DIR/../common/utils.sh"

start_backend_service() {
  STATUS[2]="starting"
  PROGRESS[2]=10
  show_progress
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    debug_log "Backend já está rodando (PID $(cat "$PID_FILE_BACKEND"))"
    PROGRESS[2]=100
    STATUS[2]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[2]=30
  show_progress
  
  # Iniciar backend
  debug_log "PID file: $PID_FILE_BACKEND"
  debug_log "Comando: cd $BACKEND_DIR && npm run dev"
  (cd "$BACKEND_DIR" && npm run dev) >"$LOG_DIR/backend.out.log" 2>"$LOG_DIR/backend.err.log" &
  local pid=$!
  echo $pid >"$PID_FILE_BACKEND"
  debug_log "Backend iniciado com PID $pid"
  
  PROGRESS[2]=60
  show_progress
  
  # Aguardar inicialização
  if wait_for_port $BACKEND_PORT "Backend" 30 "$PID_FILE_BACKEND"; then
    PROGRESS[2]=100
    STATUS[2]="running"
    show_progress
    debug_log "Backend iniciado com sucesso na porta $BACKEND_PORT"
    return 0
  else
    STATUS[2]="error"
    show_progress
    show_error_logs "Backend" "$LOG_DIR/backend.err.log"
    debug_log "ERRO: Falha ao iniciar backend"
    return 1
  fi
}
