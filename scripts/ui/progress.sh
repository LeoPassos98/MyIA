#!/usr/bin/env bash
# scripts/ui/progress.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"
source "$MODULE_DIR/drawing.sh"

# Função auxiliar para obter ícone de status
get_status_icon() {
  local status=$1
  case "$status" in
    running) echo "${CHECK_MARK}" ;;
    starting) echo "${INFO_ICON}" ;;
    error) echo "${CROSS_MARK}" ;;
    stopped) echo "${GRAY}⏸${NC}" ;;
    *) echo "${GRAY}○${NC}" ;;
  esac
}

show_progress() {
  clear_screen
  
  draw_box_top
  local title="              🚀 Iniciando Serviços MyIA...              "
  echo -e "${BLUE}║${WHITE}${title}${BLUE}║${NC}"
  draw_box_bottom
  
  echo ""
  
  local total_selected=0
  local total_completed=0
  
  # Contar serviços selecionados
  for i in {1..6}; do
    if [[ "${SELECTED[$i]}" == "1" ]]; then
      total_selected=$((total_selected + 1))
      if [[ "${STATUS[$i]}" == "running" ]]; then
        total_completed=$((total_completed + 1))
      fi
    fi
  done
  
  if [ "$total_selected" -eq 0 ]; then
    total_selected=1
  fi
  
  # Mostrar progresso de cada serviço
  local service_names=(
    ""
    "Banco de Dados     "
    "API do Sistema     "
    "Interface          "
    "Painel Admin       "
    "Processador        "
    "Monitoramento      "
  )
  
  local idx=0
  for i in {1..6}; do
    if [[ "${SELECTED[$i]}" == "1" ]]; then
      idx=$((idx + 1))
      local icon=$(get_status_icon "${STATUS[$i]}")
      echo -ne "${CYAN}[$idx/$total_selected]${NC} ${service_names[$i]} "
      draw_progress_bar "${PROGRESS[$i]}" 100
      echo -e " $icon"
    fi
  done
  
  echo ""
  echo -ne "${WHITE}TOTAL                  ${NC}"
  local total_progress=$((total_completed * 100 / total_selected))
  draw_progress_bar "$total_progress" 100
  echo -e " 🚀"
  echo ""
}
