#!/usr/bin/env bash
# scripts/certification/stats.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de Estatísticas de Certificações
# Responsabilidade: Exibir estatísticas (por região, por vendor, por status)

# ============================================================================
# FUNÇÕES DE ESTATÍSTICAS
# ============================================================================

# Mostra estatísticas gerais de certificações
show_certification_stats() {
  print_info "Buscando estatísticas..."
  
  local response
  response=$(certification_api_call GET "/api/certification-queue/stats")
  
  validate_api_response "$response" || return 1
  
  local data=$(echo "$response" | jq -r '.data')
  
  # Estatísticas da fila
  echo -e "\n${BOLD}Fila (Bull):${NC}\n"
  
  local waiting=$(echo "$data" | jq -r '.queue.queue.waiting // 0')
  local active=$(echo "$data" | jq -r '.queue.queue.active // 0')
  local completed=$(echo "$data" | jq -r '.queue.queue.completed // 0')
  local failed=$(echo "$data" | jq -r '.queue.queue.failed // 0')
  
  echo "  Aguardando:           ${YELLOW}$waiting${NC}"
  echo "  Ativos:               ${BLUE}$active${NC}"
  echo "  Completos:            ${GREEN}$completed${NC}"
  echo "  Falhados:             ${RED}$failed${NC}"
  
  # Gráfico ASCII de distribuição
  local total=$((waiting + active + completed + failed))
  if [ "$total" -gt 0 ]; then
    echo -e "\n  Distribuição:"
    
    local waiting_pct=$((waiting * 100 / total))
    local active_pct=$((active * 100 / total))
    local completed_pct=$((completed * 100 / total))
    local failed_pct=$((failed * 100 / total))
    
    printf "    Aguardando:   [%-20s] %3d%%\n" "$(printf '%*s' $((waiting_pct / 5)) '' | tr ' ' '█')" "$waiting_pct"
    printf "    Ativos:       [%-20s] %3d%%\n" "$(printf '%*s' $((active_pct / 5)) '' | tr ' ' '█')" "$active_pct"
    printf "    Completos:    [%-20s] %3d%%\n" "$(printf '%*s' $((completed_pct / 5)) '' | tr ' ' '█')" "$completed_pct"
    printf "    Falhados:     [%-20s] %3d%%\n" "$(printf '%*s' $((failed_pct / 5)) '' | tr ' ' '█')" "$failed_pct"
  fi
  
  # Estatísticas por região
  echo -e "\n${BOLD}Certificações por Região:${NC}\n"
  
  local by_region=$(echo "$data" | jq -r '.certificationsByRegion')
  if [ "$by_region" != "null" ] && [ -n "$by_region" ]; then
    echo "$by_region" | jq -r 'group_by(.region) | .[] | [.[0].region, (map(._count) | add)] | @tsv' | \
    while IFS=$'\t' read -r region count; do
      printf "  %-20s %5d\n" "$region" "$count"
    done
  else
    print_info "  Nenhuma certificação por região"
  fi
  
  # Estatísticas por status
  echo -e "\n${BOLD}Certificações por Status:${NC}\n"
  
  local by_status=$(echo "$data" | jq -r '.certificationsByStatus')
  if [ "$by_status" != "null" ] && [ -n "$by_status" ]; then
    echo "$by_status" | jq -r '.[] | [.status, ._count] | @tsv' | \
    while IFS=$'\t' read -r status count; do
      case "$status" in
        CERTIFIED) printf "  ${GREEN}%-20s${NC} %5d\n" "$status" "$count" ;;
        FAILED) printf "  ${RED}%-20s${NC} %5d\n" "$status" "$count" ;;
        PENDING) printf "  ${YELLOW}%-20s${NC} %5d\n" "$status" "$count" ;;
        *) printf "  %-20s %5d\n" "$status" "$count" ;;
      esac
    done
  else
    print_info "  Nenhuma certificação por status"
  fi
  
  return 0
}

# Mostra estatísticas por região
show_stats_by_region() {
  local region="${1:-}"
  
  validate_not_empty "$region" "Região" || return 1
  
  print_info "Buscando estatísticas da região $region..."
  
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?region=$region&limit=1000")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  local total=$(echo "$certifications" | jq -r 'length')
  
  echo -e "\n${BOLD}Estatísticas da Região: $region${NC}\n"
  echo "  Total de Certificações: $total"
  
  # Contar por status e exibir
  count_by_status "$certifications"
  
  # Estatísticas de qualidade
  show_quality_stats "$certifications"
  
  return 0
}

# Mostra estatísticas por status
show_stats_by_status() {
  local status="${1:-}"
  
  validate_not_empty "$status" "Status" || return 1
  
  print_info "Buscando estatísticas de certificações $status..."
  
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?status=$status&limit=1000")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  local total=$(echo "$certifications" | jq -r 'length')
  
  echo -e "\n${BOLD}Estatísticas de Certificações $status${NC}\n"
  echo "  Total:                $total"
  
  # Contar por região
  echo -e "\n${BOLD}Por Região:${NC}\n"
  
  echo "$certifications" | jq -r 'group_by(.region) | .[] | [.[0].region, length] | @tsv' | \
  while IFS=$'\t' read -r region count; do
    printf "  %-20s %5d\n" "$region" "$count"
  done
  
  # Estatísticas de qualidade (apenas para CERTIFIED)
  [ "$status" = "CERTIFIED" ] && show_quality_stats "$certifications"
  
  return 0
}

# Mostra estatísticas por vendor
show_stats_by_vendor() {
  local vendor="${1:-}"
  
  validate_not_empty "$vendor" "Vendor" || return 1
  
  print_info "Buscando estatísticas do vendor $vendor..."
  
  # Buscar todos os modelos do vendor
  local response
  response=$(certification_api_call GET "/api/models?vendor=$vendor")
  
  validate_api_response "$response" || return 1
  
  local models=$(echo "$response" | jq -r '.data')
  local model_count=$(echo "$models" | jq -r 'length')
  
  echo -e "\n${BOLD}Estatísticas do Vendor: $vendor${NC}\n"
  echo "  Total de Modelos:     $model_count"
  
  # Buscar certificações de cada modelo
  local total_certs=0
  local certified=0
  local failed=0
  local pending=0
  
  echo "$models" | jq -r '.[].id' | while read -r model_id; do
    local cert_response
    cert_response=$(certification_api_call GET "/api/certification?modelId=$model_id" 2>/dev/null || echo "")
    
    if echo "$cert_response" | jq -e '.status == "success"' >/dev/null 2>&1; then
      local certs=$(echo "$cert_response" | jq -r '.data')
      local count=$(echo "$certs" | jq -r 'length')
      total_certs=$((total_certs + count))
      
      certified=$((certified + $(echo "$certs" | jq -r '[.[] | select(.status == "CERTIFIED")] | length')))
      failed=$((failed + $(echo "$certs" | jq -r '[.[] | select(.status == "FAILED")] | length')))
      pending=$((pending + $(echo "$certs" | jq -r '[.[] | select(.status == "PENDING")] | length')))
    fi
  done
  
  echo "  Total de Certificações: $total_certs"
  
  echo -e "\n${BOLD}Por Status:${NC}\n"
  echo "  Certificadas:         ${GREEN}$certified${NC}"
  echo "  Falhadas:             ${RED}$failed${NC}"
  echo "  Pendentes:            ${YELLOW}$pending${NC}"
  
  # Calcular taxa de sucesso
  if [ "$total_certs" -gt 0 ]; then
    local success_rate=$((certified * 100 / total_certs))
    echo -e "\n  Taxa de Sucesso:      ${GREEN}$success_rate%${NC}"
  fi
  
  return 0
}
