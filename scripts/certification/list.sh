#!/usr/bin/env bash
# scripts/certification/list.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de Listagem de Certificações
# Responsabilidade: Listar certificações (todas, por modelo, por região, por status)

# ============================================================================
# FUNÇÕES DE LISTAGEM
# ============================================================================

# Lista todas as certificações
list_certifications() {
  local limit="${1:-10}"
  local status="${2:-}"
  
  print_info "Buscando certificações..."
  
  # Construir endpoint com parâmetros
  local endpoint="/api/certification-queue/certifications?limit=$limit"
  [ -n "$status" ] && endpoint="$endpoint&status=$status"
  
  local response
  response=$(certification_api_call GET "$endpoint")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  local total=$(echo "$response" | jq -r '.data.pagination.total // 0')
  
  echo -e "\n${BOLD}Total de certificações: $total${NC}\n"
  
  print_cert_table_header
  
  # Processar e exibir cada certificação
  echo "$certifications" | jq -r '.[] | [.id, .model.name, .status, .rating, .createdAt] | @tsv' | \
  while IFS=$'\t' read -r id model_name cert_status rating created; do
    print_cert_table_row "$id" "$model_name" "$cert_status" "$rating" "$created"
  done
  
  return 0
}

# Lista certificações por modelo
list_certifications_by_model() {
  local model_id="$1"
  
  validate_not_empty "$model_id" "Model ID" || return 1
  
  print_info "Buscando certificações do modelo $model_id..."
  
  local response
  response=$(certification_api_call GET "/api/certification?modelId=$model_id")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data')
  
  echo -e "\n${BOLD}Certificações do Modelo:${NC}\n"
  
  print_model_cert_table_header
  
  # Processar e exibir cada certificação
  echo "$certifications" | jq -r '.[] | [.region, .status, (.qualityScore|tostring), .rating, (.responseTime|tostring), .createdAt] | @tsv' | \
  while IFS=$'\t' read -r region cert_status score rating time created; do
    print_model_cert_table_row "$region" "$cert_status" "$score" "$rating" "$time" "$created"
  done
  
  return 0
}

# Lista certificações por região
list_certifications_by_region() {
  local region="$1"
  local limit="${2:-10}"
  
  validate_not_empty "$region" "Região" || return 1
  
  print_info "Buscando certificações da região $region..."
  
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?region=$region&limit=$limit")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  local total=$(echo "$response" | jq -r '.data.pagination.total // 0')
  
  echo -e "\n${BOLD}Certificações na região $region: $total${NC}\n"
  
  print_cert_table_header
  
  # Processar e exibir cada certificação
  echo "$certifications" | jq -r '.[] | [.id, .model.name, .status, .rating, .createdAt] | @tsv' | \
  while IFS=$'\t' read -r id model_name cert_status rating created; do
    print_cert_table_row "$id" "$model_name" "$cert_status" "$rating" "$created"
  done
  
  return 0
}

# Lista certificações por status
list_certifications_by_status() {
  local status="$1"
  local limit="${2:-10}"
  
  validate_not_empty "$status" "Status" || return 1
  
  print_info "Buscando certificações com status $status..."
  
  list_certifications "$limit" "$status"
}
