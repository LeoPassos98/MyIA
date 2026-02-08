#!/usr/bin/env bash
# scripts/certification/details.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de Detalhes de Certificações
# Responsabilidade: Exibir detalhes e histórico de certificações

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

# Função auxiliar para mostrar uma certificação
# Uso: _show_single_certification "$cert"
_show_single_certification() {
  local cert="$1"
  
  # Extrair campos
  local id=$(echo "$cert" | jq -r '.id')
  local model_name=$(echo "$cert" | jq -r '.model.name // "N/A"')
  local region=$(echo "$cert" | jq -r '.region')
  local status=$(echo "$cert" | jq -r '.status')
  local rating=$(echo "$cert" | jq -r '.rating // "N/A"')
  local quality_score=$(echo "$cert" | jq -r '.qualityScore // "N/A"')
  local response_time=$(echo "$cert" | jq -r '.responseTime // "N/A"')
  local created_at=$(echo "$cert" | jq -r '.createdAt')
  local updated_at=$(echo "$cert" | jq -r '.updatedAt')
  
  # Exibir informações básicas
  echo "  ID:                   $id"
  echo "  Modelo:               $model_name"
  echo "  Região:               $region"
  echo -n "  Status:               "
  colorize_status "$status"
  echo ""
  echo "  Rating:               $rating"
  echo "  Quality Score:        $quality_score"
  echo "  Response Time:        $response_time ms"
  echo "  Criado em:            $(format_date "$created_at")"
  echo "  Atualizado em:        $(format_date "$updated_at")"
  
  # Mostrar erro se houver
  local error_message=$(echo "$cert" | jq -r '.errorMessage // ""')
  if [ -n "$error_message" ] && [ "$error_message" != "null" ]; then
    echo -e "\n  ${RED}Erro:${NC}"
    echo "  $error_message"
  fi
  
  # Mostrar metadata se houver
  local metadata=$(echo "$cert" | jq -r '.metadata // ""')
  if [ -n "$metadata" ] && [ "$metadata" != "null" ] && [ "$metadata" != "{}" ]; then
    echo -e "\n  ${BOLD}Metadata:${NC}"
    echo "$metadata" | jq -r 'to_entries[] | "  \(.key): \(.value)"'
  fi
}

# ============================================================================
# FUNÇÕES DE DETALHES
# ============================================================================

# Mostra detalhes de uma certificação específica
show_certification_details() {
  local model_id="$1"
  local region="${2:-}"
  
  validate_not_empty "$model_id" "Model ID" || return 1
  
  print_info "Buscando detalhes da certificação..."
  
  # Construir endpoint
  local endpoint="/api/certification?modelId=$model_id"
  [ -n "$region" ] && endpoint="$endpoint&region=$region"
  
  local response
  response=$(certification_api_call GET "$endpoint")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data')
  local cert_count=$(echo "$certifications" | jq -r 'length')
  
  if [ "$cert_count" -eq 0 ]; then
    print_warning "Nenhuma certificação encontrada para este modelo"
    return 0
  fi
  
  echo -e "\n${BOLD}Detalhes da Certificação${NC}\n"
  
  # Se região específica, mostrar apenas uma
  if [ -n "$region" ]; then
    local cert=$(echo "$certifications" | jq -r '.[0]')
    _show_single_certification "$cert"
  else
    # Mostrar todas as certificações do modelo
    echo "  Total de Certificações: $cert_count"
    echo ""
    
    echo "$certifications" | jq -c '.[]' | while read -r cert; do
      _show_single_certification "$cert"
      echo ""
    done
  fi
  
  return 0
}

# Mostra histórico de certificações de um modelo
show_certification_history() {
  local model_id="$1"
  local limit="${2:-10}"
  
  validate_not_empty "$model_id" "Model ID" || return 1
  
  print_info "Buscando histórico de certificações..."
  
  local response
  response=$(certification_api_call GET "/api/certification?modelId=$model_id")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data')
  local total=$(echo "$certifications" | jq -r 'length')
  
  if [ "$total" -eq 0 ]; then
    print_warning "Nenhuma certificação encontrada para este modelo"
    return 0
  fi
  
  echo -e "\n${BOLD}Histórico de Certificações${NC}\n"
  echo "  Total: $total certificações"
  echo ""
  
  print_model_cert_table_header
  
  # Ordenar por data (mais recente primeiro) e limitar
  echo "$certifications" | jq -r 'sort_by(.createdAt) | reverse | .[:'"$limit"'] | .[] | [.region, .status, (.qualityScore|tostring), .rating, (.responseTime|tostring), .createdAt] | @tsv' | \
  while IFS=$'\t' read -r region status score rating time created; do
    print_model_cert_table_row "$region" "$status" "$score" "$rating" "$time" "$created"
  done
  
  return 0
}

# Mostra detalhes de um job de certificação
show_job_details() {
  local job_id="$1"
  
  validate_not_empty "$job_id" "Job ID" || return 1
  
  print_info "Buscando detalhes do job..."
  
  local response
  response=$(certification_api_call GET "/api/certification-queue/jobs/$job_id/status")
  
  validate_api_response "$response" || return 1
  
  local data=$(echo "$response" | jq -r '.data')
  
  echo -e "\n${BOLD}Informações do Job:${NC}\n"
  
  # Extrair campos
  local id=$(echo "$data" | jq -r '.id')
  local type=$(echo "$data" | jq -r '.type')
  local status=$(echo "$data" | jq -r '.status')
  local regions=$(echo "$data" | jq -r '.regions | join(", ")')
  local total=$(echo "$data" | jq -r '.totalModels')
  local processed=$(echo "$data" | jq -r '.processedModels')
  local success=$(echo "$data" | jq -r '.successCount')
  local failure=$(echo "$data" | jq -r '.failureCount')
  
  # Exibir informações
  echo "  ID:                   $id"
  echo "  Tipo:                 $type"
  echo -n "  Status:               "
  colorize_status "$status"
  echo ""
  echo "  Regiões:              $regions"
  echo "  Total de Modelos:     $total"
  echo "  Processados:          $processed"
  echo "  Sucesso:              ${GREEN}$success${NC}"
  echo "  Falhas:               ${RED}$failure${NC}"
  
  # Barra de progresso
  echo -e "\n  Progresso:            $(draw_progress_bar "$processed" "$total")"
  
  # Certificações
  local certifications=$(echo "$data" | jq -r '.certifications')
  local cert_count=$(echo "$certifications" | jq -r 'length')
  
  if [ "$cert_count" -gt 0 ]; then
    echo -e "\n${BOLD}Certificações:${NC}\n"
    
    printf "${BOLD}%-30s %-12s %-10s %-10s %-15s${NC}\n" "Modelo" "Status" "Score" "Rating" "Tempo (ms)"
    printf "%s\n" "$(printf '%*s' 80 '' | tr ' ' '-')"
    
    echo "$certifications" | jq -r '.[] | [.model.name, .status, (.qualityScore|tostring), .rating, (.responseTime|tostring)] | @tsv' | \
    while IFS=$'\t' read -r name cert_status score rating time; do
      local cert_status_colored=$(colorize_status "$cert_status")
      printf "%-30s %-22s %-10s %-10s %-15s\n" "$name" "$(echo -e "$cert_status_colored")" "$score" "$rating" "$time"
    done
  fi
  
  return 0
}

# Compara certificações entre regiões
compare_certifications_by_region() {
  local model_id="$1"
  
  validate_not_empty "$model_id" "Model ID" || return 1
  
  print_info "Comparando certificações entre regiões..."
  
  local response
  response=$(certification_api_call GET "/api/certification?modelId=$model_id")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data')
  local total=$(echo "$certifications" | jq -r 'length')
  
  if [ "$total" -eq 0 ]; then
    print_warning "Nenhuma certificação encontrada para este modelo"
    return 0
  fi
  
  echo -e "\n${BOLD}Comparação entre Regiões${NC}\n"
  
  # Cabeçalho da tabela
  printf "${BOLD}%-15s %-12s %-10s %-10s %-15s${NC}\n" "Região" "Status" "Score" "Rating" "Tempo (ms)"
  printf "%s\n" "$(printf '%*s' 65 '' | tr ' ' '-')"
  
  # Listar certificações
  echo "$certifications" | jq -r '.[] | [.region, .status, (.qualityScore|tostring), .rating, (.responseTime|tostring)] | @tsv' | \
  while IFS=$'\t' read -r region status score rating time; do
    local status_colored=$(colorize_status "$status")
    printf "%-15s %-22s %-10s %-10s %-15s\n" "$region" "$(echo -e "$status_colored")" "$score" "$rating" "$time"
  done
  
  # Estatísticas agregadas
  show_quality_stats "$certifications"
  
  return 0
}
