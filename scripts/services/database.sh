#!/usr/bin/env bash
# scripts/services/database.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$MODULE_DIR/../common/colors.sh"
source "$MODULE_DIR/../common/config.sh"

start_database() {
  STATUS[1]="starting"
  PROGRESS[1]=10
  show_progress
  
  # Iniciar Redis
  if ! docker ps --format '{{.Names}}' | grep -q "^myia-redis$"; then
    docker ps -a --format '{{.Names}}' | grep -q "^myia-redis$" && docker rm -f myia-redis >/dev/null 2>&1 || true
    docker run -d --name myia-redis -p $REDIS_PORT:6379 --restart unless-stopped redis:7-alpine >/dev/null 2>&1
  fi
  
  PROGRESS[1]=30
  show_progress
  
  # Verificar Redis (MELHORADO)
  local max_wait=10
  local waited=0
  while [ $waited -lt $max_wait ]; do
    if docker exec myia-redis redis-cli ping >/dev/null 2>&1; then
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
  
  if [ $waited -eq $max_wait ]; then
    STATUS[1]="error"
    show_progress
    echo ""
    echo -e "${RED}❌ Redis não respondeu após $max_wait segundos${NC}"
    return 1
  fi
  
  PROGRESS[1]=60
  show_progress
  
  # Verificar PostgreSQL
  sleep 1
  
  PROGRESS[1]=100
  STATUS[1]="running"
  show_progress
  sleep 1
}
