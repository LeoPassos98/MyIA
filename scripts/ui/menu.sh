#!/usr/bin/env bash
# scripts/ui/menu.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"
source "$MODULE_DIR/drawing.sh"

show_menu() {
  clear_screen
  
  # Atualizar status dos serviços
  update_running_status
  
  draw_box_top
  local title="              🚀 MyIA - Gerenciador de Serviços             "
  echo -e "${BLUE}║${WHITE}${title}${BLUE}║${NC}"
  draw_box_bottom
  
  echo ""
  echo -e "${CYAN}Selecione os serviços que deseja iniciar:${NC}"
  echo ""
  
  # Serviço 1: Banco de Dados
  local checkbox1="[ ]"
  [[ "${SELECTED[1]}" == "1" ]] && checkbox1="[${GREEN}x${NC}]"
  
  local status_indicator1=""
  if [[ "${RUNNING_STATUS[1]}" == "1" ]]; then
    status_indicator1=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox1} ${BLUE}1.${NC} Banco de Dados (Redis + PostgreSQL)${status_indicator1}"
  echo -e "     ${GRAY}└─ Armazena informações e gerencia filas de tarefas${NC}"
  echo ""
  
  # Serviço 2: Backend
  local checkbox2="[ ]"
  [[ "${SELECTED[2]}" == "1" ]] && checkbox2="[${GREEN}x${NC}]"
  
  local status_indicator2=""
  if [[ "${RUNNING_STATUS[2]}" == "1" ]]; then
    status_indicator2=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox2} ${BLUE}2.${NC} API do Sistema (Backend)${status_indicator2}"
  echo -e "     ${GRAY}└─ Servidor que processa requisições e se comunica com IA${NC}"
  echo ""
  
  # Serviço 3: Frontend
  local checkbox3="[ ]"
  [[ "${SELECTED[3]}" == "1" ]] && checkbox3="[${GREEN}x${NC}]"
  
  local status_indicator3=""
  if [[ "${RUNNING_STATUS[3]}" == "1" ]]; then
    status_indicator3=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox3} ${BLUE}3.${NC} Interface do Usuário (Frontend)${status_indicator3}"
  echo -e "     ${GRAY}└─ Tela principal onde você conversa com os modelos de IA${NC}"
  echo ""
  
  # Serviço 4: Frontend Admin
  local checkbox4="[ ]"
  [[ "${SELECTED[4]}" == "1" ]] && checkbox4="[${GREEN}x${NC}]"
  
  local status_indicator4=""
  if [[ "${RUNNING_STATUS[4]}" == "1" ]]; then
    status_indicator4=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox4} ${BLUE}4.${NC} Painel de Administração (Frontend Admin)${status_indicator4}"
  echo -e "     ${GRAY}└─ Tela para gerenciar e testar modelos de IA${NC}"
  echo ""
  
  # Serviço 5: Worker
  local checkbox5="[ ]"
  [[ "${SELECTED[5]}" == "1" ]] && checkbox5="[${GREEN}x${NC}]"
  
  local status_indicator5=""
  if [[ "${RUNNING_STATUS[5]}" == "1" ]]; then
    status_indicator5=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox5} ${BLUE}5.${NC} Processador de Tarefas (Worker)${status_indicator5}"
  echo -e "     ${GRAY}└─ Executa testes de modelos em segundo plano${NC}"
  echo ""
  
  # Serviço 6: Grafana
  local checkbox6="[ ]"
  [[ "${SELECTED[6]}" == "1" ]] && checkbox6="[${GREEN}x${NC}]"
  
  local status_indicator6=""
  if [[ "${RUNNING_STATUS[6]}" == "1" ]]; then
    status_indicator6=" ${GREEN}(✓ rodando)${NC}"
  fi
  
  echo -e " ${checkbox6} ${BLUE}6.${NC} Monitoramento (Grafana)${status_indicator6}"
  echo -e "     ${GRAY}└─ Visualiza logs, erros e métricas do sistema${NC}"
  echo ""
  
  # Mostrar aviso se tentar iniciar serviços já rodando
  local any_running_selected=0
  for i in {1..6}; do
    if [[ "${SELECTED[$i]}" == "1" ]] && [[ "${RUNNING_STATUS[$i]}" == "1" ]]; then
      any_running_selected=1
      break
    fi
  done
  
  if [ "$any_running_selected" -eq 1 ]; then
    echo ""
    echo -e " ${YELLOW}⚠️  Alguns serviços selecionados já estão rodando${NC}"
    echo -e " ${GRAY}   (serão reiniciados se você prosseguir)${NC}"
  fi
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${GRAY}💡 Dica: Selecione serviços (1-6) e pressione ENTER para iniciar${NC}"
  echo ""
  echo -e " [${GREEN}x${NC}] ${BLUE}7.${NC} ${GREEN}INICIAR TUDO${NC} (Recomendado)"
  echo -e " [ ] ${BLUE}8.${NC} Status dos Serviços"
  echo -e " [ ] ${BLUE}9.${NC} Parar Todos os Serviços"
  echo -e " [ ] ${BLUE}r.${NC} Reiniciar Serviço Específico"
  echo -e " [ ] ${BLUE}l.${NC} Ver Logs em Tempo Real"
  echo -e " [ ] ${BLUE}c.${NC} Limpar Logs Antigos"
  echo -e " [ ] ${BLUE}s.${NC} Salvar Perfil Atual"
  echo -e " [ ] ${BLUE}p.${NC} Carregar Perfil"
  echo -e " [ ] ${BLUE}0.${NC} Sair"
  echo ""
  echo -ne "${CYAN}Opção:${NC} "
}

toggle_service() {
  local service=$1
  if [[ "${SELECTED[$service]}" == "1" ]]; then
    SELECTED[$service]=0
  else
    SELECTED[$service]=1
  fi
}

select_all() {
  for i in {1..6}; do
    SELECTED[$i]=1
  done
}

deselect_all() {
  for i in {1..6}; do
    SELECTED[$i]=0
  done
}
