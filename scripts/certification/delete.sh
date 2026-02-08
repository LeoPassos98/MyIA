#!/usr/bin/env bash
# scripts/certification/delete.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de Deleção de Certificações
# Responsabilidade: Deletar certificações (por modelo, por região, por status, todas)

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

# Função auxiliar para deletar certificações em lote
# Uso: _delete_certifications_batch "$certifications"
_delete_certifications_batch() {
  local certifications="$1"
  local total=$(echo "$certifications" | jq -r 'length')
  
  if [ "$total" -eq 0 ]; then
    print_info "Nenhuma certificação encontrada"
    return 0
  fi
  
  print_info "Encontradas $total certificações para deletar"
  
  local deleted=0
  local failed=0
  
  # Deletar cada certificação
  echo "$certifications" | jq -r '.[].modelId' | while read -r model_id; do
    if certification_api_call DELETE "/api/certification/$model_id" >/dev/null 2>&1; then
      ((deleted++)) || true
      echo -n "."
    else
      ((failed++)) || true
      echo -n "x"
    fi
  done
  
  echo ""
  print_success "Operação concluída!"
  print_info "Deletadas: $deleted"
  [ "$failed" -gt 0 ] && print_warning "Falhas: $failed"
  
  return 0
}

# ============================================================================
# FUNÇÕES DE DELEÇÃO
# ============================================================================

# Deleta certificação por modelo
# API: DELETE /api/certification/:modelId
delete_certification_by_model() {
  local model_id="$1"
  
  validate_not_empty "$model_id" "Model ID" || return 1
  
  print_warning "Isso irá deletar TODAS as certificações do modelo $model_id"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  print_info "Deletando certificações do modelo..."
  
  local response
  response=$(certification_api_call DELETE "/api/certification/$model_id")
  
  validate_api_response "$response" || return 1
  
  local deleted_count=$(echo "$response" | jq -r '.data.deletedCount // 0')
  print_success "Certificações deletadas com sucesso!"
  print_info "Total deletado: $deleted_count"
  
  return 0
}

# Deleta certificações por status
delete_certifications_by_status() {
  local status="$1"
  
  validate_not_empty "$status" "Status" || return 1
  
  print_warning "Isso irá deletar TODAS as certificações com status $status"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  print_info "Deletando certificações..."
  
  # Buscar certificações com o status
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?status=$status&limit=1000")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  
  _delete_certifications_batch "$certifications"
}

# Deleta certificações por região
delete_certifications_by_region() {
  local region="$1"
  
  validate_not_empty "$region" "Região" || return 1
  
  print_warning "Isso irá deletar TODAS as certificações da região $region"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  print_info "Deletando certificações..."
  
  # Buscar certificações da região
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?region=$region&limit=1000")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  
  _delete_certifications_batch "$certifications"
}

# Deleta TODAS as certificações (com confirmação dupla)
delete_all_certifications() {
  print_warning "⚠️  ATENÇÃO: Isso irá deletar TODAS as certificações do sistema!"
  echo ""
  
  confirm "Tem certeza que deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  echo ""
  print_warning "⚠️  ÚLTIMA CONFIRMAÇÃO: Esta ação é IRREVERSÍVEL!"
  
  confirm "Digite 'sim' para confirmar a deleção de TODAS as certificações" || { print_info "Operação cancelada"; return 0; }
  
  print_info "Deletando todas as certificações..."
  
  # Buscar todas as certificações
  local response
  response=$(certification_api_call GET "/api/certification-queue/certifications?limit=10000")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  
  _delete_certifications_batch "$certifications"
}
