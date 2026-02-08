#!/usr/bin/env bash
# scripts/certification/cleanup.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de Limpeza de Certificações
# Responsabilidade: Limpar certificações antigas (expiradas, falhadas, antigas)

# ============================================================================
# FUNÇÕES DE LIMPEZA
# ============================================================================

# Limpa certificações antigas
cleanup_certifications() {
  local days="${1:-7}"
  local status="${2:-ALL}"
  
  print_warning "Isso irá remover certificações $status com mais de $days dias"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  print_info "Executando limpeza..."
  
  # Calcular data limite
  local date_limit=$(calculate_date_limit "$days")
  
  if [ -z "$date_limit" ]; then
    print_error "Não foi possível calcular data limite"
    return 1
  fi
  
  # Construir endpoint com filtros
  local endpoint="/api/certification-queue/certifications?limit=1000&createdBefore=$date_limit"
  [ "$status" != "ALL" ] && endpoint="$endpoint&status=$status"
  
  # Buscar certificações antigas
  local response
  response=$(certification_api_call GET "$endpoint")
  
  validate_api_response "$response" || return 1
  
  local certifications=$(echo "$response" | jq -r '.data.certifications')
  
  _delete_certifications_batch "$certifications"
}

# Limpa certificações expiradas (>90 dias)
cleanup_expired_certifications() {
  print_info "Limpando certificações expiradas..."
  
  local days=90
  print_warning "Isso irá remover certificações com mais de $days dias"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  cleanup_certifications "$days" "CERTIFIED"
}

# Limpa certificações falhadas antigas
cleanup_failed_certifications() {
  local days="${1:-30}"
  
  print_info "Limpando certificações falhadas com mais de $days dias..."
  
  print_warning "Isso irá remover certificações FAILED com mais de $days dias"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  cleanup_certifications "$days" "FAILED"
}

# Limpa certificações pendentes antigas
cleanup_pending_certifications() {
  local days="${1:-7}"
  
  print_info "Limpando certificações pendentes com mais de $days dias..."
  
  print_warning "Isso irá remover certificações PENDING com mais de $days dias"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  cleanup_certifications "$days" "PENDING"
}

# Limpa cache de certificações no Redis
cleanup_certification_cache() {
  print_info "Limpando cache de certificações..."
  
  check_redis || { print_error "Redis não está acessível"; return 1; }
  
  print_warning "Isso irá limpar TODOS os caches de certificação no Redis"
  
  confirm "Deseja continuar?" || { print_info "Operação cancelada"; return 0; }
  
  # Limpar cache via Redis CLI
  if command -v redis-cli >/dev/null 2>&1; then
    local deleted
    deleted=$(redis-cli --scan --pattern "certification:*" | xargs -r redis-cli del 2>/dev/null || echo "0")
    print_success "Cache limpo!"
    print_info "Chaves removidas: $deleted"
  else
    print_error "redis-cli não encontrado"
    return 1
  fi
  
  return 0
}

# Alias para compatibilidade
cleanup_old_certifications() {
  cleanup_certifications "$@"
}
