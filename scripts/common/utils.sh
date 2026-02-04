#!/usr/bin/env bash
# scripts/common/utils.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

debug_log() {
  if [ "$DEBUG_MODE" == "1" ]; then
    echo -e "${GRAY}[DEBUG] $1${NC}" >&2
  fi
}

check_port_available() {
  local port=$1
  if lsof -ti:$port >/dev/null 2>&1; then
    return 1  # Port is in use
  else
    return 0  # Port is available
  fi
}

cleanup_orphan_pids() {
  local pid_files=("$PID_FILE_BACKEND" "$PID_FILE_FRONTEND" "$PID_FILE_FRONTEND_ADMIN" "$PID_FILE_WORKER")
  
  for pid_file in "${pid_files[@]}"; do
    if [ -f "$pid_file" ]; then
      local pid=$(cat "$pid_file")
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        debug_log "Removing orphan PID file: $pid_file"
        rm -f "$pid_file"
      fi
    fi
  done
}

graceful_kill() {
  local pid=$1
  local service_name=$2
  local timeout=${3:-10}
  
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    debug_log "$service_name (PID $pid) already stopped"
    return 0
  fi
  
  debug_log "Sending SIGTERM to $service_name (PID $pid)"
  kill -TERM "$pid" 2>/dev/null || true
  
  local waited=0
  while [ $waited -lt $timeout ]; do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      debug_log "$service_name stopped gracefully after ${waited}s"
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  
  debug_log "$service_name didn't stop gracefully, sending SIGKILL"
  kill -KILL "$pid" 2>/dev/null || true
  sleep 1
  
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    debug_log "$service_name force-killed successfully"
    return 0
  else
    echo -e "${RED}❌ Failed to kill $service_name (PID $pid)${NC}"
    return 1
  fi
}
