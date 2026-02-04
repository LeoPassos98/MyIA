#!/usr/bin/env bash
# start_interactive.sh (MODULARIZED VERSION)
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

set -e

# Determinar diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================================
# CARREGAR MÓDULOS
# ============================================================================

# Common (base)
source "$SCRIPT_DIR/scripts/common/colors.sh"
source "$SCRIPT_DIR/scripts/common/config.sh"
source "$SCRIPT_DIR/scripts/common/utils.sh"

# UI
source "$SCRIPT_DIR/scripts/ui/drawing.sh"
source "$SCRIPT_DIR/scripts/ui/progress.sh"
source "$SCRIPT_DIR/scripts/ui/menu.sh"

# Health
source "$SCRIPT_DIR/scripts/health/wait.sh"
source "$SCRIPT_DIR/scripts/health/status.sh"

# Logs
source "$SCRIPT_DIR/scripts/logs/viewer.sh"

# Services
source "$SCRIPT_DIR/scripts/services/database.sh"
source "$SCRIPT_DIR/scripts/services/backend.sh"
source "$SCRIPT_DIR/scripts/services/frontend.sh"
source "$SCRIPT_DIR/scripts/services/frontend-admin.sh"
source "$SCRIPT_DIR/scripts/services/worker.sh"
source "$SCRIPT_DIR/scripts/services/grafana.sh"

# ============================================================================
# FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
# ============================================================================

start_selected_services() {
  hide_cursor
  
  # Iniciar cada serviço selecionado
  for i in {1..6}; do
    if [[ "${SELECTED[$i]}" == "1" ]]; then
      case "$i" in
        1) start_database ;;
        2) start_backend_service ;;
        3) start_frontend_service ;;
        4) start_frontend_admin_service ;;
        5) start_worker_service ;;
        6) start_grafana_service ;;
      esac
    fi
  done
  
  show_cursor
  
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Serviços iniciados com sucesso!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # Mostrar URLs de acesso
  echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
  echo ""
  
  if [[ "${SELECTED[3]}" == "1" ]] && check_service_status 3; then
    echo -e " 💬 Frontend (Chat):      ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
  fi
  
  if [[ "${SELECTED[4]}" == "1" ]] && check_service_status 4; then
    echo -e " ⚙️  Frontend Admin:       ${BLUE}http://localhost:${FRONTEND_ADMIN_PORT}${NC}"
  fi
  
  if [[ "${SELECTED[6]}" == "1" ]] && check_service_status 6; then
    echo -e " 📊 Grafana Monitoring:   ${BLUE}http://localhost:${GRAFANA_PORT}${NC}"
  fi
  
  echo ""
  echo -e "${GRAY}Pressione ENTER para voltar ao menu...${NC}"
  read
}

stop_all_services() {
  clear_screen
  
  echo ""
  echo -e "${YELLOW}🛑 Parando serviços...${NC}"
  echo ""
  
  # Parar Backend
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    if graceful_kill "$(cat "$PID_FILE_BACKEND")" "Backend" 10; then
      rm -f "$PID_FILE_BACKEND"
      echo -e "${GREEN}✓ Backend parado${NC}"
    fi
  fi
  
  # Parar Frontend
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    if graceful_kill "$(cat "$PID_FILE_FRONTEND")" "Frontend" 10; then
      rm -f "$PID_FILE_FRONTEND"
      echo -e "${GREEN}✓ Frontend parado${NC}"
    fi
  fi
  
  # Parar Frontend Admin
  if [ -f "$PID_FILE_FRONTEND_ADMIN" ] && kill -0 "$(cat "$PID_FILE_FRONTEND_ADMIN")" >/dev/null 2>&1; then
    if graceful_kill "$(cat "$PID_FILE_FRONTEND_ADMIN")" "Frontend Admin" 10; then
      rm -f "$PID_FILE_FRONTEND_ADMIN"
      echo -e "${GREEN}✓ Frontend Admin parado${NC}"
    fi
  fi
  
  # Parar Worker
  if [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    if graceful_kill "$(cat "$PID_FILE_WORKER")" "Worker" 10; then
      rm -f "$PID_FILE_WORKER"
      echo -e "${GREEN}✓ Worker parado${NC}"
    fi
  fi
  
  echo ""
  echo -e "${GREEN}✅ Serviços parados${NC}"
  echo ""
  echo -e "${GRAY}Pressione ENTER...${NC}"
  read
}

# ============================================================================
# LOOP PRINCIPAL
# ============================================================================

# Inicializar arrays
for i in {1..6}; do
  SELECTED[$i]=0
  PROGRESS[$i]=0
  STATUS[$i]="pending"
  RUNNING_STATUS[$i]=0
done

while true; do
  show_menu
  read -r option
  
  case "$option" in
    1|2|3|4|5|6)
      toggle_service "$option"
      ;;
    7)
      select_all
      start_selected_services
      deselect_all
      ;;
    8)
      show_all_status
      ;;
    9)
      stop_all_services
      ;;
    0)
      clear_screen
      echo ""
      echo -e "${CYAN}👋 Até logo!${NC}"
      echo ""
      exit 0
      ;;
    "")
      # Se algo foi selecionado, inicia
      local has_selection=0
      for i in {1..6}; do
        [[ "${SELECTED[$i]}" == "1" ]] && has_selection=1 && break
      done
      
      if [ "$has_selection" -eq 1 ]; then
        start_selected_services
        deselect_all
      fi
      ;;
    *)
      # Opção inválida, ignora
      ;;
  esac
done
