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

start_backend() {
  ensure_node
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo "Backend já em execução (PID $(cat "$PID_FILE_BACKEND"))."; return
  fi
  echo "Iniciando backend...";
  (cd "$BACKEND_DIR" && npm run dev) >"$OUT_LOG_BACKEND" 2>"$ERR_LOG_BACKEND" &
  echo $! >"$PID_FILE_BACKEND"
  echo "Backend iniciado com PID $(cat "$PID_FILE_BACKEND")";
}

stop_backend() {
  if [ -f "$PID_FILE_BACKEND" ]; then
    PID=$(cat "$PID_FILE_BACKEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo "Parando backend (PID $PID)..."
      kill "$PID" || true
      sleep 1
      if kill -0 "$PID" >/dev/null 2>&1; then
        echo "Forçando kill..."
        kill -9 "$PID" || true
      fi
    else
      echo "PID $PID não está em execução. Removendo PID file.";
    fi
    rm -f "$PID_FILE_BACKEND"
  else
    echo "Backend não está rodando (nenhum PID encontrado)."
  fi
}

start_frontend() {
  ensure_node
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo "Frontend já em execução (PID $(cat "$PID_FILE_FRONTEND"))."; return
  fi
  echo "Iniciando frontend...";
  (cd "$FRONTEND_DIR" && npm run dev) >"$OUT_LOG_FRONTEND" 2>"$ERR_LOG_FRONTEND" &
  echo $! >"$PID_FILE_FRONTEND"
  echo "Frontend iniciado com PID $(cat "$PID_FILE_FRONTEND")";
}

stop_frontend() {
  if [ -f "$PID_FILE_FRONTEND" ]; then
    PID=$(cat "$PID_FILE_FRONTEND")
    if kill -0 "$PID" >/dev/null 2>&1; then
      echo "Parando frontend (PID $PID)..."
      kill "$PID" || true
      sleep 1
      if kill -0 "$PID" >/dev/null 2>&1; then
        echo "Forçando kill..."
        kill -9 "$PID" || true
      fi
    else
      echo "PID $PID não está em execução. Removendo PID file.";
    fi
    rm -f "$PID_FILE_FRONTEND"
  else
    echo "Frontend não está rodando (nenhum PID encontrado)."
  fi
}

status() {
  if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
    echo "Backend em execução (PID $(cat "$PID_FILE_BACKEND"))."
  else
    echo "Backend parado."
  fi
  if [ -f "$PID_FILE_FRONTEND" ] && kill -0 "$(cat "$PID_FILE_FRONTEND")" >/dev/null 2>&1; then
    echo "Frontend em execução (PID $(cat "$PID_FILE_FRONTEND"))."
  else
    echo "Frontend parado."
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
