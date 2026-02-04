#!/usr/bin/env bash
# scripts/services/frontend.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"

start_frontend_service() {
  STATUS[3]="starting"
  PROGRESS[3]=10
  show_progress
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    PROGRESS[3]=100
    STATUS[3]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[3]=30
  show_progress
  
  # Iniciar frontend
  (cd "$FRONTEND_DIR" && npm run dev) >"$LOG_DIR/frontend.out.log" 2>"$LOG_DIR/frontend.err.log" &
  echo $! >"$PID_FILE_FRONTEND"
  
  PROGRESS[3]=60
  show_progress
  
  # Aguardar inicialização
  if wait_for_port $FRONTEND_PORT "Frontend" 30 "$PID_FILE_FRONTEND"; then
    PROGRESS[3]=100
    STATUS[3]="running"
    show_progress
    return 0
  else
    STATUS[3]="error"
    show_progress
    show_error_logs "Frontend" "$LOG_DIR/frontend.err.log"
    return 1
  fi
}
