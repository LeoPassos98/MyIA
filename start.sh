#!/usr/bin/env bash
# start.sh - script simples para iniciar/parar o backend (e opcionalmente frontend)
# Local: /workspaces/MyIA
# Uso: ./start.sh [start|stop|restart|status] [backend|frontend|both]

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

usage() {
  echo "Usage: $0 {start|stop|restart|status} {backend|frontend|both}" >&2
  exit 1
}

ensure_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js não encontrado no PATH. Instale o Node.js para prosseguir." >&2
    exit 2
  fi
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
    echo "Matando processos na porta $port: $pids"
    for pid in $pids; do
      kill_process_tree "$pid"
    done
  fi
}

start_backend() {
  ensure_node
  
  # Limpar porta antes de iniciar
  kill_port $BACKEND_PORT
  
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo "Backend já em execução (PID $(cat "$PID_FILE_BACKEND"))."; return
  fi
  
  echo "Iniciando backend na porta $BACKEND_PORT...";
  (cd "$BACKEND_DIR" && npm run dev) >"$OUT_LOG_BACKEND" 2>"$ERR_LOG_BACKEND" &
  echo $! >"$PID_FILE_BACKEND"
  echo "Backend iniciado com PID $(cat "$PID_FILE_BACKEND")";
}

stop_backend() {
  echo "Parando backend..."
  
  # Matar processos na porta
  kill_port $BACKEND_PORT
  
  # Matar processo pelo PID file
  if [ -f "$PID_FILE_BACKEND" ]; then
    PID=$(cat "$PID_FILE_BACKEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo "Matando árvore de processos do backend (PID $PID)..."
      kill_process_tree "$PID"
    fi
    rm -f "$PID_FILE_BACKEND"
  fi
  
  echo "Backend parado."
}

start_frontend() {
  ensure_node
  
  # Limpar porta antes de iniciar
  kill_port $FRONTEND_PORT
  
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo "Frontend já em execução (PID $(cat "$PID_FILE_FRONTEND"))."; return
  fi
  
  echo "Iniciando frontend na porta $FRONTEND_PORT...";
  (cd "$FRONTEND_DIR" && npm run dev) >"$OUT_LOG_FRONTEND" 2>"$ERR_LOG_FRONTEND" &
  echo $! >"$PID_FILE_FRONTEND"
  echo "Frontend iniciado com PID $(cat "$PID_FILE_FRONTEND")";
}

stop_frontend() {
  echo "Parando frontend..."
  
  # Matar processos na porta
  kill_port $FRONTEND_PORT
  
  # Matar processo pelo PID file
  if [ -f "$PID_FILE_FRONTEND" ]; then
    PID=$(cat "$PID_FILE_FRONTEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo "Matando árvore de processos do frontend (PID $PID)..."
      kill_process_tree "$PID"
    fi
    rm -f "$PID_FILE_FRONTEND"
  fi
  
  echo "Frontend parado."
}

status() {
  # Status Backend
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo "Backend em execução (PID $(cat "$PID_FILE_BACKEND"))."
  else
    echo "Backend parado."
  fi
  
  # Verificar porta do backend
  local backend_port_pids=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
  if [ -n "$backend_port_pids" ]; then
    echo "  ⚠️  Porta $BACKEND_PORT ocupada por: $backend_port_pids"
  fi
  
  # Status Frontend
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo "Frontend em execução (PID $(cat "$PID_FILE_FRONTEND"))."
  else
    echo "Frontend parado."
  fi
  
  # Verificar porta do frontend
  local frontend_port_pids=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
  if [ -n "$frontend_port_pids" ]; then
    echo "  ⚠️  Porta $FRONTEND_PORT ocupada por: $frontend_port_pids"
  fi
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
      both) start_backend; start_frontend ;;
      *) usage ;;
    esac
    ;;
  stop)
    case "$TARGET" in
      backend) stop_backend ;; 
      frontend) stop_frontend ;; 
      both) stop_backend; stop_frontend ;;
      *) usage ;;
    esac
    ;;
  restart)
    case "$TARGET" in
      backend) stop_backend; start_backend ;; 
      frontend) stop_frontend; start_frontend ;; 
      both) stop_backend; stop_frontend; start_backend; start_frontend ;;
      *) usage ;;
    esac
    ;;
  status)
    status
    ;;
  *) usage ;;
esac
