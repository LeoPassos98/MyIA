#!/usr/bin/env bash
# scripts/common/config.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

# Diretórios
export ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export BACKEND_DIR="$ROOT_DIR/backend"
export FRONTEND_DIR="$ROOT_DIR/frontend"
export FRONTEND_ADMIN_DIR="$ROOT_DIR/frontend-admin"
export LOG_DIR="$ROOT_DIR/logs"

# Portas
export REDIS_PORT=6379
export BACKEND_PORT=3001
export FRONTEND_PORT=3000
export FRONTEND_ADMIN_PORT=3003
export WORKER_HEALTH_PORT=3004
export GRAFANA_PORT=3002

# Arquivos de PID
export PID_FILE_BACKEND="$LOG_DIR/backend.pid"
export PID_FILE_FRONTEND="$LOG_DIR/frontend.pid"
export PID_FILE_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.pid"
export PID_FILE_WORKER="$LOG_DIR/worker.pid"

# Arquivos de Log
export OUT_LOG_WORKER="$LOG_DIR/worker.out.log"
export ERR_LOG_WORKER="$LOG_DIR/worker.err.log"
export OUT_LOG_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.out.log"
export ERR_LOG_FRONTEND_ADMIN="$LOG_DIR/frontend-admin.err.log"

# Debug mode
export DEBUG_MODE=${DEBUG_MODE:-0}

# Arrays globais (declare -gA para Bash 4+)
declare -gA SELECTED
declare -gA PROGRESS
declare -gA STATUS
declare -gA RUNNING_STATUS
