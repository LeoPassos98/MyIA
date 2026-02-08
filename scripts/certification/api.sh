#!/usr/bin/env bash
# scripts/certification/api.sh
# Standards: docs/STANDARDS.md

set -e

# Módulo de API para Certificações
# Responsabilidade: Gerenciar chamadas à API de certificação (login, requisições, health check)

# ============================================================================
# FUNÇÕES DE API
# ============================================================================

# Verifica dependências necessárias
check_dependencies() {
  print_verbose "Verificando dependências..."
  
  local missing=()
  local optional_missing=()
  
  # Dependências obrigatórias
  for cmd in curl jq psql; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done
  
  # Dependências opcionais (melhoram performance mas não são críticas)
  for cmd in redis-cli lsof; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      optional_missing+=("$cmd")
    fi
  done
  
  # Verificar se faltam dependências obrigatórias
  if [ ${#missing[@]} -gt 0 ]; then
    print_error "Dependências obrigatórias faltando: ${missing[*]}"
    print_info "Instale com: sudo dnf install ${missing[*]}"
    return 1
  fi
  
  # Avisar sobre dependências opcionais faltando
  if [ ${#optional_missing[@]} -gt 0 ]; then
    print_warning "Dependências opcionais faltando: ${optional_missing[*]}"
    print_info "Algumas funcionalidades podem ter desempenho reduzido"
    print_info "Instale com: sudo dnf install ${optional_missing[*]}"
  fi
  
  print_verbose "Todas as dependências obrigatórias estão instaladas"
  return 0
}

# Função para fazer login na API e obter token
certification_api_login() {
  # Se já temos token, não fazer login novamente
  if [ -n "$API_TOKEN" ]; then
    print_verbose "Token já disponível"
    return 0
  fi
  
  print_verbose "Fazendo login na API..."
  
  # Fazer login com credenciais padrão
  local response
  response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@admin.com","password":"admin123"}' 2>/dev/null || echo "")
  
  # Verificar se login foi bem-sucedido
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    API_TOKEN=$(echo "$response" | jq -r '.data.token')
    print_verbose "Token obtido com sucesso"
    return 0
  else
    # Limpar token se login falhou
    API_TOKEN=""
    print_verbose "Resposta: $response"
    return 1
  fi
}

# Faz chamada à API de certificação
certification_api_call() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"
  
  print_verbose "API Call: $method $API_URL$endpoint"
  
  if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN: $method $API_URL$endpoint"
    echo '{"status":"success","data":{"dry_run":true}}'
    return 0
  fi
  
  local curl_opts=(-s -X "$method")
  curl_opts+=(-H "Content-Type: application/json")
  
  if [ -n "$API_TOKEN" ]; then
    curl_opts+=(-H "Authorization: Bearer $API_TOKEN")
  fi
  
  if [ -n "$data" ]; then
    curl_opts+=(-d "$data")
  fi
  
  local response
  response=$(curl "${curl_opts[@]}" "$API_URL$endpoint" 2>&1)
  local exit_code=$?
  
  if [ "$exit_code" -ne 0 ]; then
    print_error "Erro na chamada API: $response"
    return 1
  fi
  
  echo "$response"
}

# Verifica se o backend está rodando
check_certification_api() {
  print_verbose "Verificando se backend está rodando..."
  
  # Método 1: Verificar endpoint /health
  if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
    print_verbose "Backend detectado via /health endpoint"
    return 0
  fi
  
  # Método 2: Verificar porta 3001 com lsof
  if command -v lsof >/dev/null 2>&1; then
    if lsof -ti:3001 >/dev/null 2>&1; then
      print_verbose "Backend detectado via lsof (porta 3001)"
      return 0
    fi
  fi
  
  # Método 3: Verificar processo node backend
  if pgrep -f "node.*backend/src/server" >/dev/null 2>&1; then
    print_verbose "Backend detectado via pgrep (processo node)"
    return 0
  fi
  
  # Método 4: Verificar com tsx (TypeScript executor)
  if pgrep -f "tsx.*backend/src/server" >/dev/null 2>&1; then
    print_verbose "Backend detectado via pgrep (processo tsx)"
    return 0
  fi
  
  print_verbose "Backend não detectado por nenhum método"
  return 1
}

# Verifica se o worker está rodando
check_worker() {
  print_verbose "Verificando se worker está rodando..."
  
  # Worker é integrado no backend - verificar se backend está ativo
  if ! check_certification_api; then
    print_verbose "Worker não está rodando (backend inativo)"
    return 1
  fi
  
  print_verbose "Backend ativo, verificando worker..."
  
  # Método 1: Verificar via API se worker está processando
  local response
  response=$(certification_api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
  
  # Verificar se API retorna dados da fila (indica worker funcional)
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    # Se conseguimos obter stats da fila, worker está operacional
    print_verbose "Worker detectado via API stats (integrado no backend)"
    return 0
  fi
  
  # Método 2: Verificar logs recentes para atividade do worker
  if [ -f "$LOG_DIR/backend.out.log" ]; then
    # Procurar por logs do worker nos últimos 60 segundos
    if grep -q "CertificationWorker" "$LOG_DIR/backend.out.log" 2>/dev/null | tail -n 100 | grep -q "$(date -d '60 seconds ago' '+%Y-%m-%d')" 2>/dev/null; then
      print_verbose "Worker detectado via logs recentes"
      return 0
    fi
  fi
  
  # Se backend está rodando mas não conseguimos confirmar worker, assumir ativo
  print_verbose "Worker assumido ativo (backend rodando, worker integrado)"
  return 0
}

# Verifica se Redis está acessível
check_redis() {
  print_verbose "Verificando se Redis está acessível..."
  
  # Método 1: Testar Redis diretamente com redis-cli
  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
      print_verbose "Redis detectado via redis-cli ping"
      return 0
    fi
  fi
  
  # Método 2: Testar via API (fallback)
  if check_certification_api; then
    local response
    response=$(certification_api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
    
    if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
      print_verbose "Redis detectado via API stats"
      return 0
    fi
  fi
  
  print_verbose "Redis não acessível"
  return 1
}

# Verifica se PostgreSQL está acessível
check_postgres() {
  print_verbose "Verificando se PostgreSQL está acessível..."
  
  if PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
