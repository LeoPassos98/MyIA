#!/usr/bin/env bash
# scripts/ui/drawing.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"

clear_screen() {
  clear
  # Mover cursor para o topo
  tput cup 0 0
}

hide_cursor() {
  tput civis
}

show_cursor() {
  tput cnorm
}

draw_box_top() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
}

draw_box_middle() {
  echo -e "${BLUE}║${NC} $1"
}

draw_box_bottom() {
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

draw_progress_bar() {
  local current=$1
  local total=$2
  local width=20
  
  if [ "$total" -eq 0 ]; then
    total=1
  fi
  
  local percentage=$((current * 100 / total))
  local filled=$((width * current / total))
  local empty=$((width - filled))
  
  # Limitar valores
  if [ "$filled" -gt "$width" ]; then
    filled=$width
    empty=0
  fi
  if [ "$filled" -lt 0 ]; then
    filled=0
    empty=$width
  fi
  
  # Cor baseada no progresso
  local color=$YELLOW
  if [ "$percentage" -eq 100 ]; then
    color=$GREEN
  fi
  
  printf "${color}"
  printf '█%.0s' $(seq 1 $filled)
  printf "${GRAY}"
  printf '░%.0s' $(seq 1 $empty)
  printf "${NC}"
  printf " %3d%%" "$percentage"
}
