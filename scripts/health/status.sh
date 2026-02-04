#!/usr/bin/env bash
# scripts/health/status.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"

check_service_status() {
  local service_id=$1
  
  case "$service_id" in
    1)  # Database (Redis)
      docker ps --format '{{.Names}}' | grep -q "^myia-redis$"
      ;;
    2)  # Backend
      [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1
      ;;
    3)  # Frontend
      [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1
      ;;
    4)  # Frontend Admin
      [ -f "$PID_FILE_FRONTEND_ADMIN" ] && kill -0 "$(cat "$PID_FILE_FRONTEND_ADMIN")" >/dev/null 2>&1
      ;;
    5)  # Worker
      [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1
      ;;
    6)  # Grafana
      curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1 || \
      docker ps --format '{{.Names}}' | grep -q "^myia-grafana$"
      ;;
    *)
      return 1
      ;;
  esac
}

update_running_status() {
  for i in {1..6}; do
    if check_service_status "$i"; then
      RUNNING_STATUS[$i]=1
    else
      RUNNING_STATUS[$i]=0
    fi
  done
}

show_all_status() {
  clear_screen
  update_running_status
  
  echo ""
  echo -e "${CYAN}📊 Status dos Serviços${NC}"
  echo ""
  
  declare -A service_names=(
    [1]="Redis (Database)"
    [2]="Backend API"
    [3]="Frontend"
    [4]="Frontend Admin"
    [5]="Worker"
    [6]="Grafana"
  )
  
  for i in {1..6}; do
    local status_text="${RED}● Parado${NC}"
    local icon="❌"
    
    if [[ "${RUNNING_STATUS[$i]}" == "1" ]]; then
      status_text="${GREEN}● Rodando${NC}"
      icon="✅"
    fi
    
    printf " $icon  %-20s %b\n" "${service_names[$i]}" "$status_text"
  done
  
  echo ""
  echo -e "${GRAY}Pressione ENTER para voltar...${NC}"
  read
}
