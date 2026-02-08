#!/usr/bin/env bash
# scripts/certification/common.sh
# Standards: docs/STANDARDS.md
#
# Módulo de Funções Comuns
# Responsabilidade: Funções compartilhadas entre módulos (formatação, validação, colorização)

set -e

# ============================================================================
# FUNÇÕES DE FORMATAÇÃO DE STATUS
# ============================================================================

# Coloriza status de certificação
# Uso: colorize_status "CERTIFIED"
colorize_status() {
  local status="$1"
  
  case "$status" in
    CERTIFIED) echo -e "${GREEN}${status}${NC}" ;;
    FAILED) echo -e "${RED}${status}${NC}" ;;
    PENDING) echo -e "${YELLOW}${status}${NC}" ;;
    QUEUED) echo -e "${YELLOW}${status}${NC}" ;;
    PROCESSING) echo -e "${BLUE}${status}${NC}" ;;
    COMPLETED) echo -e "${GREEN}${status}${NC}" ;;
    *) echo "$status" ;;
  esac
}

# ============================================================================
# FUNÇÕES DE FORMATAÇÃO DE TABELAS
# ============================================================================

# Imprime cabeçalho de tabela de certificações
# Uso: print_cert_table_header
print_cert_table_header() {
  printf "${BOLD}%-38s %-30s %-12s %-10s %-20s${NC}\n" "ID" "Modelo" "Status" "Rating" "Criado"
  printf "%s\n" "$(printf '%*s' 110 '' | tr ' ' '-')"
}

# Imprime linha de tabela de certificações
# Uso: print_cert_table_row "$id" "$model_name" "$status" "$rating" "$created"
print_cert_table_row() {
  local id="$1"
  local model_name="$2"
  local status="$3"
  local rating="$4"
  local created="$5"
  
  local status_colored=$(colorize_status "$status")
  local created_formatted=$(format_date "$created")
  
  printf "%-38s %-30s %-22s %-10s %-20s\n" \
    "$id" "$model_name" "$(echo -e "$status_colored")" "$rating" "$created_formatted"
}

# Imprime cabeçalho de tabela de certificações por modelo
# Uso: print_model_cert_table_header
print_model_cert_table_header() {
  printf "${BOLD}%-15s %-12s %-10s %-10s %-15s %-20s${NC}\n" \
    "Região" "Status" "Score" "Rating" "Tempo (ms)" "Criado"
  printf "%s\n" "$(printf '%*s' 90 '' | tr ' ' '-')"
}

# Imprime linha de tabela de certificações por modelo
# Uso: print_model_cert_table_row "$region" "$status" "$score" "$rating" "$time" "$created"
print_model_cert_table_row() {
  local region="$1"
  local status="$2"
  local score="$3"
  local rating="$4"
  local time="$5"
  local created="$6"
  
  local status_colored=$(colorize_status "$status")
  local created_formatted=$(format_date "$created")
  
  printf "%-15s %-22s %-10s %-10s %-15s %-20s\n" \
    "$region" "$(echo -e "$status_colored")" "$score" "$rating" "$time" "$created_formatted"
}

# ============================================================================
# FUNÇÕES DE VALIDAÇÃO
# ============================================================================

# Valida se um parâmetro não está vazio
# Uso: validate_not_empty "$value" "Nome do parâmetro"
validate_not_empty() {
  local value="$1"
  local param_name="$2"
  
  if [ -z "$value" ]; then
    print_error "$param_name é obrigatório"
    return 1
  fi
  
  return 0
}

# Valida resposta da API
# Uso: validate_api_response "$response"
validate_api_response() {
  local response="$1"
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    return 0
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha na operação: $error"
    return 1
  fi
}

# ============================================================================
# FUNÇÕES DE PROCESSAMENTO DE LISTAS
# ============================================================================

# Processa lista de certificações e executa ação em cada uma
# Uso: process_certifications "$certifications" "action_function"
process_certifications() {
  local certifications="$1"
  local action="$2"
  
  local total=$(echo "$certifications" | jq -r 'length')
  
  if [ "$total" -eq 0 ]; then
    print_info "Nenhuma certificação encontrada"
    return 0
  fi
  
  local success=0
  local failed=0
  
  echo "$certifications" | jq -r '.[].modelId' | while read -r model_id; do
    if $action "$model_id" >/dev/null 2>&1; then
      ((success++)) || true
      echo -n "."
    else
      ((failed++)) || true
      echo -n "x"
    fi
  done
  
  echo ""
  print_success "Operação concluída!"
  print_info "Sucesso: $success"
  [ "$failed" -gt 0 ] && print_warning "Falhas: $failed"
  
  return 0
}

# ============================================================================
# FUNÇÕES DE CÁLCULO
# ============================================================================

# Calcula data limite baseada em dias atrás
# Uso: calculate_date_limit 30
calculate_date_limit() {
  local days="$1"
  
  if command -v date >/dev/null 2>&1; then
    date -d "$days days ago" -Iseconds 2>/dev/null || \
    date -v-${days}d -Iseconds 2>/dev/null || \
    echo ""
  else
    echo ""
  fi
}

# Desenha barra de progresso
# Uso: draw_progress_bar 50 100
draw_progress_bar() {
  local current="$1"
  local total="$2"
  local width=40
  
  if [ "$total" -eq 0 ]; then
    echo "[$(printf '%*s' $width '' | tr ' ' ' ')] 0%"
    return
  fi
  
  local percentage=$((current * 100 / total))
  local filled=$((current * width / total))
  local empty=$((width - filled))
  
  printf "[${GREEN}%s${NC}%s] %3d%%\n" \
    "$(printf '%*s' $filled '' | tr ' ' '█')" \
    "$(printf '%*s' $empty '' | tr ' ' '░')" \
    "$percentage"
}

# ============================================================================
# FUNÇÕES DE ESTATÍSTICAS
# ============================================================================

# Calcula e exibe estatísticas de qualidade
# Uso: show_quality_stats "$certifications"
show_quality_stats() {
  local certifications="$1"
  
  local avg_score=$(echo "$certifications" | jq -r '[.[] | select(.qualityScore != null) | .qualityScore] | add / length')
  local avg_time=$(echo "$certifications" | jq -r '[.[] | select(.responseTime != null) | .responseTime] | add / length')
  
  if [ "$avg_score" != "null" ] && [ -n "$avg_score" ]; then
    echo -e "\n${BOLD}Qualidade:${NC}\n"
    printf "  Score Médio:          %.2f\n" "$avg_score"
  fi
  
  if [ "$avg_time" != "null" ] && [ -n "$avg_time" ]; then
    printf "  Tempo Médio:          %.0f ms\n" "$avg_time"
  fi
}

# Conta certificações por status
# Uso: count_by_status "$certifications"
count_by_status() {
  local certifications="$1"
  
  local certified=$(echo "$certifications" | jq -r '[.[] | select(.status == "CERTIFIED")] | length')
  local failed=$(echo "$certifications" | jq -r '[.[] | select(.status == "FAILED")] | length')
  local pending=$(echo "$certifications" | jq -r '[.[] | select(.status == "PENDING")] | length')
  
  echo -e "\n${BOLD}Por Status:${NC}\n"
  echo "  Certificadas:         ${GREEN}$certified${NC}"
  echo "  Falhadas:             ${RED}$failed${NC}"
  echo "  Pendentes:            ${YELLOW}$pending${NC}"
  
  # Taxa de sucesso
  local total=$((certified + failed + pending))
  if [ "$total" -gt 0 ]; then
    local success_rate=$((certified * 100 / total))
    echo -e "\n  Taxa de Sucesso:      ${GREEN}$success_rate%${NC}"
  fi
}
