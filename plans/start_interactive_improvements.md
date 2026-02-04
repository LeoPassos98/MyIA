# 🔧 Plano de Melhorias: start_interactive.sh

> **Análise Completa:** Identificação de melhorias para o script de gerenciamento interativo de serviços MyIA

---

## 📊 Resumo Executivo

O script [`start_interactive.sh`](../start_interactive.sh) está **funcional e completo**, incluindo suporte ao Worker. No entanto, foram identificadas **23 melhorias** distribuídas em 6 categorias, priorizadas por impacto e complexidade.

---

## 🎯 Melhorias Identificadas

### 🔴 **Categoria 1: Robustez e Validação** (CRÍTICO)

#### 1.1 Validação de Pré-requisitos
**Problema:** Script não verifica se ferramentas necessárias estão instaladas  
**Impacto:** Falhas silenciosas ou mensagens de erro confusas  
**Complexidade:** Baixa

**Solução:**
```bash
check_prerequisites() {
  local missing=()
  
  # Verificar Docker
  if ! command -v docker &>/dev/null; then
    missing+=("Docker")
  fi
  
  # Verificar npm
  if ! command -v npm &>/dev/null; then
    missing+=("npm")
  fi
  
  # Verificar Node.js (versão mínima 18)
  if ! command -v node &>/dev/null; then
    missing+=("Node.js")
  else
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
      echo -e "${RED}❌ Node.js versão 18+ necessária (atual: v$node_version)${NC}"
      exit 1
    fi
  fi
  
  # Verificar lsof
  if ! command -v lsof &>/dev/null; then
    missing+=("lsof")
  fi
  
  if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${RED}❌ Ferramentas ausentes: ${missing[*]}${NC}"
    echo -e "${YELLOW}Instale as dependências e tente novamente.${NC}"
    exit 1
  fi
}
```

**Onde adicionar:** Chamar no início da função `main()` (linha 700)

---

#### 1.2 Validação de Diretórios e Arquivos
**Problema:** Script assume que diretórios existem sem verificar  
**Impacto:** Erro ao tentar `cd` em diretório inexistente  
**Complexidade:** Baixa

**Solução:**
```bash
validate_directories() {
  local dirs=(
    "$BACKEND_DIR"
    "$FRONTEND_DIR"
    "$FRONTEND_ADMIN_DIR"
    "$OBSERVABILITY_DIR"
  )
  
  for dir in "${dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      echo -e "${RED}❌ Diretório não encontrado: $dir${NC}"
      exit 1
    fi
  done
  
  # Verificar package.json
  if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo -e "${RED}❌ Backend package.json não encontrado${NC}"
    exit 1
  fi
  
  # Verificar node_modules
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend node_modules não encontrado. Execute 'npm install' primeiro.${NC}"
    read -p "Deseja instalar agora? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      (cd "$BACKEND_DIR" && npm install)
    else
      exit 1
    fi
  fi
}
```

**Onde adicionar:** Chamar após `check_prerequisites()` em `main()`

---

#### 1.3 Verificação de Portas Disponíveis
**Problema:** Não verifica se portas já estão em uso antes de iniciar  
**Impacto:** Conflito de portas, serviço não inicia  
**Complexidade:** Média

**Solução:**
```bash
check_port_available() {
  local port=$1
  local service=$2
  
  if lsof -ti:$port >/dev/null 2>&1; then
    local pid=$(lsof -ti:$port)
    echo -e "${YELLOW}⚠️  Porta $port já está em uso (PID $pid)${NC}"
    echo -e "${CYAN}Serviço: $service${NC}"
    read -p "Deseja parar o processo existente? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
      kill $pid 2>/dev/null || true
      sleep 2
      return 0
    else
      return 1
    fi
  fi
  return 0
}
```

**Onde usar:** Antes de iniciar cada serviço

---

#### 1.4 Validação de Variáveis de Ambiente
**Problema:** Não verifica se `.env` existe ou se variáveis críticas estão definidas  
**Impacto:** Serviços falham silenciosamente por falta de configuração  
**Complexidade:** Baixa

**Solução:**
```bash
validate_env_files() {
  # Backend .env
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env não encontrado${NC}"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
      echo -e "${CYAN}Copiando .env.example para .env...${NC}"
      cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
      echo -e "${YELLOW}⚠️  Configure as variáveis em $BACKEND_DIR/.env${NC}"
      read -p "Pressione ENTER após configurar..."
    else
      echo -e "${RED}❌ .env.example também não encontrado${NC}"
      exit 1
    fi
  fi
  
  # Verificar variáveis críticas
  source "$BACKEND_DIR/.env"
  local required_vars=("DATABASE_URL" "JWT_SECRET")
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      echo -e "${RED}❌ Variável $var não definida em .env${NC}"
      exit 1
    fi
  done
}
```

---

### 🟠 **Categoria 2: Health Checks e Verificações** (ALTA PRIORIDADE)

#### 2.1 Health Check do Worker (Porta 3004)
**Problema:** Worker usa apenas `sleep 3`, não verifica se realmente iniciou  
**Impacto:** Falso positivo (mostra como rodando mas pode ter falhado)  
**Complexidade:** Baixa

**Solução:**
```bash
start_worker_service() {
  STATUS[5]="starting"
  PROGRESS[5]=10
  show_progress
  
  # Verificar se já está rodando
  if [ -f "$PID_FILE_WORKER" ] && kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
    PROGRESS[5]=100
    STATUS[5]="running"
    show_progress
    return 0
  fi
  
  PROGRESS[5]=30
  show_progress
  
  # Iniciar worker
  (cd "$BACKEND_DIR" && npm run worker:dev) >"$OUT_LOG_WORKER" 2>"$ERR_LOG_WORKER" &
  echo $! >"$PID_FILE_WORKER"
  
  PROGRESS[5]=60
  show_progress
  
  # Aguardar inicialização (MELHORADO)
  local max_wait=30
  local waited=0
  while [ $waited -lt $max_wait ]; do
    # Verificar se porta está respondendo
    if lsof -ti:$WORKER_HEALTH_PORT >/dev/null 2>&1; then
      PROGRESS[5]=100
      STATUS[5]="running"
      show_progress
      return 0
    fi
    
    # Verificar se processo ainda está vivo
    if ! kill -0 "$(cat "$PID_FILE_WORKER")" >/dev/null 2>&1; then
      STATUS[5]="error"
      show_progress
      echo ""
      echo -e "${RED}❌ Worker falhou ao iniciar. Últimas linhas do log:${NC}"
      tail -n 5 "$ERR_LOG_WORKER"
      return 1
    fi
    
    sleep 1
    waited=$((waited + 1))
    PROGRESS[5]=$((60 + waited * 40 / max_wait))
    show_progress
  done
  
  STATUS[5]="error"
  show_progress
}
```

---

#### 2.2 Health Check do Database (Redis + PostgreSQL)
**Problema:** Apenas faz `sleep`, não valida se serviços estão acessíveis  
**Impacto:** Falso positivo, serviços dependentes falham depois  
**Complexidade:** Média

**Solução:**
```bash
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
    echo -e "${RED}❌ Redis não respondeu após $max_wait segundos${NC}"
    return 1
  fi
  
  PROGRESS[1]=60
  show_progress
  
  # Verificar PostgreSQL (MELHORADO)
  waited=0
  while [ $waited -lt $max_wait ]; do
    if lsof -ti:$POSTGRES_PORT >/dev/null 2>&1; then
      # Tentar conexão real
      if psql -U leonardo -h localhost -d myia -c "SELECT 1" >/dev/null 2>&1; then
        break
      fi
    fi
    sleep 1
    waited=$((waited + 1))
  done
  
  if [ $waited -eq $max_wait ]; then
    echo -e "${YELLOW}⚠️  PostgreSQL não respondeu (pode não estar configurado)${NC}"
  fi
  
  PROGRESS[1]=100
  STATUS[1]="running"
  show_progress
  sleep 1
}
```

---

#### 2.3 Padronização de Health Checks
**Problema:** Cada serviço usa método diferente (lsof, curl, sleep)  
**Impacto:** Inconsistência, dificulta manutenção  
**Complexidade:** Média

**Solução:**
```bash
# Função genérica de health check
wait_for_port() {
  local port=$1
  local service_name=$2
  local max_wait=${3:-30}
  local pid_file=$4
  
  local waited=0
  while [ $waited -lt $max_wait ]; do
    # Verificar se porta está aberta
    if lsof -ti:$port >/dev/null 2>&1; then
      return 0
    fi
    
    # Se PID fornecido, verificar se processo ainda está vivo
    if [ -n "$pid_file" ] && [ -f "$pid_file" ]; then
      if ! kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
        echo -e "${RED}❌ $service_name morreu durante inicialização${NC}"
        return 1
      fi
    fi
    
    sleep 1
    waited=$((waited + 1))
  done
  
  echo -e "${RED}❌ $service_name não respondeu após $max_wait segundos${NC}"
  return 1
}

# Usar em todos os serviços:
# if wait_for_port $BACKEND_PORT "Backend" 30 "$PID_FILE_BACKEND"; then
#   STATUS[2]="running"
# else
#   STATUS[2]="error"
# fi
```

---

### 🟡 **Categoria 3: Tratamento de Erros e Recuperação** (ALTA PRIORIDADE)

#### 3.1 Mostrar Logs de Erro ao Falhar
**Problema:** Quando serviço falha, usuário não sabe o motivo  
**Impacto:** Dificulta diagnóstico  
**Complexidade:** Baixa

**Solução:**
```bash
show_error_logs() {
  local service_name=$1
  local error_log=$2
  
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ $service_name falhou ao iniciar${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if [ -f "$error_log" ] && [ -s "$error_log" ]; then
    echo -e "${YELLOW}Últimas 10 linhas do log de erro:${NC}"
    echo ""
    tail -n 10 "$error_log" | sed 's/^/  /'
  else
    echo -e "${GRAY}(Nenhum log de erro disponível)${NC}"
  fi
  
  echo ""
  echo -e "${CYAN}💡 Sugestões:${NC}"
  echo -e "  • Verifique se as dependências estão instaladas: ${WHITE}cd $BACKEND_DIR && npm install${NC}"
  echo -e "  • Verifique o arquivo .env: ${WHITE}cat $BACKEND_DIR/.env${NC}"
  echo -e "  • Veja o log completo: ${WHITE}cat $error_log${NC}"
  echo ""
}

# Usar quando STATUS="error":
# if [[ "${STATUS[2]}" == "error" ]]; then
#   show_error_logs "Backend" "$LOG_DIR/backend.err.log"
# fi
```

---

#### 3.2 Graceful Shutdown (SIGTERM → SIGKILL)
**Problema:** Usa `kill` direto, não dá tempo do processo limpar recursos  
**Impacto:** Pode deixar arquivos corrompidos, conexões abertas  
**Complexidade:** Média

**Solução:**
```bash
graceful_kill() {
  local pid=$1
  local service_name=$2
  local timeout=${3:-10}
  
  if ! kill -0 $pid >/dev/null 2>&1; then
    echo -e "${GRAY}$service_name já estava parado${NC}"
    return 0
  fi
  
  echo -e "${BLUE}Parando $service_name (PID $pid)...${NC}"
  
  # Enviar SIGTERM
  kill -TERM $pid 2>/dev/null || true
  
  # Aguardar até timeout
  local waited=0
  while [ $waited -lt $timeout ]; do
    if ! kill -0 $pid >/dev/null 2>&1; then
      echo -e "${GREEN}✓ $service_name parado gracefully${NC}"
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  
  # Se não parou, forçar SIGKILL
  echo -e "${YELLOW}⚠️  $service_name não respondeu, forçando parada...${NC}"
  kill -9 $pid 2>/dev/null || true
  sleep 1
  
  if ! kill -0 $pid >/dev/null 2>&1; then
    echo -e "${GREEN}✓ $service_name parado (forçado)${NC}"
    return 0
  else
    echo -e "${RED}❌ Falha ao parar $service_name${NC}"
    return 1
  fi
}

# Usar em stop_all_services:
# if [ -f "$PID_FILE_BACKEND" ]; then
#   graceful_kill "$(cat "$PID_FILE_BACKEND")" "Backend" 10
#   rm -f "$PID_FILE_BACKEND"
# fi
```

---

#### 3.3 Rollback em Caso de Falha
**Problema:** Se um serviço falha, os anteriores continuam rodando  
**Impacto:** Estado inconsistente do sistema  
**Complexidade:** Alta

**Solução:**
```bash
start_selected_services() {
  # Resetar status
  for i in {1..6}; do
    if [[ "${SELECTED[$i]}" == "1" ]]; then
      STATUS[$i]="pending"
      PROGRESS[$i]=0
    fi
  done
  
  show_progress
  sleep 1
  
  # Array para rastrear serviços iniciados (para rollback)
  local started_services=()
  
  # Iniciar serviços na ordem
  if [[ "${SELECTED[1]}" == "1" ]]; then
    if start_database; then
      started_services+=(1)
    else
      rollback_services "${started_services[@]}"
      return 1
    fi
  fi
  
  if [[ "${SELECTED[2]}" == "1" ]]; then
    if start_backend_service; then
      started_services+=(2)
    else
      rollback_services "${started_services[@]}"
      return 1
    fi
  fi
  
  # ... repetir para outros serviços
  
  show_completion_summary
}

rollback_services() {
  local services=("$@")
  
  echo ""
  echo -e "${YELLOW}⚠️  Revertendo serviços iniciados...${NC}"
  
  for service_id in "${services[@]}"; do
    case $service_id in
      1) stop_database ;;
      2) stop_backend ;;
      3) stop_frontend ;;
      4) stop_frontend_admin ;;
      5) stop_worker ;;
      6) stop_grafana ;;
    esac
  done
  
  echo -e "${RED}❌ Inicialização abortada devido a falhas${NC}"
}
```

---

#### 3.4 Limpar PIDs Órfãos
**Problema:** Se processo morrer, PID file fica órfão  
**Impacto:** Script pensa que serviço está rodando quando não está  
**Complexidade:** Baixa

**Solução:**
```bash
cleanup_orphan_pids() {
  local pid_files=(
    "$PID_FILE_BACKEND"
    "$PID_FILE_FRONTEND"
    "$PID_FILE_WORKER"
    "$PID_FILE_FRONTEND_ADMIN"
  )
  
  for pid_file in "${pid_files[@]}"; do
    if [ -f "$pid_file" ]; then
      local pid=$(cat "$pid_file")
      if ! kill -0 $pid >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Removendo PID órfão: $pid_file (PID $pid)${NC}"
        rm -f "$pid_file"
      fi
    fi
  done
}

# Chamar no início de main():
# cleanup_orphan_pids
```

---

### 🔵 **Categoria 4: Usabilidade e UX** (MÉDIA PRIORIDADE)

#### 4.1 Opção "Reiniciar Serviço Específico"
**Problema:** Só pode parar todos ou iniciar, não reiniciar um específico  
**Impacto:** Inconveniente durante desenvolvimento  
**Complexidade:** Média

**Solução:**
```bash
# Adicionar no menu:
echo -e " [ ] ${BLUE}r.${NC} Reiniciar Serviço Específico"

# Adicionar função:
restart_service_menu() {
  clear_screen
  echo -e "${CYAN}Selecione o serviço para reiniciar:${NC}"
  echo ""
  echo -e " ${BLUE}1.${NC} Backend"
  echo -e " ${BLUE}2.${NC} Frontend"
  echo -e " ${BLUE}3.${NC} Frontend Admin"
  echo -e " ${BLUE}4.${NC} Worker"
  echo -e " ${BLUE}5.${NC} Grafana"
  echo -e " ${BLUE}0.${NC} Voltar"
  echo ""
  read -p "Opção: " option
  
  case "$option" in
    1) restart_backend ;;
    2) restart_frontend ;;
    3) restart_frontend_admin ;;
    4) restart_worker ;;
    5) restart_grafana ;;
  esac
}

restart_backend() {
  echo -e "${YELLOW}Reiniciando Backend...${NC}"
  if [ -f "$PID_FILE_BACKEND" ]; then
    graceful_kill "$(cat "$PID_FILE_BACKEND")" "Backend"
    rm -f "$PID_FILE_BACKEND"
  fi
  sleep 2
  start_backend_service
  echo ""
  read -p "Pressione ENTER para continuar..."
}
```

---

#### 4.2 Opção "Ver Logs em Tempo Real"
**Problema:** Não há forma fácil de ver logs durante execução  
**Impacto:** Dificulta debug  
**Complexidade:** Baixa

**Solução:**
```bash
# Adicionar no menu:
echo -e " [ ] ${BLUE}l.${NC} Ver Logs"

# Adicionar função:
view_logs_menu() {
  clear_screen
  echo -e "${CYAN}Selecione o serviço para ver logs:${NC}"
  echo ""
  echo -e " ${BLUE}1.${NC} Backend (stdout)"
  echo -e " ${BLUE}2.${NC} Backend (stderr)"
  echo -e " ${BLUE}3.${NC} Frontend (stdout)"
  echo -e " ${BLUE}4.${NC} Frontend (stderr)"
  echo -e " ${BLUE}5.${NC} Worker (stdout)"
  echo -e " ${BLUE}6.${NC} Worker (stderr)"
  echo -e " ${BLUE}0.${NC} Voltar"
  echo ""
  read -p "Opção: " option
  
  case "$option" in
    1) tail -f "$LOG_DIR/backend.out.log" ;;
    2) tail -f "$LOG_DIR/backend.err.log" ;;
    3) tail -f "$LOG_DIR/frontend.out.log" ;;
    4) tail -f "$LOG_DIR/frontend.err.log" ;;
    5) tail -f "$OUT_LOG_WORKER" ;;
    6) tail -f "$ERR_LOG_WORKER" ;;
  esac
}
```

---

#### 4.3 Mostrar Uptime e URLs no Status
**Problema:** Status só mostra "Rodando" ou "Parado", sem detalhes  
**Impacto:** Falta informação útil  
**Complexidade:** Média

**Solução:**
```bash
get_uptime() {
  local pid=$1
  
  if ! kill -0 $pid >/dev/null 2>&1; then
    echo "N/A"
    return
  fi
  
  # Obter tempo de início do processo
  local start_time=$(ps -p $pid -o lstart= 2>/dev/null)
  if [ -z "$start_time" ]; then
    echo "N/A"
    return
  fi
  
  local start_epoch=$(date -d "$start_time" +%s 2>/dev/null || echo "0")
  local now_epoch=$(date +%s)
  local uptime_seconds=$((now_epoch - start_epoch))
  
  # Formatar uptime
  local hours=$((uptime_seconds / 3600))
  local minutes=$(((uptime_seconds % 3600) / 60))
  local seconds=$((uptime_seconds % 60))
  
  if [ $hours -gt 0 ]; then
    echo "${hours}h ${minutes}m"
  elif [ $minutes -gt 0 ]; then
    echo "${minutes}m ${seconds}s"
  else
    echo "${seconds}s"
  fi
}

# Modificar show_status:
echo -ne "${BLUE}Backend (porta $BACKEND_PORT):${NC} "
if [ -f "$PID_FILE_BACKEND" ] && kill -0 "$(cat "$PID_FILE_BACKEND")" >/dev/null 2>&1; then
  local pid=$(cat "$PID_FILE_BACKEND")
  local uptime=$(get_uptime $pid)
  echo -e "${GREEN}✓ Rodando${NC} (PID $pid, uptime: $uptime)"
  echo -e "   ${CYAN}→ http://localhost:$BACKEND_PORT${NC}"
else
  echo -e "${GRAY}○ Parado${NC}"
fi
```

---

#### 4.4 Salvar/Carregar Perfis de Inicialização
**Problema:** Usuário precisa selecionar serviços toda vez  
**Impacto:** Repetitivo para configurações comuns  
**Complexidade:** Média

**Solução:**
```bash
PROFILES_DIR="$ROOT_DIR/.profiles"
mkdir -p "$PROFILES_DIR"

save_profile() {
  echo ""
  read -p "Nome do perfil: " profile_name
  
  if [ -z "$profile_name" ]; then
    echo -e "${RED}Nome inválido${NC}"
    return
  fi
  
  local profile_file="$PROFILES_DIR/${profile_name}.profile"
  
  # Salvar seleções
  for i in {1..6}; do
    echo "${i}=${SELECTED[$i]}" >> "$profile_file"
  done
  
  echo -e "${GREEN}✓ Perfil '$profile_name' salvo${NC}"
  sleep 2
}

load_profile() {
  local profiles=($(ls "$PROFILES_DIR"/*.profile 2>/dev/null))
  
  if [ ${#profiles[@]} -eq 0 ]; then
    echo -e "${YELLOW}Nenhum perfil salvo${NC}"
    sleep 2
    return
  fi
  
  clear_screen
  echo -e "${CYAN}Perfis disponíveis:${NC}"
  echo ""
  
  local idx=1
  for profile in "${profiles[@]}"; do
    local name=$(basename "$profile" .profile)
    echo -e " ${BLUE}$idx.${NC} $name"
    idx=$((idx + 1))
  done
  
  echo ""
  read -p "Selecione o perfil (0 para cancelar): " option
  
  if [ "$option" -eq 0 ]; then
    return
  fi
  
  local selected_profile="${profiles[$((option - 1))]}"
  
  if [ -f "$selected_profile" ]; then
    source "$selected_profile"
    echo -e "${GREEN}✓ Perfil carregado${NC}"
    sleep 2
  fi
}

# Adicionar no menu:
echo -e " [ ] ${BLUE}s.${NC} Salvar Perfil"
echo -e " [ ] ${BLUE}p.${NC} Carregar Perfil"
```

---

### 🟢 **Categoria 5: Manutenibilidade** (MÉDIA PRIORIDADE)

#### 5.1 Rotação Automática de Logs
**Problema:** Logs crescem indefinidamente  
**Impacto:** Pode encher disco  
**Complexidade:** Média

**Solução:**
```bash
rotate_logs() {
  local max_size_mb=50
  local max_files=5
  
  for log_file in "$LOG_DIR"/*.log; do
    if [ ! -f "$log_file" ]; then
      continue
    fi
    
    local size_mb=$(du -m "$log_file" | cut -f1)
    
    if [ "$size_mb" -gt "$max_size_mb" ]; then
      echo -e "${YELLOW}⚠️  Rotacionando log: $(basename "$log_file") (${size_mb}MB)${NC}"
      
      # Rotacionar arquivos existentes
      for i in $(seq $((max_files - 1)) -1 1); do
        if [ -f "${log_file}.$i" ]; then
          mv "${log_file}.$i" "${log_file}.$((i + 1))"
        fi
      done
      
      # Mover log atual
      mv "$log_file" "${log_file}.1"
      
      # Deletar logs muito antigos
      if [ -f "${log_file}.$max_files" ]; then
        rm -f "${log_file}.$max_files"
      fi
    fi
  done
}

# Chamar no início de main():
# rotate_logs
```

---

#### 5.2 Validar Dependências Entre Serviços
**Problema:** Frontend pode iniciar antes do Backend estar pronto  
**Impacto:** Erros de conexão iniciais  
**Complexidade:** Baixa

**Solução:**
```bash
# Modificar start_selected_services para respeitar ordem:
start_selected_services() {
  # ... código existente ...
  
  # Ordem obrigatória:
  # 1. Database (se selecionado)
  # 2. Backend (se selecionado)
  # 3. Worker (se selecionado, depende de Backend)
  # 4. Frontend (se selecionado, depende de Backend)
  # 5. Frontend Admin (se selecionado, depende de Backend)
  # 6. Grafana (independente)
  
  # Validar dependências
  if [[ "${SELECTED[2]}" == "1" ]] && [[ "${SELECTED[1]}" != "1" ]]; then
    echo -e "${YELLOW}⚠️  Backend requer Database. Habilitando Database automaticamente...${NC}"
    SELECTED[1]=1
    sleep 2
  fi
  
  if [[ "${SELECTED[5]}" == "1" ]] && [[ "${SELECTED[2]}" != "1" ]]; then
    echo -e "${YELLOW}⚠️  Worker requer Backend. Habilitando Backend automaticamente...${NC}"
    SELECTED[2]=1
    sleep 2
  fi
  
  # ... continuar com inicialização
}
```

---

#### 5.3 Modo Verbose/Debug
**Problema:** Difícil diagnosticar problemas sem logs detalhados  
**Impacto:** Troubleshooting lento  
**Complexidade:** Baixa

**Solução:**
```bash
# Adicionar variável global
DEBUG_MODE=0

# Adicionar opção no menu ou argumento CLI:
# ./start_interactive.sh --debug

# Função de log debug
debug_log() {
  if [ "$DEBUG_MODE" -eq 1 ]; then
    echo -e "${GRAY}[DEBUG] $*${NC}" >&2
  fi
}

# Usar em funções críticas:
start_backend_service() {
  debug_log "Iniciando backend em $BACKEND_DIR"
  debug_log "PID file: $PID_FILE_BACKEND"
  debug_log "Comando: cd $BACKEND_DIR && npm run dev"
  
  # ... resto do código
}
```

---

### 🟣 **Categoria 6: Performance** (BAIXA PRIORIDADE)

#### 6.1 Otimizar Chamadas a show_progress
**Problema:** `show_progress` é chamado múltiplas vezes seguidas  
**Impacto:** Flickering visual, uso desnecessário de CPU  
**Complexidade:** Baixa

**Solução:**
```bash
# Adicionar debounce
LAST_PROGRESS_UPDATE=0

show_progress_debounced() {
  local now=$(date +%s%N | cut -b1-13)  # milliseconds
  local diff=$((now - LAST_PROGRESS_UPDATE))
  
  # Atualizar no máximo a cada 100ms
  if [ $diff -lt 100 ]; then
    return
  fi
  
  LAST_PROGRESS_UPDATE=$now
  show_progress
}

# Usar show_progress_debounced em loops
```

---

#### 6.2 Paralelizar Verificações de Porta
**Problema:** Verificações são sequenciais  
**Impacto:** Inicialização mais lenta  
**Complexidade:** Alta

**Solução:**
```bash
# Iniciar serviços em paralelo (com cuidado nas dependências)
start_independent_services() {
  # Frontend e Frontend Admin podem iniciar em paralelo
  if [[ "${SELECTED[3]}" == "1" ]]; then
    start_frontend_service &
    local pid_frontend=$!
  fi
  
  if [[ "${SELECTED[4]}" == "1" ]]; then
    start_frontend_admin_service &
    local pid_frontend_admin=$!
  fi
  
  # Aguardar ambos terminarem
  if [ -n "$pid_frontend" ]; then
    wait $pid_frontend
  fi
  
  if [ -n "$pid_frontend_admin" ]; then
    wait $pid_frontend_admin
  fi
}
```

---

## 📋 Resumo de Prioridades

### 🔴 **CRÍTICO** (Implementar Primeiro)
1. ✅ Validação de pré-requisitos (Docker, npm, Node.js)
2. ✅ Validação de diretórios e arquivos
3. ✅ Verificação de portas disponíveis
4. ✅ Validação de variáveis de ambiente

### 🟠 **ALTA PRIORIDADE** (Implementar em Seguida)
5. ✅ Health check do Worker (porta 3004)
6. ✅ Health check do Database (Redis + PostgreSQL)
7. ✅ Padronização de health checks
8. ✅ Mostrar logs de erro ao falhar
9. ✅ Graceful shutdown (SIGTERM → SIGKILL)
10. ✅ Limpar PIDs órfãos

### 🟡 **MÉDIA PRIORIDADE** (Melhorias de UX)
11. ✅ Opção "Reiniciar serviço específico"
12. ✅ Opção "Ver logs em tempo real"
13. ✅ Mostrar uptime e URLs no status
14. ✅ Salvar/carregar perfis de inicialização
15. ✅ Rotação automática de logs
16. ✅ Validar dependências entre serviços
17. ✅ Modo verbose/debug

### 🟢 **BAIXA PRIORIDADE** (Otimizações)
18. ✅ Rollback em caso de falha
19. ✅ Otimizar chamadas a show_progress
20. ✅ Paralelizar verificações de porta

---

## 🎯 Plano de Implementação

### **Fase 1: Fundação Sólida** (1-2 dias)
- [ ] Implementar `check_prerequisites()`
- [ ] Implementar `validate_directories()`
- [ ] Implementar `validate_env_files()`
- [ ] Implementar `check_port_available()`
- [ ] Implementar `cleanup_orphan_pids()`

### **Fase 2: Health Checks Robustos** (1 dia)
- [ ] Melhorar `start_worker_service()` com verificação de porta
- [ ] Melhorar `start_database()` com verificação de Redis/PostgreSQL
- [ ] Criar função genérica `wait_for_port()`
- [ ] Aplicar `wait_for_port()` em todos os serviços

### **Fase 3: Tratamento de Erros** (1 dia)
- [ ] Implementar `show_error_logs()`
- [ ] Implementar `graceful_kill()`
- [ ] Integrar tratamento de erros em todas as funções de start/stop

### **Fase 4: Melhorias de UX** (2 dias)
- [ ] Adicionar opção "Reiniciar serviço específico"
- [ ] Adicionar opção "Ver logs em tempo real"
- [ ] Melhorar `show_status()` com uptime e URLs
- [ ] Implementar sistema de perfis

### **Fase 5: Manutenibilidade** (1 dia)
- [ ] Implementar rotação de logs
- [ ] Validar dependências entre serviços
- [ ] Adicionar modo debug

### **Fase 6: Otimizações** (Opcional)
- [ ] Implementar rollback automático
- [ ] Otimizar show_progress com debounce
- [ ] Paralelizar inicialização de serviços independentes

---

## 📊 Métricas de Sucesso

### Antes das Melhorias
- ❌ Falhas silenciosas (sem diagnóstico)
- ❌ PIDs órfãos causam confusão
- ❌ Logs crescem indefinidamente
- ❌ Sem validação de pré-requisitos
- ❌ Health checks inconsistentes

### Depois das Melhorias
- ✅ Validação completa antes de iniciar
- ✅ Diagnóstico claro de erros
- ✅ Logs rotacionados automaticamente
- ✅ Health checks padronizados
- ✅ UX melhorada (reiniciar, ver logs, perfis)
- ✅ Graceful shutdown
- ✅ Sistema robusto e confiável

---

## 🔗 Referências

- Script original: [`start_interactive.sh`](../start_interactive.sh)
- Padrões do projeto: [`docs/STANDARDS.md`](../docs/STANDARDS.md)
- Package.json do backend: [`backend/package.json`](../backend/package.json)

---

## 📝 Notas Finais

Este plano identifica **20 melhorias** além das 2 já mencionadas pelo usuário, totalizando **23 melhorias** distribuídas em 6 categorias.

**Recomendação:** Implementar as fases 1-3 (fundação + health checks + erros) como prioridade máxima, pois garantem robustez e confiabilidade. As fases 4-6 são melhorias de qualidade de vida que podem ser implementadas gradualmente.

**Tempo estimado total:** 6-8 dias de trabalho (considerando implementação + testes)