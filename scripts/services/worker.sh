#!/usr/bin/env bash
# scripts/services/worker.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"
source "$MODULE_DIR/../common/utils.sh"

start_worker_service() {
  debug_log "Iniciando worker em $BACKEND_DIR"
  
  STATUS[5]="starting"
  PROGRESS[5]=10
  show_progress
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    debug_log "Worker já está rodando (PID $(cat "$PID_FILE_WORKER"))"
    PROGRESS[5]=100
    STATUS[5]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[5]=30
  show_progress
  
  # Iniciar worker
  debug_log "PID file: $PID_FILE_WORKER"
  debug_log "Comando: cd $BACKEND_DIR && npm run worker:dev"
  (cd "$BACKEND_DIR" && npm run worker:dev) >"$OUT_LOG_WORKER" 2>"$ERR_LOG_WORKER" &
  local pid=$!
  echo $pid >"$PID_FILE_WORKER"
  debug_log "Worker iniciado com PID $pid"
  
  PROGRESS[5]=60
  show_progress
  
  # Aguardar inicialização
  if wait_for_port $WORKER_HEALTH_PORT "Worker" 30 "$PID_FILE_WORKER"; then
    PROGRESS[5]=100
    STATUS[5]="running"
    show_progress
    debug_log "Worker iniciado com sucesso na porta $WORKER_HEALTH_PORT"
    return 0
  else
    STATUS[5]="error"
    show_progress
    show_error_logs "Worker" "$ERR_LOG_WORKER"
    debug_log "ERRO: Falha ao iniciar worker"
    return 1
  fi
}
