#!/usr/bin/env bash
# scripts/services/frontend-admin.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"

start_frontend_admin_service() {
  STATUS[4]="starting"
  PROGRESS[4]=10
  show_progress
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_FRONTEND_ADMIN" ] && kill -0 "$(cat "$PID_FILE_FRONTEND_ADMIN")" >/dev/null 2>&1; then
    PROGRESS[4]=100
    STATUS[4]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[4]=30
  show_progress
  
  # Iniciar frontend-admin
  (cd "$FRONTEND_ADMIN_DIR" && npm run dev) >"$OUT_LOG_FRONTEND_ADMIN" 2>"$ERR_LOG_FRONTEND_ADMIN" &
  echo $! >"$PID_FILE_FRONTEND_ADMIN"
  
  PROGRESS[4]=60
  show_progress
  
  # Aguardar inicialização
  if wait_for_port $FRONTEND_ADMIN_PORT "Frontend Admin" 30 "$PID_FILE_FRONTEND_ADMIN"; then
    PROGRESS[4]=100
    STATUS[4]="running"
    show_progress
    return 0
  else
    STATUS[4]="error"
    show_progress
    show_error_logs "Frontend Admin" "$ERR_LOG_FRONTEND_ADMIN"
    return 1
  fi
}
