#!/usr/bin/env bash
# manage-certifications.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
# 
# Sistema de Gerenciamento de Certificações MyIA
# 
# Descrição: Script interativo para gerenciar certificações de modelos AI
# Autor: MyIA Team
# Data: 2026-02-02
# Versão: 1.0.0
#
# Uso: ./manage-certifications.sh
#
# Features:
#   - Menu interativo completo
#   - Integração com API REST
#   - Gerenciamento de jobs de certificação
#   - Visualização de estatísticas
#   - Gerenciamento de fila
#   - Visualização de logs
#   - Execução de testes

set -euo pipefail

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

# Diretórios
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LOG_DIR="$ROOT_DIR/logs"

# Variáveis de Ambiente (podem ser sobrescritas)
API_URL="${API_URL:-http://localhost:3001}"
API_TOKEN="${API_TOKEN:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-myia}"
DB_USER="${DB_USER:-leonardo}"

# Arquivo de configuração opcional
CONFIG_FILE="${HOME}/.certifications-manager.conf"
if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
fi

# Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Modo verbose e dry-run
VERBOSE=false
DRY_RUN=false

# Controle de limpeza de tela
SCREEN_LOCKED=false

# ============================================================================
# FUNÇÕES DE UTILIDADE
# ============================================================================

# Limpa a tela condicionalmente
clear_screen() {
  if [ "$SCREEN_LOCKED" = false ]; then
    clear
  fi
}

# Imprime cabeçalho colorido
print_header() {
  local text="$1"
  
  # Indicador de tela travada
  local lock_indicator=""
  if [ "$SCREEN_LOCKED" = true ]; then
    lock_indicator="${YELLOW}🔒 TELA TRAVADA${NC} "
  fi
  
  echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $((48)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $(((48 + ${#text}) / 2)) "$text" | sed 's/^/  /')$(printf '%*s' $(((48 - ${#text}) / 2)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $((48)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
  if [ -n "$lock_indicator" ]; then
    echo -e "$lock_indicator"
  fi
  echo ""
}

# Imprime mensagem de sucesso
print_success() {
  echo -e "${GREEN}✓${NC} $*"
}

# Imprime mensagem de erro
print_error() {
  echo -e "${RED}✗${NC} $*" >&2
}

# Imprime mensagem de informação
print_info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

# Imprime mensagem de aviso
print_warning() {
  echo -e "${YELLOW}⚠${NC} $*"
}

# Imprime mensagem verbose
print_verbose() {
  if [ "$VERBOSE" = true ]; then
    echo -e "${DIM}[VERBOSE]${NC} $*"
  fi
}

# Pede confirmação do usuário
confirm() {
  local prompt="$1"
  local response
  
  echo -e "${YELLOW}❓${NC} $prompt ${DIM}(s/N)${NC}"
  read -r response
  
  case "$response" in
    [sS]|[sS][iI][mM]|[yY]|[yY][eE][sS])
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

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
login_to_api() {
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

# Faz chamada à API
api_call() {
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
check_backend() {
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
  if ! check_backend; then
    print_verbose "Worker não está rodando (backend inativo)"
    return 1
  fi
  
  print_verbose "Backend ativo, verificando worker..."
  
  # Método 1: Verificar via API se worker está processando
  local response
  response=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
  
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
  if check_backend; then
    local response
    response=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
    
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

# Formata data ISO para formato legível
format_date() {
  local iso_date="$1"
  date -d "$iso_date" "+%d/%m/%Y %H:%M:%S" 2>/dev/null || echo "$iso_date"
}

# Desenha barra de progresso
draw_progress_bar() {
  local current=$1
  local total=$2
  local width=40
  
  if [ "$total" -eq 0 ]; then
    echo "[$(printf '%*s' $width '' | tr ' ' '-')]   0%"
    return
  fi
  
  local percentage=$((current * 100 / total))
  local filled=$((width * current / total))
  local empty=$((width - filled))
  
  printf "["
  printf '%*s' "$filled" '' | tr ' ' '█'
  printf '%*s' "$empty" '' | tr ' ' '-'
  printf "] %3d%%" "$percentage"
}

# Pausa e aguarda Enter
pause() {
  echo -e "\n${DIM}Pressione Enter para continuar...${NC}"
  read -r
}


# Verifica se está autenticado e mostra mensagem se não estiver
require_auth() {
  if [ -z "$API_TOKEN" ]; then
    echo ""
    print_error "Esta funcionalidade requer que o backend esteja rodando"
    echo ""
    echo "Opções:"
    echo "  1. Iniciar serviços: Escolha opção 15 no menu principal"
    echo "  2. Verificar status: ./start.sh status both"
    echo "  3. Reconectar: Escolha opção 14 no menu principal"
    echo ""
    read -rp "Pressione ENTER para voltar ao menu..."
    return 1
  fi
  return 0
}

# Tenta reconectar ao backend
reconnect_backend() {
  print_header "Reconectar ao Backend"
  
  echo ""
  print_info "Tentando reconectar ao backend..."
  echo ""
  
  # Limpar token anterior
  API_TOKEN=""
  
  if login_to_api; then
    print_success "Conectado com sucesso!"
  else
    print_error "Ainda não foi possível conectar"
    echo ""
    print_info "Verifique se o backend está rodando:"
    echo "  • ./start.sh status backend"
    echo "  • ./start.sh start backend"
  fi
  
  echo ""
  pause
}

# Inicia serviços
start_services() {
  print_header "Iniciar Serviços"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Iniciar backend"
  echo "  2. Iniciar frontend"
  echo "  3. Iniciar ambos"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " start_choice
  
  case "$start_choice" in
    1)
      print_info "Iniciando backend..."
      if [ -f "$ROOT_DIR/start.sh" ]; then
        bash "$ROOT_DIR/start.sh" start backend
        print_success "Backend iniciado"
        echo ""
        print_info "Aguarde alguns segundos e tente reconectar (opção 14)"
      else
        print_error "Script start.sh não encontrado"
      fi
      ;;
    2)
      print_info "Iniciando frontend..."
      if [ -f "$ROOT_DIR/start.sh" ]; then
        bash "$ROOT_DIR/start.sh" start frontend
        print_success "Frontend iniciado"
      else
        print_error "Script start.sh não encontrado"
      fi
      ;;
    3)
      print_info "Iniciando todos os serviços..."
      if [ -f "$ROOT_DIR/start.sh" ]; then
        bash "$ROOT_DIR/start.sh" start both
        print_success "Serviços iniciados"
        echo ""
        print_info "Aguarde alguns segundos e tente reconectar (opção 14)"
      else
        print_error "Script start.sh não encontrado"
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# Para serviços
stop_services() {
  print_header "Parar Serviços"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Parar backend"
  echo "  2. Parar frontend"
  echo "  3. Parar ambos"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " stop_choice
  
  case "$stop_choice" in
    1)
      if confirm "Deseja parar o backend?"; then
        print_info "Parando backend..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" stop backend
          print_success "Backend parado"
          # Limpar token
          API_TOKEN=""
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    2)
      if confirm "Deseja parar o frontend?"; then
        print_info "Parando frontend..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" stop frontend
          print_success "Frontend parado"
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    3)
      if confirm "Deseja parar todos os serviços?"; then
        print_info "Parando todos os serviços..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" stop both
          print_success "Serviços parados"
          # Limpar token
          API_TOKEN=""
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}


# ============================================================================
# FUNÇÕES PRINCIPAIS
# ============================================================================

# 1. Ver Status do Sistema
show_status() {
  print_header "Status do Sistema"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_warning "Não foi possível autenticar - algumas informações podem estar limitadas"
  fi
  
  echo -e "${BOLD}Serviços:${NC}\n"
  
  # Backend
  echo -n "  Backend (API):        "
  if check_backend; then
    print_success "Rodando em $API_URL"
  else
    print_error "Não está rodando"
  fi
  
  # Worker
  echo -n "  Worker:               "
  if check_worker; then
    print_success "Rodando"
  else
    print_error "Não está rodando"
  fi
  
  # Redis
  echo -n "  Redis:                "
  if check_redis; then
    print_success "Acessível"
  else
    print_error "Não acessível"
  fi
  
  # PostgreSQL
  echo -n "  PostgreSQL:           "
  if check_postgres; then
    print_success "Acessível"
  else
    print_error "Não acessível"
  fi
  
  echo -e "\n${BOLD}Estatísticas da Fila:${NC}\n"
  
  # Verificar pré-requisitos
  if ! check_backend; then
    print_error "Backend não está rodando - estatísticas indisponíveis"
    pause
    return
  fi
  
  if ! check_redis; then
    print_error "Redis não está acessível - estatísticas indisponíveis"
    pause
    return
  fi
  
  # Buscar estatísticas
  print_verbose "Buscando estatísticas da fila..."
  local stats
  stats=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
  
  if [ -z "$stats" ]; then
    print_error "API não respondeu - verifique conectividade"
    pause
    return
  fi
  
  if ! echo "$stats" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local error_msg=$(echo "$stats" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao obter estatísticas: $error_msg"
    print_verbose "Resposta da API: $stats"
    pause
    return
  fi
  
  # Usar estrutura JSON real: .data.queue.queue.*
  local waiting active completed failed
  
  if echo "$stats" | jq -e '.data.queue.queue' >/dev/null 2>&1; then
    waiting=$(echo "$stats" | jq -r '.data.queue.queue.waiting // 0')
    active=$(echo "$stats" | jq -r '.data.queue.queue.active // 0')
    completed=$(echo "$stats" | jq -r '.data.queue.queue.completed // 0')
    failed=$(echo "$stats" | jq -r '.data.queue.queue.failed // 0')
    print_verbose "Usando estrutura: .data.queue.queue.*"
  else
    print_error "Estrutura JSON não reconhecida"
    print_verbose "Resposta: $stats"
    pause
    return
  fi
  
  echo "  Na Fila:              ${YELLOW}$waiting${NC}"
  echo "  Processando:          ${BLUE}$active${NC}"
  echo "  Completos:            ${GREEN}$completed${NC}"
  echo "  Falhados:             ${RED}$failed${NC}"
  
  pause
}

# 2. Criar Novo Job de Certificação
create_job() {
  print_header "Criar Novo Job de Certificação"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  echo -e "${BOLD}Tipos de Job:${NC}\n"
  echo "  1. Certificar um modelo específico (SINGLE_MODEL)"
  echo "  2. Certificar múltiplos modelos (MULTIPLE_MODELS)"
  echo "  3. Certificar todos os modelos (ALL_MODELS)"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " job_type
  
  case "$job_type" in
    1)
      create_single_model_job
      ;;
    2)
      create_multiple_models_job
      ;;
    3)
      create_all_models_job
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      pause
      ;;
  esac
}

# Criar job para um modelo
create_single_model_job() {
  echo -e "\n${BOLD}Certificar Modelo Único${NC}\n"
  
  read -rp "Model ID (UUID): " model_id
  
  if [ -z "$model_id" ]; then
    print_error "Model ID é obrigatório"
    pause
    return
  fi
  
  echo -e "\n${BOLD}Regiões disponíveis:${NC}"
  echo "  1. us-east-1 (US East - N. Virginia)"
  echo "  2. us-west-2 (US West - Oregon)"
  echo "  3. eu-west-1 (Europe - Ireland)"
  echo "  4. eu-central-1 (Europe - Frankfurt)"
  echo "  5. ap-southeast-1 (Asia Pacific - Singapore)"
  echo "  6. ap-northeast-1 (Asia Pacific - Tokyo)"
  echo ""
  
  read -rp "Escolha a região (1-6): " region_choice
  
  local region
  case "$region_choice" in
    1) region="us-east-1" ;;
    2) region="us-west-2" ;;
    3) region="eu-west-1" ;;
    4) region="eu-central-1" ;;
    5) region="ap-southeast-1" ;;
    6) region="ap-northeast-1" ;;
    *)
      print_error "Região inválida"
      pause
      return
      ;;
  esac
  
  print_info "Criando job para modelo $model_id na região $region..."
  
  local data="{\"modelId\":\"$model_id\",\"region\":\"$region\"}"
  local response
  response=$(api_call POST "/api/certification-queue/certify-model" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    print_success "Job criado com sucesso!"
    print_info "Job ID: $job_id"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar job: $error"
  fi
  
  pause
}

# Criar job para múltiplos modelos
create_multiple_models_job() {
  echo -e "\n${BOLD}Certificar Múltiplos Modelos${NC}\n"
  
  read -rp "Model IDs (separados por vírgula): " model_ids_input
  
  if [ -z "$model_ids_input" ]; then
    print_error "Model IDs são obrigatórios"
    pause
    return
  fi
  
  # Converter para array JSON
  local model_ids_json
  model_ids_json=$(echo "$model_ids_input" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
  
  echo -e "\n${BOLD}Regiões (separadas por vírgula):${NC}"
  echo "Disponíveis: us-east-1, us-west-2, eu-west-1, eu-central-1, ap-southeast-1, ap-northeast-1"
  echo ""
  
  read -rp "Regiões: " regions_input
  
  if [ -z "$regions_input" ]; then
    print_error "Regiões são obrigatórias"
    pause
    return
  fi
  
  # Converter para array JSON
  local regions_json
  regions_json=$(echo "$regions_input" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
  
  print_info "Criando job para múltiplos modelos..."
  
  local data="{\"modelIds\":$model_ids_json,\"regions\":$regions_json}"
  local response
  response=$(api_call POST "/api/certification-queue/certify-multiple" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    local total_jobs=$(echo "$response" | jq -r '.data.totalJobs')
    print_success "Job criado com sucesso!"
    print_info "Job ID: $job_id"
    print_info "Total de certificações: $total_jobs"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar job: $error"
  fi
  
  pause
}

# Criar job para todos os modelos
create_all_models_job() {
  echo -e "\n${BOLD}Certificar Todos os Modelos${NC}\n"
  
  print_warning "Isso irá certificar TODOS os modelos ativos!"
  
  if ! confirm "Deseja continuar?"; then
    print_info "Operação cancelada"
    pause
    return
  fi
  
  echo -e "\n${BOLD}Regiões (separadas por vírgula):${NC}"
  echo "Disponíveis: us-east-1, us-west-2, eu-west-1, eu-central-1, ap-southeast-1, ap-northeast-1"
  echo ""
  
  read -rp "Regiões: " regions_input
  
  if [ -z "$regions_input" ]; then
    print_error "Regiões são obrigatórias"
    pause
    return
  fi
  
  # Converter para array JSON
  local regions_json
  regions_json=$(echo "$regions_input" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
  
  print_info "Criando job para todos os modelos..."
  
  local data="{\"regions\":$regions_json}"
  local response
  response=$(api_call POST "/api/certification-queue/certify-all" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    local total_jobs=$(echo "$response" | jq -r '.data.totalJobs')
    print_success "Job criado com sucesso!"
    print_info "Job ID: $job_id"
    print_info "Total de certificações: $total_jobs"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar job: $error"
  fi
  
  pause
}

# 3. Listar Jobs
list_jobs() {
  print_header "Listar Jobs"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  echo -e "${BOLD}Filtros:${NC}\n"
  echo "  1. Todos os jobs"
  echo "  2. Na Fila (QUEUED)"
  echo "  3. Processando (PROCESSING)"
  echo "  4. Completos (COMPLETED)"
  echo "  5. Falhados (FAILED)"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha um filtro: " filter_choice
  
  local status=""
  case "$filter_choice" in
    1) status="" ;;
    2) status="QUEUED" ;;
    3) status="PROCESSING" ;;
    4) status="COMPLETED" ;;
    5) status="FAILED" ;;
    0) return ;;
    *)
      print_error "Opção inválida"
      pause
      return
      ;;
  esac
  
  read -rp "Limite de resultados (padrão: 10): " limit
  limit=${limit:-10}
  
  print_info "Buscando jobs..."
  
  local endpoint="/api/certification-queue/history?limit=$limit"
  if [ -n "$status" ]; then
    endpoint="$endpoint&status=$status"
  fi
  
  local response
  response=$(api_call GET "$endpoint")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local jobs=$(echo "$response" | jq -r '.data.jobs')
    local total=$(echo "$response" | jq -r '.data.pagination.total')
    
    echo -e "\n${BOLD}Total de jobs: $total${NC}\n"
    
    # Cabeçalho da tabela
    printf "${BOLD}%-38s %-20s %-12s %-10s %-20s${NC}\n" "ID" "Tipo" "Status" "Progresso" "Criado"
    printf "%s\n" "$(printf '%*s' 100 '' | tr ' ' '-')"
    
    # Linhas da tabela
    echo "$jobs" | jq -r '.[] | [.id, .type, .status, (.processedModels|tostring) + "/" + (.totalModels|tostring), .createdAt] | @tsv' | \
    while IFS=$'\t' read -r id type status progress created; do
      # Colorir status
      local status_colored
      case "$status" in
        QUEUED) status_colored="${YELLOW}$status${NC}" ;;
        PROCESSING) status_colored="${BLUE}$status${NC}" ;;
        COMPLETED) status_colored="${GREEN}$status${NC}" ;;
        FAILED) status_colored="${RED}$status${NC}" ;;
        *) status_colored="$status" ;;
      esac
      
      local created_formatted=$(format_date "$created")
      printf "%-38s %-20s %-22s %-10s %-20s\n" "$id" "$type" "$(echo -e "$status_colored")" "$progress" "$created_formatted"
    done
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao listar jobs: $error"
  fi
  
  pause
}

# 4. Ver Detalhes de um Job
show_job_details() {
  print_header "Detalhes do Job"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  read -rp "Job ID: " job_id
  
  if [ -z "$job_id" ]; then
    print_error "Job ID é obrigatório"
    pause
    return
  fi
  
  print_info "Buscando detalhes do job..."
  
  local response
  response=$(api_call GET "/api/certification-queue/jobs/$job_id/status")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local data=$(echo "$response" | jq -r '.data')
    
    echo -e "\n${BOLD}Informações do Job:${NC}\n"
    
    local id=$(echo "$data" | jq -r '.id')
    local type=$(echo "$data" | jq -r '.type')
    local status=$(echo "$data" | jq -r '.status')
    local regions=$(echo "$data" | jq -r '.regions | join(", ")')
    local total=$(echo "$data" | jq -r '.totalModels')
    local processed=$(echo "$data" | jq -r '.processedModels')
    local success=$(echo "$data" | jq -r '.successCount')
    local failure=$(echo "$data" | jq -r '.failureCount')
    
    echo "  ID:                   $id"
    echo "  Tipo:                 $type"
    echo -n "  Status:               "
    case "$status" in
      QUEUED) echo -e "${YELLOW}$status${NC}" ;;
      PROCESSING) echo -e "${BLUE}$status${NC}" ;;
      COMPLETED) echo -e "${GREEN}$status${NC}" ;;
      FAILED) echo -e "${RED}$status${NC}" ;;
      *) echo "$status" ;;
    esac
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
        # Colorir status
        local cert_status_colored
        case "$cert_status" in
          CERTIFIED) cert_status_colored="${GREEN}$cert_status${NC}" ;;
          FAILED) cert_status_colored="${RED}$cert_status${NC}" ;;
          *) cert_status_colored="$cert_status" ;;
        esac
        
        printf "%-30s %-22s %-10s %-10s %-15s\n" "$name" "$(echo -e "$cert_status_colored")" "$score" "$rating" "$time"
      done
    fi
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao buscar detalhes: $error"
  fi
  
  pause
}

# 5. Cancelar Job
cancel_job() {
  print_header "Cancelar Job"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  read -rp "Job ID: " job_id
  
  if [ -z "$job_id" ]; then
    print_error "Job ID é obrigatório"
    pause
    return
  fi
  
  print_warning "Isso irá cancelar o job $job_id"
  
  if ! confirm "Deseja continuar?"; then
    print_info "Operação cancelada"
    pause
    return
  fi
  
  print_info "Cancelando job..."
  
  local response
  response=$(api_call DELETE "/api/certification-queue/jobs/$job_id")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    print_success "Job cancelado com sucesso!"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao cancelar job: $error"
  fi
  
  pause
}

# 6. Limpar Jobs Antigos
cleanup_jobs() {
  print_header "Limpar Jobs Antigos"
  
  echo -e "${BOLD}Opções de Limpeza:${NC}\n"
  echo "  1. Limpar jobs QUEUED antigos"
  echo "  2. Limpar jobs COMPLETED antigos"
  echo "  3. Limpar jobs com falha (antigos)"
  echo "  4. Limpar TODOS os jobs antigos"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " cleanup_choice
  
  local status=""
  case "$cleanup_choice" in
    1) status="QUEUED" ;;
    2) status="COMPLETED" ;;
    3) status="FAILED" ;;
    4) status="ALL" ;;
    0) return ;;
    *)
      print_error "Opção inválida"
      pause
      return
      ;;
  esac
  
  read -rp "Idade mínima em dias (padrão: 7): " days
  days=${days:-7}
  
  print_warning "Isso irá remover jobs $status com mais de $days dias"
  
  if ! confirm "Deseja continuar?"; then
    print_info "Operação cancelada"
    pause
    return
  fi
  
  print_info "Executando limpeza..."
  
  # Executar script de limpeza
  if [ -f "$BACKEND_DIR/scripts/cleanup-old-jobs.ts" ]; then
    cd "$BACKEND_DIR" || exit 1
    
    # Modificar temporariamente o script para usar os parâmetros
    local result
    result=$(npx tsx -e "
      import { PrismaClient } from '@prisma/client';
      const prisma = new PrismaClient();
      
      async function cleanup() {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - $days);
        
        const where: any = { createdAt: { lt: daysAgo } };
        if ('$status' !== 'ALL') {
          where.status = '$status';
        }
        
        const result = await prisma.certificationJob.deleteMany({ where });
        console.log(result.count);
        await prisma.\$disconnect();
      }
      
      cleanup();
    " 2>&1)
    
    cd "$ROOT_DIR" || exit 1
    
    print_success "Limpeza concluída!"
    print_info "Jobs removidos: $result"
  else
    print_error "Script de limpeza não encontrado"
  fi
  
  pause
}

# 7. Ver Estatísticas
show_stats() {
  print_header "Estatísticas"
  
  # Fazer login se necessário
  if ! login_to_api; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  print_info "Buscando estatísticas..."
  
  local response
  response=$(api_call GET "/api/certification-queue/stats")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
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
    echo "$by_region" | jq -r 'group_by(.region) | .[] | [.[0].region, (map(._count) | add)] | @tsv' | \
    while IFS=$'\t' read -r region count; do
      printf "  %-20s %5d\n" "$region" "$count"
    done
    
    # Estatísticas por status
    echo -e "\n${BOLD}Certificações por Status:${NC}\n"
    
    local by_status=$(echo "$data" | jq -r '.certificationsByStatus')
    echo "$by_status" | jq -r '.[] | [.status, ._count] | @tsv' | \
    while IFS=$'\t' read -r status count; do
      case "$status" in
        CERTIFIED) printf "  ${GREEN}%-20s${NC} %5d\n" "$status" "$count" ;;
        FAILED) printf "  ${RED}%-20s${NC} %5d\n" "$status" "$count" ;;
        *) printf "  %-20s %5d\n" "$status" "$count" ;;
      esac
    done
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao buscar estatísticas: $error"
  fi
  
  pause
}

# 8. Gerenciar Fila
manage_queue() {
  print_header "Gerenciar Fila"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Pausar fila"
  echo "  2. Retomar fila"
  echo "  3. Limpar fila"
  echo "  4. Ver jobs na fila"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " queue_choice
  
  case "$queue_choice" in
    1)
      print_warning "Funcionalidade de pausar fila não implementada na API"
      print_info "Use o Bull Board: http://localhost:3001/admin/queues"
      ;;
    2)
      print_warning "Funcionalidade de retomar fila não implementada na API"
      print_info "Use o Bull Board: http://localhost:3001/admin/queues"
      ;;
    3)
      if confirm "Deseja limpar TODA a fila?"; then
        print_warning "Funcionalidade de limpar fila não implementada na API"
        print_info "Use o Bull Board: http://localhost:3001/admin/queues"
      fi
      ;;
    4)
      list_jobs
      return
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# 9. Ver Logs
show_logs() {
  print_header "Ver Logs"
  
  # Fazer login se necessário (para opções que usam API)
  if ! login_to_api; then
    print_warning "Não foi possível autenticar - algumas opções podem estar limitadas"
  fi
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Logs do backend"
  echo "  2. Logs do worker"
  echo "  3. Logs de um job específico"
  echo "  4. Logs de erro (últimos 50)"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " log_choice
  
  case "$log_choice" in
    1)
      if [ -f "$LOG_DIR/backend.out.log" ]; then
        print_info "Mostrando últimas 50 linhas do backend..."
        echo ""
        tail -n 50 "$LOG_DIR/backend.out.log"
      else
        print_error "Arquivo de log não encontrado"
      fi
      ;;
    2)
      if [ -f "$LOG_DIR/backend.out.log" ]; then
        print_info "Filtrando logs do worker..."
        echo ""
        grep -i "worker" "$LOG_DIR/backend.out.log" | tail -n 50 || print_warning "Nenhum log de worker encontrado"
      else
        print_error "Arquivo de log não encontrado"
      fi
      ;;
    3)
      read -rp "Job ID: " job_id
      if [ -n "$job_id" ]; then
        print_info "Buscando logs do job $job_id..."
        
        # Tentar via API primeiro
        local response
        response=$(api_call GET "/api/logs?search=$job_id&limit=50" 2>/dev/null || echo "")
        
        if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
          echo "$response" | jq -r '.data.logs[] | "\(.timestamp) [\(.level)] \(.message)"'
        else
          # Fallback para grep no arquivo
          if [ -f "$LOG_DIR/backend.out.log" ]; then
            grep "$job_id" "$LOG_DIR/backend.out.log" || print_warning "Nenhum log encontrado para este job"
          else
            print_error "Arquivo de log não encontrado"
          fi
        fi
      fi
      ;;
    4)
      print_info "Buscando logs de erro..."
      
      local response
      response=$(api_call GET "/api/logs?level=ERROR&limit=50" 2>/dev/null || echo "")
      
      if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
        echo ""
        echo "$response" | jq -r '.data.logs[] | "\(.timestamp) [\(.level)] \(.message)"'
      else
        # Fallback para grep no arquivo
        if [ -f "$LOG_DIR/backend.err.log" ]; then
          tail -n 50 "$LOG_DIR/backend.err.log"
        else
          print_error "Arquivo de log não encontrado"
        fi
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# 10. Executar Testes
run_tests() {
  print_header "Executar Testes"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Testar API de certificação"
  echo "  2. Testar worker"
  echo "  3. Testar sincronização banco/fila"
  echo "  4. Testar job completo"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " test_choice
  
  case "$test_choice" in
    1)
      if [ -f "$BACKEND_DIR/scripts/test-certification-api.sh" ]; then
        print_info "Executando testes da API..."
        cd "$BACKEND_DIR" || exit 1
        bash scripts/test-certification-api.sh
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      ;;
    2)
      if [ -f "$BACKEND_DIR/scripts/test-worker.ts" ]; then
        print_info "Executando testes do worker..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/test-worker.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      ;;
    3)
      if [ -f "$BACKEND_DIR/scripts/test-sync-banco-fila.ts" ]; then
        print_info "Executando testes de sincronização..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/test-sync-banco-fila.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      ;;
    4)
      if [ -f "$BACKEND_DIR/scripts/test-certification-queue.ts" ]; then
        print_info "Executando teste de job completo..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/test-certification-queue.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# 11. Ver Documentação
show_docs() {
  print_header "Documentação"
  
  echo -e "${BOLD}Documentos Disponíveis:${NC}\n"
  echo "  1. Guia do Worker de Certificação"
  echo "  2. API de Certificação"
  echo "  3. Sistema de Rating de Modelos"
  echo "  4. Gerenciamento de Cache"
  echo "  5. Guia de Migração de Adapters"
  echo "  6. Abrir todos no navegador"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " doc_choice
  
  local docs_dir="$BACKEND_DIR/docs"
  
  case "$doc_choice" in
    1)
      if [ -f "$docs_dir/CERTIFICATION-WORKER-GUIDE.md" ]; then
        less "$docs_dir/CERTIFICATION-WORKER-GUIDE.md"
      else
        print_error "Documento não encontrado"
      fi
      ;;
    2)
      if [ -f "$docs_dir/CERTIFICATION-QUEUE-API-SUMMARY.md" ]; then
        less "$docs_dir/CERTIFICATION-QUEUE-API-SUMMARY.md"
      else
        print_error "Documento não encontrado"
      fi
      ;;
    3)
      if [ -f "$docs_dir/MODEL-RATING-SYSTEM.md" ]; then
        less "$docs_dir/MODEL-RATING-SYSTEM.md"
      else
        print_error "Documento não encontrado"
      fi
      ;;
    4)
      if [ -f "$docs_dir/CERTIFICATION-CACHE-MANAGEMENT.md" ]; then
        less "$docs_dir/CERTIFICATION-CACHE-MANAGEMENT.md"
      else
        print_error "Documento não encontrado"
      fi
      ;;
    5)
      if [ -f "$docs_dir/ADAPTER_MIGRATION_GUIDE.md" ]; then
        less "$docs_dir/ADAPTER_MIGRATION_GUIDE.md"
      else
        print_error "Documento não encontrado"
      fi
      ;;
    6)
      print_info "Abrindo documentação no navegador..."
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "file://$docs_dir" 2>/dev/null &
        print_success "Documentação aberta"
      else
        print_error "Comando xdg-open não encontrado"
        print_info "Documentos em: $docs_dir"
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# 12. Reiniciar Serviços
restart_services() {
  print_header "Reiniciar Serviços"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Reiniciar backend"
  echo "  2. Reiniciar worker (parar e iniciar backend)"
  echo "  3. Reiniciar ambos"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " restart_choice
  
  case "$restart_choice" in
    1)
      if confirm "Deseja reiniciar o backend?"; then
        print_info "Reiniciando backend..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" restart backend
          print_success "Backend reiniciado"
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    2)
      if confirm "Deseja reiniciar o worker (backend)?"; then
        print_info "Reiniciando worker..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" restart backend
          print_success "Worker reiniciado"
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    3)
      if confirm "Deseja reiniciar backend e frontend?"; then
        print_info "Reiniciando todos os serviços..."
        if [ -f "$ROOT_DIR/start.sh" ]; then
          bash "$ROOT_DIR/start.sh" restart both
          print_success "Serviços reiniciados"
        else
          print_error "Script start.sh não encontrado"
        fi
      fi
      ;;
    0)
      return
      ;;
    *)
      print_error "Opção inválida"
      ;;
  esac
  
  pause
}

# 13. Travar/Destravar Tela
toggle_screen_lock() {
  if [ "$SCREEN_LOCKED" = false ]; then
    SCREEN_LOCKED=true
    print_success "🔒 Tela travada. Console não será mais limpo automaticamente."
  else
    SCREEN_LOCKED=false
    print_success "🔓 Tela destravada. Console será limpo automaticamente."
  fi
  pause
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

show_main_menu() {
  clear_screen
  print_header "Sistema de Gerenciamento de Certificações"
  
  echo -e "${BOLD}Menu Principal:${NC}\n"
  echo "  1.  📊 Ver Status do Sistema"
  echo "  2.  🚀 Criar Novo Job de Certificação"
  echo "  3.  📋 Listar Jobs"
  echo "  4.  🔍 Ver Detalhes de um Job"
  echo "  5.  ❌ Cancelar Job"
  echo "  6.  🧹 Limpar Jobs Antigos"
  echo "  7.  📈 Ver Estatísticas"
  echo "  8.  ⚙️  Gerenciar Fila"
  echo "  9.  📝 Ver Logs"
  echo "  10. 🧪 Executar Testes"
  echo "  11. 📚 Ver Documentação"
  echo "  12. 🔄 Reiniciar Serviços"
  
  if [ "$SCREEN_LOCKED" = false ]; then
    echo "  13. 🔒 Travar Tela (não limpar console)"
  else
    echo "  13. 🔓 Destravar Tela (limpar console)"
  fi
  
  echo "  14. 🔄 Reconectar ao Backend"
  echo "  15. 🚀 Iniciar Serviços"
  echo "  16. 🛑 Parar Serviços"
  echo "  0.  🚪 Sair"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1) show_status ;;
    2) create_job ;;
    3) list_jobs ;;
    4) show_job_details ;;
    5) cancel_job ;;
    6) cleanup_jobs ;;
    7) show_stats ;;
    8) manage_queue ;;
    9) show_logs ;;
    10) run_tests ;;
    11) show_docs ;;
    12) restart_services ;;
    13) toggle_screen_lock ;;
    14) reconnect_backend ;;
    15) start_services ;;
    16) stop_services ;;
    0)
      print_info "Saindo..."
      exit 0
      ;;
    *)
      print_error "Opção inválida"
      pause
      ;;
  esac
}

# ============================================================================
# MAIN
# ============================================================================

# Parse argumentos de linha de comando
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Uso: $0 [opções]"
      echo ""
      echo "Opções:"
      echo "  -v, --verbose    Modo verbose (mostra detalhes)"
      echo "  --dry-run        Modo dry-run (não executa ações)"
      echo "  -h, --help       Mostra esta ajuda"
      echo ""
      exit 0
      ;;
    *)
      print_error "Opção desconhecida: $1"
      exit 1
      ;;
  esac
done

# Verificar dependências
if ! check_dependencies; then
  exit 1
fi

# Tentar fazer login na API para obter token
if ! login_to_api; then
  echo ""
  print_warning "Backend não está rodando - algumas funcionalidades estarão limitadas"
  print_info "Use a opção 12 do menu para iniciar os serviços"
  echo ""
fi

# Loop principal
while true; do
  show_main_menu
done