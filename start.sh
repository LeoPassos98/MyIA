#!/usr/bin/env bash
# start.sh - Gerenciador de Processos MyIA
# Documentação completa: START-SH-DOCS.md
#
# Uso: ./start.sh [start|stop|restart|status] [backend|frontend|both]
#
# Exemplos:
#   ./start.sh start both      # Inicia backend + frontend
#   ./start.sh stop backend    # Para apenas backend
#   ./start.sh restart both    # Reinicia ambos
#   ./start.sh status          # Mostra status
#
# Features:
#   - Quality Gates automáticos (ESLint + TypeScript)
#   - Gerenciamento de processos em background
#   - Logs estruturados em logs/
#   - Limpeza automática de portas
#   - Health check com timeout

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

PID_FILE_BACKEND="$LOG_DIR/backend.pid"
OUT_LOG_BACKEND="$LOG_DIR/backend.out.log"
ERR_LOG_BACKEND="$LOG_DIR/backend.err.log"

PID_FILE_FRONTEND="$LOG_DIR/frontend.pid"
OUT_LOG_FRONTEND="$LOG_DIR/frontend.out.log"
ERR_LOG_FRONTEND="$LOG_DIR/frontend.err.log"

BACKEND_PORT=3001
FRONTEND_PORT=3000

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
  echo "Usage: $0 {start|stop|restart|status} {backend|frontend|both}" >&2
  exit 1
}

ensure_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}✗ Node.js não encontrado no PATH. Instale o Node.js para prosseguir.${NC}" >&2
    exit 2
  fi
  echo -e "${GREEN}✓${NC} Node.js $(node --version) detectado"
}

run_quality_gates() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🔍 Quality Gates - Validação Pré-Start${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  # ESLint
  echo -e "${BLUE}📝${NC} Verificando ESLint..."
  if npm run lint --silent 2>&1 | grep -q "0 errors"; then
    echo -e "${GREEN}✓${NC} ESLint passou (0 errors)"
  else
    echo -e "${RED}✗${NC} ESLint falhou! Execute: ${YELLOW}npm run lint${NC}"
    echo -e "${YELLOW}⚠${NC}  Continuando mesmo assim..."
  fi
  
  # TypeScript
  echo -e "${BLUE}🔧${NC} Verificando TypeScript..."
  if npm run type-check --silent >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} TypeScript passou (0 errors)"
  else
    echo -e "${RED}✗${NC} TypeScript falhou! Execute: ${YELLOW}npm run type-check${NC}"
    echo -e "${YELLOW}⚠${NC}  Continuando mesmo assim..."
  fi
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_dependencies() {
  local dir=$1
  local name=$2
  
  if [ ! -d "$dir/node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Dependências do $name não instaladas. Instalando..."
    (cd "$dir" && npm install)
    echo -e "${GREEN}✓${NC} Dependências do $name instaladas"
  else
    echo -e "${GREEN}✓${NC} Dependências do $name já instaladas"
  fi
}

wait_for_server() {
  local port=$1
  local name=$2
  local max_wait=30
  local waited=0
  
  echo -e "${BLUE}⏳${NC} Aguardando $name iniciar na porta $port..."
  
  while [ $waited -lt $max_wait ]; do
    if lsof -ti:$port >/dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} $name está respondendo na porta $port"
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
    printf "."
  done
  
  echo -e "\n${RED}✗${NC} $name não respondeu após ${max_wait}s. Verifique os logs:"
  if [ "$name" = "Backend" ]; then
    echo -e "   ${YELLOW}tail -f $ERR_LOG_BACKEND${NC}"
  else
    echo -e "   ${YELLOW}tail -f $ERR_LOG_FRONTEND${NC}"
  fi
  return 1
}

# Função para matar toda a árvore de processos
kill_process_tree() {
  local pid=$1
  local children=$(pgrep -P "$pid" 2>/dev/null || true)
  
  for child in $children; do
    kill_process_tree "$child"
  done
  
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
    sleep 0.5
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  fi
}

# Função para matar processos em uma porta específica
kill_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null || true)
  
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}⚠${NC}  Matando processos na porta $port: $pids"
    for pid in $pids; do
      kill_process_tree "$pid"
    done
    echo -e "${GREEN}✓${NC} Porta $port liberada"
  fi
}

start_backend() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🚀 Iniciando Backend${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  ensure_node
  run_quality_gates
  check_dependencies "$BACKEND_DIR" "backend"
  
  # Limpar porta antes de iniciar
  kill_port $BACKEND_PORT
  
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Backend já em execução (PID $(cat "$PID_FILE_BACKEND"))."
    return
  fi
  
  echo -e "${BLUE}▶${NC}  Iniciando servidor backend na porta $BACKEND_PORT..."
  echo -e "${BLUE}📝${NC} Logs salvos em:"
  echo -e "   Output: ${YELLOW}$OUT_LOG_BACKEND${NC}"
  echo -e "   Errors: ${YELLOW}$ERR_LOG_BACKEND${NC}"
  
  (cd "$BACKEND_DIR" && npm run dev) >"$OUT_LOG_BACKEND" 2>"$ERR_LOG_BACKEND" &
  echo $! >"$PID_FILE_BACKEND"
  
  if wait_for_server $BACKEND_PORT "Backend"; then
    echo -e "${GREEN}✓${NC} Backend iniciado com sucesso (PID $(cat "$PID_FILE_BACKEND"))"
    echo -e "${GREEN}🌐${NC} URL: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "${GREEN}📊${NC} Health: ${BLUE}http://localhost:$BACKEND_PORT/health${NC}"
  fi
}

stop_backend() {
  echo -e "\n${YELLOW}⏹${NC}  Parando backend..."
  
  # Matar processos na porta
  kill_port $BACKEND_PORT
  
  # Matar processo pelo PID file
  if [ -f "$PID_FILE_BACKEND" ]; then
    PID=$(cat "$PID_FILE_BACKEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo -e "${YELLOW}🔄${NC} Matando árvore de processos do backend (PID $PID)..."
      kill_process_tree "$PID"
    fi
    rm -f "$PID_FILE_BACKEND"
  fi
  
  echo -e "${GREEN}✓${NC} Backend parado."
}

start_frontend() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🚀 Iniciando Frontend${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  ensure_node
  check_dependencies "$FRONTEND_DIR" "frontend"
  
  # Limpar porta antes de iniciar
  kill_port $FRONTEND_PORT
  
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Frontend já em execução (PID $(cat "$PID_FILE_FRONTEND"))."
    return
  fi
  
  echo -e "${BLUE}▶${NC}  Iniciando servidor frontend na porta $FRONTEND_PORT..."
  echo -e "${BLUE}📝${NC} Logs salvos em:"
  echo -e "   Output: ${YELLOW}$OUT_LOG_FRONTEND${NC}"
  echo -e "   Errors: ${YELLOW}$ERR_LOG_FRONTEND${NC}"
  
  (cd "$FRONTEND_DIR" && npm run dev) >"$OUT_LOG_FRONTEND" 2>"$ERR_LOG_FRONTEND" &
  echo $! >"$PID_FILE_FRONTEND"
  
  if wait_for_server $FRONTEND_PORT "Frontend"; then
    echo -e "${GREEN}✓${NC} Frontend iniciado com sucesso (PID $(cat "$PID_FILE_FRONTEND"))"
    echo -e "${GREEN}🌐${NC} URL: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
  fi
}

stop_frontend() {
  echo -e "\n${YELLOW}⏹${NC}  Parando frontend..."
  
  # Matar processos na porta
  kill_port $FRONTEND_PORT
  
  # Matar processo pelo PID file
  if [ -f "$PID_FILE_FRONTEND" ]; then
    PID=$(cat "$PID_FILE_FRONTEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo -e "${YELLOW}🔄${NC} Matando árvore de processos do frontend (PID $PID)..."
      kill_process_tree "$PID"
    fi
    rm -f "$PID_FILE_FRONTEND"
  fi
  
  echo -e "${GREEN}✓${NC} Frontend parado."
}

status() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📊 Status dos Servidores${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  # Status Backend
  echo -e "${BLUE}Backend (porta $BACKEND_PORT):${NC}"
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Em execução (PID $(cat "$PID_FILE_BACKEND"))"
    echo -e "  ${GREEN}🌐${NC} http://localhost:$BACKEND_PORT"
  else
    echo -e "  ${RED}✗${NC} Parado"
  fi
  
  # Verificar porta do backend
  local backend_port_pids=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
  if [ -n "$backend_port_pids" ]; then
    echo -e "  ${YELLOW}⚠️${NC}  Porta $BACKEND_PORT ocupada por: $backend_port_pids"
  fi
  
  # Status Frontend
  echo -e "\n${BLUE}Frontend (porta $FRONTEND_PORT):${NC}"
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Em execução (PID $(cat "$PID_FILE_FRONTEND"))"
    echo -e "  ${GREEN}🌐${NC} http://localhost:$FRONTEND_PORT"
  else
    echo -e "  ${RED}✗${NC} Parado"
  fi
  
  # Verificar porta do frontend
  local frontend_port_pids=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
  if [ -n "$frontend_port_pids" ]; then
    echo -e "  ${YELLOW}⚠️${NC}  Porta $FRONTEND_PORT ocupada por: $frontend_port_pids"
  fi
  
  # Status Observability
  echo -e "\n${BLUE}Observability (porta 3002):${NC}"
  local grafana_port_pids=$(lsof -ti:3002 2>/dev/null || true)
  if [ -n "$grafana_port_pids" ]; then
    echo -e "  ${GREEN}✓${NC} Grafana em execução"
    echo -e "  ${GREEN}🌐${NC} http://localhost:3002"
  else
    echo -e "  ${YELLOW}○${NC} Não iniciado"
    echo -e "  ${BLUE}ℹ${NC}  Iniciar: ${YELLOW}cd observability && ./start.sh${NC}"
  fi
  echo -e "  ${BLUE}🔧${NC} Gerenciar: ${YELLOW}cd observability && ./validate.sh${NC}"
  
  echo -e "\n${BLUE}📝 Logs:${NC}"
  echo -e "  Backend: ${YELLOW}$LOG_DIR/backend.*.log${NC}"
  echo -e "  Frontend: ${YELLOW}$LOG_DIR/frontend.*.log${NC}"
  echo ""
}

# Parse args
if [ $# -lt 1 ]; then
  usage
fi
ACTION=$1
TARGET=${2:-both}

case "$ACTION" in
  start)
    case "$TARGET" in
      backend) start_backend ;; 
      frontend) start_frontend ;; 
      both)
        start_backend
        start_frontend
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✓ Todos os servidores iniciados!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        echo -e "\n${BLUE}📊 Sistema de Observabilidade Disponível${NC}\n"
        echo -e "Para monitorar logs e métricas em tempo real:"
        echo -e "  ${BLUE}1.${NC} Iniciar: ${YELLOW}cd observability && ./start.sh${NC}"
        echo -e "  ${BLUE}2.${NC} Acessar Grafana: ${BLUE}http://localhost:3002${NC} ${YELLOW}(admin/admin)${NC}"
        echo -e "  ${BLUE}3.${NC} Tutorial: ${YELLOW}observability/GRAFANA-TUTORIAL.md${NC}"
        echo -e "\nDashboards disponíveis:"
        echo -e "  ${GREEN}•${NC} MyIA - Overview (visão geral)"
        echo -e "  ${GREEN}•${NC} MyIA - Errors (análise de erros)"
        echo -e "  ${GREEN}•${NC} MyIA - Performance (métricas HTTP)\n"
        ;;
      *) usage ;;
    esac
    ;;
  stop)
    case "$TARGET" in
      backend) stop_backend ;; 
      frontend) stop_frontend ;; 
      both) 
        stop_backend
        stop_frontend
        echo -e "\n${GREEN}✓ Todos os servidores parados.${NC}\n"
        ;;
      *) usage ;;
    esac
    ;;
  restart)
    case "$TARGET" in
      backend) stop_backend; start_backend ;; 
      frontend) stop_frontend; start_frontend ;; 
      both) 
        stop_backend
        stop_frontend
        start_backend
        start_frontend
        echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✓ Todos os servidores reiniciados!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        ;;
      *) usage ;;
    esac
    ;;
  status)
    status
    ;;
  *) usage ;;
esac
