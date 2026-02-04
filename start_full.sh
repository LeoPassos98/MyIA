#!/usr/bin/env bash
# start_full.sh - Inicialização Completa do Sistema MyIA
# Inicia TODOS os serviços necessários para rodar a aplicação completa
#
# Serviços iniciados:
#   1. Redis (porta 6379) - Banco de dados em memória para filas
#   2. PostgreSQL (porta 5432) - Banco de dados principal
#   3. Backend API (porta 3001) - Servidor da API REST
#   4. Worker (porta 3004 health) - Processador de certificações assíncronas
#   5. Frontend Principal (porta 3000) - Interface do usuário
#   6. Frontend Admin (porta 3003) - Interface de administração
#   7. Grafana (porta 3002) - Sistema de observabilidade
#
# Uso: ./start_full.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_ADMIN_DIR="$ROOT_DIR/frontend-admin"
OBSERVABILITY_DIR="$ROOT_DIR/observability"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

# Arquivos de PID para serviços adicionais
PID_FILE_WORKER="$LOG_DIR/worker.pid"
PID_FILE_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.pid"

# Logs para serviços adicionais
OUT_LOG_WORKER="$LOG_DIR/worker.out.log"
ERR_LOG_WORKER="$LOG_DIR/worker.err.log"
OUT_LOG_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.out.log"
ERR_LOG_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.err.log"

# Portas
REDIS_PORT=6379
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000
FRONTEND_ADMIN_PORT=3003
WORKER_HEALTH_PORT=3004
GRAFANA_PORT=3002

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Símbolos
CHECK="✓"
CROSS="✗"
WARN="⚠"
INFO="ℹ"
ROCKET="🚀"
DATABASE="🗄️"
GEAR="⚙️"
CHART="📊"
GLOBE="🌐"
WRENCH="🔧"

# ============================================================================
# FUNÇÕES DE UTILIDADE
# ============================================================================

print_header() {
  local title=$1
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}${ROCKET} $title${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
  local step=$1
  local total=$2
  local description=$3
  echo -e "\n${CYAN}[$step/$total]${NC} ${BLUE}▶${NC} $description"
}

print_success() {
  echo -e "${GREEN}${CHECK}${NC} $1"
}

print_error() {
  echo -e "${RED}${CROSS}${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}${WARN}${NC} $1"
}

print_info() {
  echo -e "${BLUE}${INFO}${NC} $1"
}

# ============================================================================
# VERIFICAÇÃO DE PRÉ-REQUISITOS
# ============================================================================

check_prerequisites() {
  print_step 1 7 "Verificando pré-requisitos"
  
  local all_ok=true
  
  # Verificar Node.js
  if command -v node >/dev/null 2>&1; then
    print_success "Node.js $(node --version) detectado"
  else
    print_error "Node.js não encontrado. Instale o Node.js para prosseguir."
    all_ok=false
  fi
  
  # Verificar npm
  if command -v npm >/dev/null 2>&1; then
    print_success "npm $(npm --version) detectado"
  else
    print_error "npm não encontrado. Instale o npm para prosseguir."
    all_ok=false
  fi
  
  # Verificar Docker
  if command -v docker >/dev/null 2>&1; then
    print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detectado"
    
    # Verificar se Docker está rodando
    if docker info >/dev/null 2>&1; then
      print_success "Docker daemon está rodando"
    else
      print_error "Docker daemon não está rodando. Inicie o Docker primeiro."
      all_ok=false
    fi
  else
    print_warning "Docker não encontrado. Redis e Grafana não poderão ser iniciados."
  fi
  
  # Verificar docker-compose
  if command -v docker-compose >/dev/null 2>&1; then
    print_success "docker-compose detectado"
  else
    print_warning "docker-compose não encontrado. Grafana não poderá ser iniciado."
  fi
  
  # Verificar lsof
  if command -v lsof >/dev/null 2>&1; then
    print_success "lsof detectado (para verificação de portas)"
  else
    print_warning "lsof não encontrado. Verificação de portas pode falhar."
  fi
  
  if [ "$all_ok" = false ]; then
    echo ""
    print_error "Alguns pré-requisitos não foram atendidos. Corrija os erros acima."
    exit 1
  fi
  
  print_success "Todos os pré-requisitos atendidos!"
}

# ============================================================================
# INICIALIZAÇÃO DE SERVIÇOS
# ============================================================================

start_redis() {
  print_step 2 7 "Iniciando Redis (porta $REDIS_PORT)"
  
  # Verificar se Redis já está rodando
  if docker ps --format '{{.Names}}' | grep -q "^myia-redis$"; then
    print_warning "Redis já está rodando"
    return 0
  fi
  
  # Remover container antigo se existir (parado)
  if docker ps -a --format '{{.Names}}' | grep -q "^myia-redis$"; then
    print_info "Removendo container Redis antigo..."
    docker rm -f myia-redis >/dev/null 2>&1 || true
  fi
  
  # Iniciar Redis
  print_info "Iniciando container Redis..."
  if docker run -d \
    --name myia-redis \
    -p $REDIS_PORT:6379 \
    --restart unless-stopped \
    redis:7-alpine \
    >/dev/null 2>&1; then
    
    # Aguardar Redis ficar pronto
    sleep 2
    
    # Verificar se está respondendo
    if docker exec myia-redis redis-cli ping >/dev/null 2>&1; then
      print_success "Redis iniciado com sucesso"
      print_info "Container: myia-redis"
    else
      print_error "Redis não está respondendo"
      return 1
    fi
  else
    print_error "Falha ao iniciar Redis"
    return 1
  fi
}

start_postgres() {
  print_step 3 7 "Verificando PostgreSQL (porta $POSTGRES_PORT)"
  
  # Verificar se PostgreSQL está rodando (local ou Docker)
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h localhost -p $POSTGRES_PORT >/dev/null 2>&1; then
      print_success "PostgreSQL já está rodando (local)"
      return 0
    fi
  fi
  
  # Verificar se há um container PostgreSQL rodando
  if docker ps --format '{{.Names}}' | grep -q "postgres"; then
    print_success "PostgreSQL já está rodando (Docker)"
    return 0
  fi
  
  # Verificar se a porta está ocupada
  if lsof -ti:$POSTGRES_PORT >/dev/null 2>&1; then
    print_success "PostgreSQL já está rodando na porta $POSTGRES_PORT"
    return 0
  fi
  
  print_warning "PostgreSQL não detectado. Certifique-se de que está rodando."
  print_info "Para iniciar PostgreSQL via Docker:"
  echo -e "  ${YELLOW}docker run -d --name myia-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine${NC}"
}

start_backend_and_frontend() {
  print_step 4 7 "Iniciando Backend e Frontend Principal"
  
  print_info "Executando: ./start.sh start both"
  echo ""
  
  # Chamar o script start.sh existente
  if "$ROOT_DIR/start.sh" start both; then
    print_success "Backend e Frontend Principal iniciados com sucesso"
  else
    print_error "Falha ao iniciar Backend e/ou Frontend Principal"
    return 1
  fi
}

start_worker() {
  print_step 5 7 "Iniciando Worker (porta $WORKER_HEALTH_PORT)"
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    print_warning "Worker já está rodando (PID $(cat "$PID_FILE_WORKER"))"
    return 0
  fi
  
  # Verificar dependências
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    print_info "Instalando dependências do backend..."
    (cd "$BACKEND_DIR" && npm install >/dev/null 2>&1)
  fi
  
  print_info "Iniciando Worker em background..."
  print_info "Logs salvos em:"
  echo -e "   Output: ${YELLOW}$OUT_LOG_WORKER${NC}"
  echo -e "   Errors: ${YELLOW}$ERR_LOG_WORKER${NC}"
  
  # Iniciar worker em background
  (cd "$BACKEND_DIR" && npm run worker:dev) >"$OUT_LOG_WORKER" 2>"$ERR_LOG_WORKER" &
  echo $! >"$PID_FILE_WORKER"
  
  # Aguardar um pouco
  sleep 3
  
  # Verificar se ainda está rodando
  if kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    print_success "Worker iniciado com sucesso (PID $(cat "$PID_FILE_WORKER"))"
  else
    print_error "Worker falhou ao iniciar. Verifique os logs."
    return 1
  fi
}

start_frontend_admin() {
  print_step 6 7 "Iniciando Frontend Admin (porta $FRONTEND_ADMIN_PORT)"
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_FRONTEND_ADMIN" ] && kill -0 "$(cat "$PID_FILE_FRONTEND_ADMIN")" >/dev/null 2>&1; then
    print_warning "Frontend Admin já está rodando (PID $(cat "$PID_FILE_FRONTEND_ADMIN"))"
    return 0
  fi
  
  # Verificar se a porta está ocupada
  if lsof -ti:$FRONTEND_ADMIN_PORT >/dev/null 2>&1; then
    print_warning "Porta $FRONTEND_ADMIN_PORT já está ocupada"
    return 0
  fi
  
  # Verificar dependências
  if [ ! -d "$FRONTEND_ADMIN_DIR/node_modules" ]; then
    print_info "Instalando dependências do frontend-admin..."
    (cd "$FRONTEND_ADMIN_DIR" && npm install >/dev/null 2>&1)
  fi
  
  print_info "Iniciando Frontend Admin em background..."
  print_info "Logs salvos em:"
  echo -e "   Output: ${YELLOW}$OUT_LOG_FRONTEND_ADMIN${NC}"
  echo -e "   Errors: ${YELLOW}$ERR_LOG_FRONTEND_ADMIN${NC}"
  
  # Iniciar frontend-admin em background
  (cd "$FRONTEND_ADMIN_DIR" && npm run dev) >"$OUT_LOG_FRONTEND_ADMIN" 2>"$ERR_LOG_FRONTEND_ADMIN" &
  echo $! >"$PID_FILE_FRONTEND_ADMIN"
  
  # Aguardar servidor iniciar
  local max_wait=30
  local waited=0
  
  while [ $waited -lt $max_wait ]; do
    if lsof -ti:$FRONTEND_ADMIN_PORT >/dev/null 2>&1; then
      print_success "Frontend Admin iniciado com sucesso (PID $(cat "$PID_FILE_FRONTEND_ADMIN"))"
      print_info "URL: ${BLUE}http://localhost:$FRONTEND_ADMIN_PORT${NC}"
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  
  print_error "Frontend Admin não respondeu após ${max_wait}s"
  return 1
}

start_grafana() {
  print_step 7 7 "Iniciando Grafana (porta $GRAFANA_PORT)"
  
  # Verificar se já está rodando
  if lsof -ti:$GRAFANA_PORT >/dev/null 2>&1; then
    print_warning "Grafana já está rodando na porta $GRAFANA_PORT"
    return 0
  fi
  
  # Verificar se o diretório observability existe
  if [ ! -d "$OBSERVABILITY_DIR" ]; then
    print_warning "Diretório observability não encontrado. Pulando Grafana."
    return 0
  fi
  
  # Verificar se o script start.sh existe
  if [ ! -f "$OBSERVABILITY_DIR/start.sh" ]; then
    print_warning "Script observability/start.sh não encontrado. Pulando Grafana."
    return 0
  fi
  
  print_info "Executando: cd observability && ./start.sh"
  echo ""
  
  # Iniciar Grafana
  if (cd "$OBSERVABILITY_DIR" && ./start.sh); then
    print_success "Grafana iniciado com sucesso"
    print_info "URL: ${BLUE}http://localhost:$GRAFANA_PORT${NC} (admin/admin)"
  else
    print_warning "Falha ao iniciar Grafana (não crítico)"
  fi
}

# ============================================================================
# VERIFICAÇÃO DE HEALTH
# ============================================================================

verify_health() {
  print_header "Verificação de Health dos Serviços"
  
  local all_healthy=true
  
  # Redis
  echo -ne "${BLUE}Redis (porta $REDIS_PORT):${NC} "
  if docker exec myia-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${RED}${CROSS} FALHOU${NC}"
    all_healthy=false
  fi
  
  # PostgreSQL
  echo -ne "${BLUE}PostgreSQL (porta $POSTGRES_PORT):${NC} "
  if lsof -ti:$POSTGRES_PORT >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${YELLOW}${WARN} NÃO DETECTADO${NC}"
  fi
  
  # Backend
  echo -ne "${BLUE}Backend (porta $BACKEND_PORT):${NC} "
  if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${RED}${CROSS} FALHOU${NC}"
    all_healthy=false
  fi
  
  # Frontend
  echo -ne "${BLUE}Frontend (porta $FRONTEND_PORT):${NC} "
  if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${RED}${CROSS} FALHOU${NC}"
    all_healthy=false
  fi
  
  # Worker
  echo -ne "${BLUE}Worker:${NC} "
  if [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK (PID $(cat "$PID_FILE_WORKER"))${NC}"
  else
    echo -e "${RED}${CROSS} FALHOU${NC}"
    all_healthy=false
  fi
  
  # Frontend Admin
  echo -ne "${BLUE}Frontend Admin (porta $FRONTEND_ADMIN_PORT):${NC} "
  if lsof -ti:$FRONTEND_ADMIN_PORT >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${RED}${CROSS} FALHOU${NC}"
    all_healthy=false
  fi
  
  # Grafana
  echo -ne "${BLUE}Grafana (porta $GRAFANA_PORT):${NC} "
  if curl -s http://localhost:$GRAFANA_PORT/api/health >/dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} OK${NC}"
  else
    echo -e "${YELLOW}${WARN} NÃO INICIADO${NC}"
  fi
  
  echo ""
  
  if [ "$all_healthy" = true ]; then
    print_success "Todos os serviços críticos estão saudáveis!"
  else
    print_warning "Alguns serviços falharam. Verifique os logs acima."
  fi
}

# ============================================================================
# RESUMO FINAL
# ============================================================================

show_summary() {
  print_header "Sistema MyIA - Resumo de Inicialização"
  
  echo -e "\n${GREEN}${CHECK} Sistema iniciado com sucesso!${NC}\n"
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${GLOBE} URLs de Acesso${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  echo -e "  ${GREEN}•${NC} ${BLUE}Frontend Principal:${NC}    http://localhost:$FRONTEND_PORT"
  echo -e "  ${GREEN}•${NC} ${BLUE}Frontend Admin:${NC}        http://localhost:$FRONTEND_ADMIN_PORT"
  echo -e "  ${GREEN}•${NC} ${BLUE}Backend API:${NC}           http://localhost:$BACKEND_PORT"
  echo -e "  ${GREEN}•${NC} ${BLUE}Backend Health:${NC}        http://localhost:$BACKEND_PORT/health"
  echo -e "  ${GREEN}•${NC} ${BLUE}Grafana:${NC}               http://localhost:$GRAFANA_PORT ${YELLOW}(admin/admin)${NC}"
  
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${DATABASE} Serviços de Infraestrutura${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  echo -e "  ${GREEN}•${NC} ${BLUE}Redis:${NC}                 localhost:$REDIS_PORT"
  echo -e "  ${GREEN}•${NC} ${BLUE}PostgreSQL:${NC}            localhost:$POSTGRES_PORT"
  echo -e "  ${GREEN}•${NC} ${BLUE}Worker:${NC}                Rodando em background"
  
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${WRENCH} Comandos Úteis${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  echo -e "  ${YELLOW}./start.sh status${NC}              - Ver status dos serviços"
  echo -e "  ${YELLOW}./start.sh stop both${NC}           - Parar backend e frontend principal"
  echo -e "  ${YELLOW}tail -f logs/*.log${NC}             - Ver logs em tempo real"
  echo -e "  ${YELLOW}docker logs -f myia-redis${NC}      - Ver logs do Redis"
  echo -e "  ${YELLOW}cd observability && ./stop.sh${NC}  - Parar Grafana"
  
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${CHART} Logs dos Serviços${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  echo -e "  ${GREEN}•${NC} Backend:         ${YELLOW}$LOG_DIR/backend.*.log${NC}"
  echo -e "  ${GREEN}•${NC} Frontend:        ${YELLOW}$LOG_DIR/frontend.*.log${NC}"
  echo -e "  ${GREEN}•${NC} Worker:          ${YELLOW}$LOG_DIR/worker.*.log${NC}"
  echo -e "  ${GREEN}•${NC} Frontend Admin:  ${YELLOW}$LOG_DIR/frontend-admin.*.log${NC}"
  
  echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${ROCKET} Sistema MyIA pronto para uso!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  clear
  print_header "Inicialização Completa do Sistema MyIA"
  
  echo -e "\n${BLUE}Este script irá iniciar TODOS os serviços da aplicação:${NC}"
  echo -e "  ${GREEN}1.${NC} Redis (banco de dados em memória)"
  echo -e "  ${GREEN}2.${NC} PostgreSQL (banco de dados principal)"
  echo -e "  ${GREEN}3.${NC} Backend API (servidor REST)"
  echo -e "  ${GREEN}4.${NC} Worker (processador de tarefas)"
  echo -e "  ${GREEN}5.${NC} Frontend Principal (interface do usuário)"
  echo -e "  ${GREEN}6.${NC} Frontend Admin (painel de administração)"
  echo -e "  ${GREEN}7.${NC} Grafana (sistema de observabilidade)"
  echo ""
  
  # Executar etapas
  check_prerequisites
  start_redis
  start_postgres
  start_backend_and_frontend
  start_worker
  start_frontend_admin
  start_grafana
  
  # Verificar health
  verify_health
  
  # Mostrar resumo
  show_summary
}

# Executar
main
