#!/usr/bin/env bash
# manage-certifications.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
# 
# Sistema de Gerenciamento de Certificações MyIA
# 
# Descrição: Script interativo para gerenciar certificações de modelos AI
# Autor: MyIA Team
# Data: 2026-02-08
# Versão: 2.0.0 (Refatorado - Modular)
#
# Uso: ./manage-certifications.sh
#
# Features:
#   - Menu interativo simplificado
#   - Integração com API REST via módulos
#   - Gerenciamento de certificações
#   - Visualização de estatísticas
#   - Visualização de logs
#   - Execução de testes

set -euo pipefail

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
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

# ============================================================================
# FUNÇÕES DE UTILIDADE
# ============================================================================

# Limpa a tela
clear_screen() {
  clear
}

# Imprime cabeçalho colorido
print_header() {
  local text="$1"
  
  echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $((48)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $(((48 + ${#text}) / 2)) "$text" | sed 's/^/  /')$(printf '%*s' $(((48 - ${#text}) / 2)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}║${WHITE}${BOLD}$(printf '%*s' $((48)) '' | tr ' ' ' ')${NC}${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
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

# Formata data ISO para formato legível
format_date() {
  local iso_date="$1"
  date -d "$iso_date" "+%d/%m/%Y %H:%M:%S" 2>/dev/null || echo "$iso_date"
}

# Pausa e aguarda Enter
pause() {
  echo -e "\n${DIM}Pressione Enter para continuar...${NC}"
  read -r
}

# ============================================================================
# CARREGAR MÓDULOS
# ============================================================================

# Carregar módulos de certificação (ordem importa: common primeiro)
source "$SCRIPT_DIR/scripts/certification/common.sh"
source "$SCRIPT_DIR/scripts/certification/api.sh"
source "$SCRIPT_DIR/scripts/certification/list.sh"
source "$SCRIPT_DIR/scripts/certification/delete.sh"
source "$SCRIPT_DIR/scripts/certification/cleanup.sh"
source "$SCRIPT_DIR/scripts/certification/stats.sh"
source "$SCRIPT_DIR/scripts/certification/details.sh"

# ============================================================================
# FUNÇÕES DE MENU
# ============================================================================

# 2. Criar Certificação (simplificado)
create_certification_menu() {
  print_header "Criar Certificação"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Certificar um modelo"
  echo "  2. Certificar múltiplos modelos"
  echo "  3. Certificar todos os modelos"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1) create_single_model_certification ;;
    2) create_multiple_models_certification ;;
    3) create_all_models_certification ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# Criar certificação de modelo único
create_single_model_certification() {
  echo -e "\n${BOLD}Certificar Modelo Único${NC}\n"
  
  read -rp "Model ID (UUID): " model_id
  
  if [ -z "$model_id" ]; then
    print_error "Model ID é obrigatório"
    pause
    return
  fi
  
  echo -e "\n${BOLD}Regiões disponíveis:${NC}"
  echo "  1. us-east-1"
  echo "  2. us-west-2"
  echo "  3. eu-west-1"
  echo "  4. eu-central-1"
  echo "  5. ap-southeast-1"
  echo "  6. ap-northeast-1"
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
  
  print_info "Criando certificação para modelo $model_id na região $region..."
  
  local data="{\"modelId\":\"$model_id\",\"region\":\"$region\"}"
  local response
  response=$(certification_api_call POST "/api/certification-queue/certify-model" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    print_success "Certificação criada com sucesso!"
    print_info "Job ID: $job_id"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar certificação: $error"
  fi
  
  pause
}

# Criar certificação de múltiplos modelos
create_multiple_models_certification() {
  echo -e "\n${BOLD}Certificar Múltiplos Modelos${NC}\n"
  
  read -rp "Model IDs (separados por vírgula): " model_ids_input
  
  if [ -z "$model_ids_input" ]; then
    print_error "Model IDs são obrigatórios"
    pause
    return
  fi
  
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
  
  local regions_json
  regions_json=$(echo "$regions_input" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
  
  print_info "Criando certificações..."
  
  local data="{\"modelIds\":$model_ids_json,\"regions\":$regions_json}"
  local response
  response=$(certification_api_call POST "/api/certification-queue/certify-multiple" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    local total_jobs=$(echo "$response" | jq -r '.data.totalJobs')
    print_success "Certificações criadas com sucesso!"
    print_info "Job ID: $job_id"
    print_info "Total de certificações: $total_jobs"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar certificações: $error"
  fi
  
  pause
}

# Criar certificação de todos os modelos
create_all_models_certification() {
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
  
  local regions_json
  regions_json=$(echo "$regions_input" | sed 's/,/","/g' | sed 's/^/["/' | sed 's/$/"]/')
  
  print_info "Criando certificações para todos os modelos..."
  
  local data="{\"regions\":$regions_json}"
  local response
  response=$(certification_api_call POST "/api/certification-queue/certify-all" "$data")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    local job_id=$(echo "$response" | jq -r '.data.jobId')
    local total_jobs=$(echo "$response" | jq -r '.data.totalJobs')
    print_success "Certificações criadas com sucesso!"
    print_info "Job ID: $job_id"
    print_info "Total de certificações: $total_jobs"
  else
    local error=$(echo "$response" | jq -r '.message // "Erro desconhecido"')
    print_error "Falha ao criar certificações: $error"
  fi
  
  pause
}

# 3. Listar Certificações (com submenu)
list_certifications_menu() {
  print_header "Listar Certificações"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Listar todas"
  echo "  2. Listar por modelo"
  echo "  3. Listar por região"
  echo "  4. Listar por status"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1)
      read -rp "Limite de resultados (padrão: 10): " limit
      limit=${limit:-10}
      list_certifications "$limit"
      pause
      ;;
    2)
      read -rp "Model ID: " model_id
      if [ -n "$model_id" ]; then
        list_certifications_by_model "$model_id"
        pause
      fi
      ;;
    3)
      read -rp "Região: " region
      if [ -n "$region" ]; then
        read -rp "Limite (padrão: 10): " limit
        limit=${limit:-10}
        list_certifications_by_region "$region" "$limit"
        pause
      fi
      ;;
    4)
      echo -e "\n${BOLD}Status disponíveis:${NC}"
      echo "  CERTIFIED, FAILED, PENDING"
      echo ""
      read -rp "Status: " status
      if [ -n "$status" ]; then
        read -rp "Limite (padrão: 10): " limit
        limit=${limit:-10}
        list_certifications_by_status "$status" "$limit"
        pause
      fi
      ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# 4. Ver Detalhes
show_certification_details_menu() {
  print_header "Ver Detalhes de Certificação"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  read -rp "Certification ID: " cert_id
  
  if [ -z "$cert_id" ]; then
    print_error "Certification ID é obrigatório"
    pause
    return
  fi
  
  show_certification_details "$cert_id"
  pause
}

# 5. Deletar Certificações (com submenu)
delete_certifications_menu() {
  print_header "Deletar Certificações"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Deletar por modelo"
  echo "  2. Deletar por status"
  echo "  3. Deletar por região"
  echo "  4. Deletar TODAS (cuidado!)"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1)
      read -rp "Model ID: " model_id
      if [ -n "$model_id" ]; then
        delete_certification_by_model "$model_id"
        pause
      fi
      ;;
    2)
      read -rp "Status: " status
      if [ -n "$status" ]; then
        delete_certifications_by_status "$status"
        pause
      fi
      ;;
    3)
      read -rp "Região: " region
      if [ -n "$region" ]; then
        delete_certifications_by_region "$region"
        pause
      fi
      ;;
    4)
      delete_all_certifications
      pause
      ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# 6. Limpar Antigas
cleanup_old_certifications_menu() {
  print_header "Limpar Certificações Antigas"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  read -rp "Idade mínima em dias (padrão: 30): " days
  days=${days:-30}
  
  cleanup_old_certifications "$days"
  pause
}

# 7. Estatísticas
show_statistics_menu() {
  print_header "Estatísticas de Certificações"
  
  if ! certification_api_login; then
    print_error "Não foi possível autenticar - verifique se o backend está rodando"
    pause
    return
  fi
  
  show_certification_stats
  pause
}

# 9. Ver Logs
show_logs_menu() {
  print_header "Ver Logs"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Logs do backend"
  echo "  2. Logs do worker"
  echo "  3. Logs de erro"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1)
      if [ -f "$LOG_DIR/backend.out.log" ]; then
        print_info "Mostrando últimas 50 linhas do backend..."
        echo ""
        tail -n 50 "$LOG_DIR/backend.out.log"
      else
        print_error "Arquivo de log não encontrado"
      fi
      pause
      ;;
    2)
      if [ -f "$LOG_DIR/backend.out.log" ]; then
        print_info "Filtrando logs do worker..."
        echo ""
        grep -i "worker" "$LOG_DIR/backend.out.log" | tail -n 50 || print_warning "Nenhum log de worker encontrado"
      else
        print_error "Arquivo de log não encontrado"
      fi
      pause
      ;;
    3)
      if [ -f "$LOG_DIR/backend.err.log" ]; then
        print_info "Mostrando últimas 50 linhas de erro..."
        echo ""
        tail -n 50 "$LOG_DIR/backend.err.log"
      else
        print_error "Arquivo de log não encontrado"
      fi
      pause
      ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# 10. Executar Testes
run_tests_menu() {
  print_header "Executar Testes"
  
  echo -e "${BOLD}Opções:${NC}\n"
  echo "  1. Testar API de certificação"
  echo "  2. Testar worker"
  echo "  3. Testar sincronização banco/fila"
  echo "  4. Testar job completo"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    1)
      if [ -f "$BACKEND_DIR/scripts/certification/test-certification-api.sh" ]; then
        print_info "Executando testes da API..."
        cd "$BACKEND_DIR" || exit 1
        bash scripts/certification/test-certification-api.sh
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      pause
      ;;
    2)
      if [ -f "$BACKEND_DIR/scripts/certification/test-worker.ts" ]; then
        print_info "Executando testes do worker..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/certification/test-worker.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      pause
      ;;
    3)
      if [ -f "$BACKEND_DIR/scripts/certification/test-sync-banco-fila.ts" ]; then
        print_info "Executando testes de sincronização..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/certification/test-sync-banco-fila.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      pause
      ;;
    4)
      if [ -f "$BACKEND_DIR/scripts/certification/test-certification-queue.ts" ]; then
        print_info "Executando teste de job completo..."
        cd "$BACKEND_DIR" || exit 1
        npx tsx scripts/certification/test-certification-queue.ts
        cd "$ROOT_DIR" || exit 1
      else
        print_error "Script de teste não encontrado"
      fi
      pause
      ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# 11. Ver Documentação
show_docs_menu() {
  print_header "Documentação"
  
  echo -e "${BOLD}Documentos Disponíveis:${NC}\n"
  echo "  1. Guia do Worker de Certificação"
  echo "  2. API de Certificação"
  echo "  3. Abrir todos no navegador"
  echo "  0. Voltar"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  local docs_dir="$BACKEND_DIR/docs"
  
  case "$choice" in
    1)
      if [ -f "$docs_dir/CERTIFICATION-WORKER-GUIDE.md" ]; then
        less "$docs_dir/CERTIFICATION-WORKER-GUIDE.md"
      else
        print_error "Documento não encontrado"
      fi
      pause
      ;;
    2)
      if [ -f "$docs_dir/CERTIFICATION-QUEUE-API-SUMMARY.md" ]; then
        less "$docs_dir/CERTIFICATION-QUEUE-API-SUMMARY.md"
      else
        print_error "Documento não encontrado"
      fi
      pause
      ;;
    3)
      print_info "Abrindo documentação no navegador..."
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "file://$docs_dir" 2>/dev/null &
        print_success "Documentação aberta"
      else
        print_error "Comando xdg-open não encontrado"
        print_info "Documentos em: $docs_dir"
      fi
      pause
      ;;
    0) return ;;
    *) print_error "Opção inválida"; pause ;;
  esac
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

show_main_menu() {
  clear_screen
  print_header "Sistema de Gerenciamento de Certificações"
  
  echo -e "${DIM}💡 Para gerenciar serviços: ./start_interactive.sh${NC}"
  echo -e "${DIM}💡 Para monitorar fila: http://localhost:3001/admin/queues${NC}"
  echo ""
  
  echo -e "${BOLD}Menu Principal:${NC}\n"
  echo "  2.  🚀 Criar Certificação"
  echo "  3.  📋 Listar Certificações"
  echo "  4.  🔍 Ver Detalhes"
  echo "  5.  ❌ Deletar Certificações"
  echo "  6.  🧹 Limpar Antigas"
  echo "  7.  📈 Estatísticas"
  echo "  9.  📝 Ver Logs"
  echo "  10. 🧪 Executar Testes"
  echo "  11. 📚 Ver Documentação"
  echo "  0.  🚪 Sair"
  echo ""
  
  read -rp "Escolha uma opção: " choice
  
  case "$choice" in
    2) create_certification_menu ;;
    3) list_certifications_menu ;;
    4) show_certification_details_menu ;;
    5) delete_certifications_menu ;;
    6) cleanup_old_certifications_menu ;;
    7) show_statistics_menu ;;
    9) show_logs_menu ;;
    10) run_tests_menu ;;
    11) show_docs_menu ;;
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
if ! certification_api_login; then
  echo ""
  print_warning "Backend não está rodando - algumas funcionalidades estarão limitadas"
  print_info "Use ./start_interactive.sh para iniciar os serviços"
  echo ""
fi

# Loop principal
while true; do
  show_main_menu
done
