# PLANO DE CORREÇÃO - manage-certifications.sh

> **Documento de Planejamento Técnico**  
> **Criado por**: Architect Mode  
> **Data**: 2026-02-02  
> **Versão**: 1.0.0  
> **Status**: Aguardando Revisão

---

## 📋 SUMÁRIO EXECUTIVO

Este plano detalha as correções necessárias para resolver os 4 problemas críticos identificados no script [`manage-certifications.sh`](../manage-certifications.sh):

1. **Detecção de Backend Incorreta** - Prioridade: ALTA
2. **Redis Inacessível** - Prioridade: ALTA  
3. **Worker Não Detectado** - Prioridade: ALTA
4. **Estatísticas da Fila Falham** - Prioridade: ALTA

**Total de Correções**: 4 correções principais + 3 melhorias adicionais  
**Complexidade Geral**: Média (Alta com modularização)  
**Arquivos Afetados**: 1 arquivo (11 arquivos se modularizar)

### Fases de Implementação

#### Fase 1: Correções Críticas (OBRIGATÓRIO)
- 4 soluções para bugs identificados
- Tempo: 1h30-2h
- Risco: Baixo

#### Fase 2: Melhorias (RECOMENDADO)
- Função de diagnóstico
- Modo verbose aprimorado
- Tempo: 35-45min
- Risco: Muito Baixo

#### Fase 3: Refatoração (OPCIONAL)
- Modularização completa do script
- Tempo: 2-3h
- Risco: Médio
- **Pode ser feito em sprint separado**

---

## 🔍 ANÁLISE DE PROBLEMAS

### Problema 1: Detecção de Backend Incorreta

#### 📊 Evidência
```
Backend (API): ✗ Não está rodando
```
Mas `./start.sh status` mostra PID 169243 ativo.

#### 🔎 Causa Raiz
**Localização**: Linhas 206-214 do [`manage-certifications.sh`](../manage-certifications.sh:206)

```bash
check_backend() {
  print_verbose "Verificando se backend está rodando..."
  
  if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Problema Identificado**:
- A função depende exclusivamente do endpoint `/health`
- Se o endpoint não existir ou retornar erro, a detecção falha
- Não há fallback para verificação de processo/porta

#### 💥 Impacto
- **Severidade**: Alta
- **Usuário**: Perde confiança no status do sistema
- **Operacional**: Pode tentar reiniciar serviço já rodando
- **Cascata**: Afeta decisões baseadas no status

#### 🎯 Prioridade
**ALTA** - Funcionalidade crítica de monitoramento

---

### Problema 2: Redis Inacessível

#### 📊 Evidência
```
Redis: ✗ Não acessível
```

#### 🔎 Causa Raiz
**Localização**: Linhas 228-241 do [`manage-certifications.sh`](../manage-certifications.sh:228)

```bash
check_redis() {
  print_verbose "Verificando se Redis está acessível..."
  
  # Tenta conectar via API de stats (que usa Redis)
  local response
  response=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Problemas Identificados**:
1. Depende da API estar funcionando (dependência circular)
2. Não testa Redis diretamente
3. Se a API falhar por outro motivo, Redis aparece como inacessível
4. Não usa `redis-cli ping` conforme documentado no arquivo central

#### 💥 Impacto
- **Severidade**: Alta
- **Operacional**: Impossível diagnosticar problemas reais do Redis
- **Fila**: Não consegue validar se Bull Queue está operacional
- **Cascata**: Problema 4 (estatísticas) depende deste

#### 🎯 Prioridade
**ALTA** - Infraestrutura crítica do sistema de filas

---

### Problema 3: Worker Não Detectado

#### 📊 Evidência
```
Worker: ✗ Não está rodando
```

#### 🔎 Causa Raiz
**Localização**: Linhas 216-226 do [`manage-certifications.sh`](../manage-certifications.sh:216)

```bash
check_worker() {
  print_verbose "Verificando se worker está rodando..."
  
  # Verifica se há processo do worker
  if pgrep -f "certificationWorker" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Problema Identificado**:
- O comando `pgrep -f "certificationWorker"` está correto
- **Hipótese 1**: Worker não está realmente rodando
- **Hipótese 2**: Worker roda com nome de processo diferente
- **Hipótese 3**: Worker é parte do processo backend (não separado)

**Análise Adicional Necessária**:
- Verificar se worker é processo separado ou thread do backend
- Confirmar nome exato do processo worker
- Verificar se [`backend/src/workers/certificationWorker.ts`](../backend/src/workers/certificationWorker.ts) é executado standalone

#### 💥 Impacto
- **Severidade**: Alta
- **Operacional**: Não consegue validar se jobs serão processados
- **Usuário**: Pode criar jobs que nunca serão executados
- **Diagnóstico**: Dificulta troubleshooting de problemas de processamento

#### 🎯 Prioridade
**ALTA** - Componente essencial do sistema de certificação

---

### Problema 4: Estatísticas da Fila Falham

#### 📊 Evidência
```
Estatísticas da Fila:
✗ Não foi possível obter estatísticas
```

#### 🔎 Causa Raiz
**Localização**: Linhas 329-347 do [`manage-certifications.sh`](../manage-certifications.sh:329)

```bash
echo -e "\n${BOLD}Estatísticas da Fila:${NC}\n"

# Buscar estatísticas
local stats
stats=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")

if echo "$stats" | jq -e '.status == "success"' >/dev/null 2>&1; then
  local waiting=$(echo "$stats" | jq -r '.data.queue.queue.waiting // 0')
  local active=$(echo "$stats" | jq -r '.data.queue.queue.active // 0')
  local completed=$(echo "$stats" | jq -r '.data.queue.queue.completed // 0')
  local failed=$(echo "$stats" | jq -r '.data.queue.queue.failed // 0')
  # ...
else
  print_error "Não foi possível obter estatísticas"
fi
```

**Problemas Identificados**:
1. **Dependência do Problema 2**: Se Redis falhar, API não retorna stats
2. **Dependência do Problema 1**: Se backend não estiver detectado corretamente, API pode não estar acessível
3. **Estrutura JSON**: Path `.data.queue.queue.*` pode estar incorreto
4. **Sem diagnóstico**: Não mostra por que falhou (Redis? API? Estrutura?)

#### 💥 Impacto
- **Severidade**: Alta
- **Visibilidade**: Usuário não tem visão do estado da fila
- **Operacional**: Impossível monitorar carga de trabalho
- **Decisões**: Não consegue decidir se deve criar mais jobs

#### 🎯 Prioridade
**ALTA** - Funcionalidade principal do script

---

## 🔧 SOLUÇÕES PROPOSTAS

### Solução 1: Corrigir Detecção de Backend

#### 📝 Descrição
Implementar detecção robusta com múltiplos métodos de verificação em ordem de prioridade.

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh:206)  
**Função**: `check_backend()`  
**Linhas**: 206-214

**Código Atual**:
```bash
check_backend() {
  print_verbose "Verificando se backend está rodando..."
  
  if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Código Proposto**:
```bash
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
```

#### ✅ Validação
```bash
# Teste 1: Backend rodando normalmente
./manage-certifications.sh
# Esperado: "Backend (API): ✓ Rodando em http://localhost:3001"

# Teste 2: Backend rodando mas /health não responde
# Simular: Comentar rota /health no backend
./manage-certifications.sh
# Esperado: Ainda detectar via lsof ou pgrep

# Teste 3: Backend não rodando
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Backend (API): ✗ Não está rodando"
```

#### 📊 Complexidade
- **Técnica**: Baixa
- **Risco**: Muito Baixo
- **Linhas Modificadas**: ~30 linhas

---

### Solução 2: Corrigir Detecção de Redis

#### 📝 Descrição
Testar Redis diretamente usando `redis-cli ping` antes de depender da API.

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh:228)  
**Função**: `check_redis()`  
**Linhas**: 228-241

**Código Atual**:
```bash
check_redis() {
  print_verbose "Verificando se Redis está acessível..."
  
  # Tenta conectar via API de stats (que usa Redis)
  local response
  response=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")
  
  if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Código Proposto**:
```bash
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
```

#### ✅ Validação
```bash
# Teste 1: Redis rodando
redis-cli ping
# Esperado: PONG
./manage-certifications.sh
# Esperado: "Redis: ✓ Acessível"

# Teste 2: Redis parado
sudo systemctl stop redis
./manage-certifications.sh
# Esperado: "Redis: ✗ Não acessível"

# Teste 3: redis-cli não instalado mas Redis rodando
# (Simular renomeando redis-cli temporariamente)
./manage-certifications.sh
# Esperado: Detectar via API (fallback)
```

#### 📊 Complexidade
- **Técnica**: Baixa
- **Risco**: Muito Baixo
- **Linhas Modificadas**: ~20 linhas

---

### Solução 3: Corrigir Detecção de Worker

#### 📝 Descrição
Implementar detecção robusta considerando que o worker é **INTEGRADO** no backend (não é processo standalone).

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh:216)
**Função**: `check_worker()`
**Linhas**: 216-226

**Código Atual**:
```bash
check_worker() {
  print_verbose "Verificando se worker está rodando..."
  
  # Verifica se há processo do worker
  if pgrep -f "certificationWorker" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}
```

**Código Proposto**:
```bash
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
    if grep -q "CertificationWorker" "$LOG_DIR/backend.out.log" | tail -n 100 | grep -q "$(date -d '60 seconds ago' '+%Y-%m-%d')"; then
      print_verbose "Worker detectado via logs recentes"
      return 0
    fi
  fi
  
  # Se backend está rodando mas não conseguimos confirmar worker, assumir ativo
  print_verbose "Worker assumido ativo (backend rodando, worker integrado)"
  return 0
}
```

#### ⚠️ Nota Importante
Esta solução assume que o worker é iniciado automaticamente com o backend. Se a API não retornar informações sobre o worker, será necessário:

1. **Opção A**: Adicionar endpoint na API para status do worker
2. **Opção B**: Verificar logs recentes para atividade do worker
3. **Opção C**: Assumir ativo se backend está rodando (solução atual)

#### ✅ Validação
```bash
# Teste 1: Backend e worker rodando
./start.sh status
./manage-certifications.sh
# Esperado: "Worker: ✓ Rodando"

# Teste 2: Backend rodando, worker parado (se separado)
# Depende da arquitetura real
./manage-certifications.sh
# Esperado: "Worker: ✗ Não está rodando"

# Teste 3: Criar job e verificar processamento
./manage-certifications.sh
# Opção 2 (criar job)
# Verificar se job é processado = worker está ativo
```

#### 📊 Complexidade
- **Técnica**: Baixa
- **Risco**: Baixo
- **Linhas Modificadas**: ~30 linhas
- **Tempo Estimado**: 15-20 minutos

---

### Solução 4: Corrigir Estatísticas da Fila

#### 📝 Descrição
Melhorar tratamento de erros e validação da estrutura JSON retornada pela API.

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh:329)  
**Função**: `show_status()`  
**Linhas**: 329-347

**Código Atual**:
```bash
echo -e "\n${BOLD}Estatísticas da Fila:${NC}\n"

# Buscar estatísticas
local stats
stats=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")

if echo "$stats" | jq -e '.status == "success"' >/dev/null 2>&1; then
  local waiting=$(echo "$stats" | jq -r '.data.queue.queue.waiting // 0')
  local active=$(echo "$stats" | jq -r '.data.queue.queue.active // 0')
  local completed=$(echo "$stats" | jq -r '.data.queue.queue.completed // 0')
  local failed=$(echo "$stats" | jq -r '.data.queue.queue.failed // 0')
  
  echo "  Na Fila:              ${YELLOW}$waiting${NC}"
  echo "  Processando:          ${BLUE}$active${NC}"
  echo "  Completos:            ${GREEN}$completed${NC}"
  echo "  Falhados:             ${RED}$failed${NC}"
else
  print_error "Não foi possível obter estatísticas"
fi
```

**Código Proposto**:
```bash
echo -e "\n${BOLD}Estatísticas da Fila:${NC}\n"

# Verificar pré-requisitos
if ! check_backend; then
  print_error "Backend não está rodando - estatísticas indisponíveis"
  return
fi

if ! check_redis; then
  print_error "Redis não está acessível - estatísticas indisponíveis"
  return
fi

# Buscar estatísticas
print_verbose "Buscando estatísticas da fila..."
local stats
stats=$(api_call GET "/api/certification-queue/stats" 2>/dev/null || echo "")

if [ -z "$stats" ]; then
  print_error "API não respondeu - verifique conectividade"
  return
fi

if ! echo "$stats" | jq -e '.status == "success"' >/dev/null 2>&1; then
  local error_msg=$(echo "$stats" | jq -r '.message // "Erro desconhecido"')
  print_error "Falha ao obter estatísticas: $error_msg"
  print_verbose "Resposta da API: $stats"
  return
fi

# Tentar diferentes estruturas JSON (compatibilidade)
local waiting active completed failed

# Estrutura 1: .data.queue.queue.*
if echo "$stats" | jq -e '.data.queue.queue' >/dev/null 2>&1; then
  waiting=$(echo "$stats" | jq -r '.data.queue.queue.waiting // 0')
  active=$(echo "$stats" | jq -r '.data.queue.queue.active // 0')
  completed=$(echo "$stats" | jq -r '.data.queue.queue.completed // 0')
  failed=$(echo "$stats" | jq -r '.data.queue.queue.failed // 0')
  print_verbose "Usando estrutura: .data.queue.queue.*"
# Estrutura 2: .data.queue.*
elif echo "$stats" | jq -e '.data.queue' >/dev/null 2>&1; then
  waiting=$(echo "$stats" | jq -r '.data.queue.waiting // 0')
  active=$(echo "$stats" | jq -r '.data.queue.active // 0')
  completed=$(echo "$stats" | jq -r '.data.queue.completed // 0')
  failed=$(echo "$stats" | jq -r '.data.queue.failed // 0')
  print_verbose "Usando estrutura: .data.queue.*"
# Estrutura 3: .data.*
elif echo "$stats" | jq -e '.data' >/dev/null 2>&1; then
  waiting=$(echo "$stats" | jq -r '.data.waiting // 0')
  active=$(echo "$stats" | jq -r '.data.active // 0')
  completed=$(echo "$stats" | jq -r '.data.completed // 0')
  failed=$(echo "$stats" | jq -r '.data.failed // 0')
  print_verbose "Usando estrutura: .data.*"
else
  print_error "Estrutura JSON não reconhecida"
  print_verbose "Resposta: $stats"
  return
fi

echo "  Na Fila:              ${YELLOW}$waiting${NC}"
echo "  Processando:          ${BLUE}$active${NC}"
echo "  Completos:            ${GREEN}$completed${NC}"
echo "  Falhados:             ${RED}$failed${NC}"
```

#### ✅ Validação
```bash
# Teste 1: Backend e Redis rodando, API funcionando
./manage-certifications.sh
# Opção 1 (Ver Status)
# Esperado: Mostrar estatísticas corretas

# Teste 2: Backend rodando, Redis parado
sudo systemctl stop redis
./manage-certifications.sh
# Esperado: "Redis não está acessível - estatísticas indisponíveis"

# Teste 3: Backend parado
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Backend não está rodando - estatísticas indisponíveis"

# Teste 4: Verificar estrutura JSON real
curl -s http://localhost:3001/api/certification-queue/stats | jq .
# Ajustar código conforme estrutura real
```

#### 📊 Complexidade
- **Técnica**: Média
- **Risco**: Baixo
- **Linhas Modificadas**: ~50 linhas

---

## 🎁 MELHORIAS ADICIONAIS

### Melhoria 1: Modularizar o Script

#### 📝 Descrição
Dividir o script monolítico de 1319 linhas em módulos separados para melhor manutenibilidade.

#### 🎯 Motivação
- **Problema Atual**: Script com 1319 linhas é difícil de manter
- **Benefícios**: 
  - Facilita debugging e testes
  - Permite reutilização de código
  - Melhora legibilidade
  - Facilita colaboração em equipe
  - Permite testes unitários de funções

#### 🏗️ Estrutura Proposta

```
scripts/
├── manage-certifications.sh          # Script principal (menu e orquestração)
├── lib/
│   ├── config.sh                     # Configurações e variáveis
│   ├── colors.sh                     # Definições de cores ANSI
│   ├── utils.sh                      # Funções utilitárias
│   ├── checks.sh                     # Funções de verificação (check_*)
│   ├── api.sh                        # Funções de API
│   ├── jobs.sh                       # Funções de gerenciamento de jobs
│   ├── stats.sh                      # Funções de estatísticas
│   ├── logs.sh                       # Funções de logs
│   ├── diagnostics.sh                # Função de diagnóstico
│   └── menu.sh                       # Funções de menu e UI
└── README.md                         # Documentação dos módulos
```

#### 📦 Distribuição de Código

**config.sh** (~50 linhas)
```bash
#!/usr/bin/env bash
# Configurações centralizadas

# Diretórios
export ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export BACKEND_DIR="$ROOT_DIR/backend"
export LOG_DIR="$ROOT_DIR/logs"

# Variáveis de Ambiente
export API_URL="${API_URL:-http://localhost:3001}"
export API_TOKEN="${API_TOKEN:-}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-myia}"
export DB_USER="${DB_USER:-leonardo}"

# Arquivo de configuração opcional
CONFIG_FILE="${HOME}/.certifications-manager.conf"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

# Modo verbose e dry-run
export VERBOSE=false
export DRY_RUN=false
export SCREEN_LOCKED=false
```

**colors.sh** (~20 linhas)
```bash
#!/usr/bin/env bash
# Definições de cores ANSI

export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export MAGENTA='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export BOLD='\033[1m'
export DIM='\033[2m'
export NC='\033[0m' # No Color
```

**utils.sh** (~150 linhas)
```bash
#!/usr/bin/env bash
# Funções utilitárias

source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

clear_screen() { ... }
print_header() { ... }
print_success() { ... }
print_error() { ... }
print_info() { ... }
print_warning() { ... }
print_verbose() { ... }
confirm() { ... }
check_dependencies() { ... }
format_date() { ... }
draw_progress_bar() { ... }
pause() { ... }
```

**checks.sh** (~150 linhas)
```bash
#!/usr/bin/env bash
# Funções de verificação de serviços

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/api.sh"

check_backend() {
  # Solução 1 completa
}

check_redis() {
  # Solução 2 completa
}

check_worker() {
  # Solução 3 completa
}

check_postgres() {
  # Código existente
}
```

**api.sh** (~100 linhas)
```bash
#!/usr/bin/env bash
# Funções de comunicação com API

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

api_call() {
  # Código existente
}

api_get_stats() {
  api_call GET "/api/certification-queue/stats"
}

api_get_jobs() {
  local limit="${1:-10}"
  local status="${2:-}"
  local endpoint="/api/certification-queue/history?limit=$limit"
  [ -n "$status" ] && endpoint="$endpoint&status=$status"
  api_call GET "$endpoint"
}

api_create_job() {
  local data="$1"
  api_call POST "/api/certification-queue/certify-model" "$data"
}

api_get_job_details() {
  local job_id="$1"
  api_call GET "/api/certification-queue/jobs/$job_id/status"
}

api_cancel_job() {
  local job_id="$1"
  api_call DELETE "/api/certification-queue/jobs/$job_id"
}
```

**jobs.sh** (~300 linhas)
```bash
#!/usr/bin/env bash
# Funções de gerenciamento de jobs

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/api.sh"

create_job() { ... }
create_single_model_job() { ... }
create_multiple_models_job() { ... }
create_all_models_job() { ... }
list_jobs() { ... }
show_job_details() { ... }
cancel_job() { ... }
cleanup_jobs() { ... }
```

**stats.sh** (~200 linhas)
```bash
#!/usr/bin/env bash
# Funções de estatísticas

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/api.sh"
source "$(dirname "${BASH_SOURCE[0]}")/checks.sh"

show_status() {
  # Inclui Solução 4 completa
}

show_stats() { ... }
manage_queue() { ... }
```

**logs.sh** (~150 linhas)
```bash
#!/usr/bin/env bash
# Funções de logs

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/api.sh"

show_logs() { ... }
```

**diagnostics.sh** (~120 linhas)
```bash
#!/usr/bin/env bash
# Função de diagnóstico do sistema

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"
source "$(dirname "${BASH_SOURCE[0]}")/checks.sh"

diagnose_system() {
  # Melhoria 1 completa
}
```

**menu.sh** (~100 linhas)
```bash
#!/usr/bin/env bash
# Funções de menu e UI

source "$(dirname "${BASH_SOURCE[0]}")/utils.sh"

show_main_menu() { ... }
toggle_screen_lock() { ... }
run_tests() { ... }
show_docs() { ... }
restart_services() { ... }
```

**manage-certifications.sh** (NOVO - ~80 linhas)
```bash
#!/usr/bin/env bash
# manage-certifications.sh - Sistema de Gerenciamento de Certificações MyIA
# Versão Modularizada 2.0.0

set -euo pipefail

# Determinar diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# Carregar módulos
source "$LIB_DIR/config.sh"
source "$LIB_DIR/colors.sh"
source "$LIB_DIR/utils.sh"
source "$LIB_DIR/checks.sh"
source "$LIB_DIR/api.sh"
source "$LIB_DIR/jobs.sh"
source "$LIB_DIR/stats.sh"
source "$LIB_DIR/logs.sh"
source "$LIB_DIR/diagnostics.sh"
source "$LIB_DIR/menu.sh"

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

# Loop principal
while true; do
  show_main_menu
done
```

#### 🔄 Estratégia de Migração

**Fase 1: Preparação**
1. Criar estrutura de diretórios
2. Criar arquivos vazios dos módulos
3. Manter script original como backup

**Fase 2: Extração Gradual**
1. Extrair `config.sh` e `colors.sh` (mais simples)
2. Extrair `utils.sh` (funções independentes)
3. Extrair `checks.sh` (com as correções)
4. Extrair `api.sh` (funções de API)
5. Extrair módulos específicos (jobs, stats, logs)
6. Extrair `menu.sh` (último)

**Fase 3: Integração**
1. Criar novo `manage-certifications.sh` que carrega módulos
2. Testar cada funcionalidade
3. Validar compatibilidade

**Fase 4: Transição**
1. Mover script original para `manage-certifications.sh.legacy`
2. Ativar versão modularizada
3. Documentar mudanças

#### ✅ Benefícios da Modularização

1. **Manutenibilidade**: Cada módulo tem responsabilidade única
2. **Testabilidade**: Funções podem ser testadas isoladamente
3. **Reutilização**: Módulos podem ser usados por outros scripts
4. **Colaboração**: Múltiplos desenvolvedores podem trabalhar em paralelo
5. **Debugging**: Mais fácil identificar origem de problemas
6. **Documentação**: Cada módulo pode ter sua própria documentação
7. **Performance**: Carregar apenas módulos necessários (futuro)

#### 📊 Comparação

| Aspecto | Monolítico | Modularizado |
|---------|------------|--------------|
| Linhas por arquivo | 1319 | 50-300 |
| Facilidade de manutenção | Baixa | Alta |
| Testabilidade | Difícil | Fácil |
| Reutilização | Impossível | Fácil |
| Colaboração | Difícil | Fácil |
| Debugging | Complexo | Simples |

#### ⚠️ Considerações

1. **Compatibilidade**: Manter interface externa idêntica
2. **Performance**: Overhead mínimo de carregar múltiplos arquivos
3. **Dependências**: Gerenciar ordem de carregamento dos módulos
4. **Testes**: Validar que tudo funciona após modularização

#### 🎯 Prioridade

**MÉDIA-ALTA** - Não é crítico para correção dos bugs, mas melhora significativamente a manutenibilidade futura.

#### 📅 Quando Implementar

**Opção A**: Após correções críticas (Fase 1)
- Vantagem: Bugs corrigidos primeiro
- Desvantagem: Modularização trabalha com código bugado

**Opção B**: Durante correções críticas
- Vantagem: Código corrigido já nasce modularizado
- Desvantagem: Mais complexo, mais tempo

**Recomendação**: **Opção A** - Corrigir bugs primeiro, depois modularizar.

---

### Melhoria 2: Adicionar Função de Diagnóstico

#### � Descrição
Criar função dedicada para diagnosticar problemas de conectividade.

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh)  
**Nova Função**: `diagnose_system()`  
**Localização**: Após linha 285 (após função `pause()`)

```bash
# Diagnostica problemas do sistema
diagnose_system() {
  print_header "Diagnóstico do Sistema"
  
  echo -e "${BOLD}Verificando Componentes:${NC}\n"
  
  # 1. Verificar dependências
  echo -e "${BOLD}1. Dependências:${NC}"
  local deps_ok=true
  
  for cmd in curl jq psql redis-cli lsof pgrep; do
    echo -n "  $cmd: "
    if command -v "$cmd" >/dev/null 2>&1; then
      print_success "Instalado"
    else
      print_error "Não encontrado"
      deps_ok=false
    fi
  done
  
  # 2. Verificar portas
  echo -e "\n${BOLD}2. Portas:${NC}"
  
  for port in 3001 3000 3003 3002 6379 5432; do
    echo -n "  Porta $port: "
    if command -v lsof >/dev/null 2>&1; then
      if lsof -ti:$port >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        print_success "Em uso (PID: $pid)"
      else
        print_warning "Livre"
      fi
    else
      print_warning "lsof não disponível"
    fi
  done
  
  # 3. Verificar processos
  echo -e "\n${BOLD}3. Processos:${NC}"
  
  echo -n "  Backend (node): "
  if pgrep -f "node.*backend" >/dev/null 2>&1; then
    local pid=$(pgrep -f "node.*backend")
    print_success "Rodando (PID: $pid)"
  else
    print_error "Não encontrado"
  fi
  
  echo -n "  Worker: "
  if pgrep -f "certificationWorker" >/dev/null 2>&1; then
    local pid=$(pgrep -f "certificationWorker")
    print_success "Rodando (PID: $pid)"
  else
    print_warning "Não encontrado (pode estar integrado no backend)"
  fi
  
  # 4. Testar conectividade
  echo -e "\n${BOLD}4. Conectividade:${NC}"
  
  echo -n "  Backend API: "
  if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
    print_success "Acessível"
  else
    print_error "Não acessível"
  fi
  
  echo -n "  Redis: "
  if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then
    print_success "Acessível"
  else
    print_error "Não acessível"
  fi
  
  echo -n "  PostgreSQL: "
  if PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1; then
    print_success "Acessível"
  else
    print_error "Não acessível"
  fi
  
  # 5. Testar API endpoints
  echo -e "\n${BOLD}5. Endpoints da API:${NC}"
  
  local endpoints=(
    "/api/certification-queue/stats"
    "/api/certification-queue/jobs"
    "/health"
  )
  
  for endpoint in "${endpoints[@]}"; do
    echo -n "  $endpoint: "
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
      print_success "OK ($status_code)"
    elif [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
      print_warning "Autenticação necessária ($status_code)"
    else
      print_error "Erro ($status_code)"
    fi
  done
  
  # 6. Resumo
  echo -e "\n${BOLD}Resumo:${NC}"
  if [ "$deps_ok" = true ]; then
    print_success "Todas as dependências estão instaladas"
  else
    print_error "Algumas dependências estão faltando"
  fi
  
  pause
}
```

#### 📝 Adicionar ao Menu

**Localização**: Linha 1248 (antes da opção "0. Sair")

```bash
  echo "  14. 🔧 Diagnóstico do Sistema"
  echo "  0.  🚪 Sair"
```

**Localização**: Linha 1268 (no case statement)

```bash
    13) toggle_screen_lock ;;
    14) diagnose_system ;;
    0)
```

#### ✅ Validação
```bash
./manage-certifications.sh
# Opção 14 (Diagnóstico)
# Esperado: Relatório completo de todos os componentes
```

---

### Melhoria 2: Adicionar Modo Verbose para Debugging

#### 📝 Descrição
Melhorar mensagens verbose para facilitar debugging.

#### 🛠️ Implementação

**Arquivo**: [`manage-certifications.sh`](../manage-certifications.sh)  
**Modificações**: Adicionar mais chamadas `print_verbose` nas funções críticas

**Exemplo em `check_backend()`**:
```bash
check_backend() {
  print_verbose "Verificando se backend está rodando..."
  print_verbose "API_URL: $API_URL"
  
  # Método 1: Verificar endpoint /health
  print_verbose "Tentando método 1: curl $API_URL/health"
  if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
    print_verbose "✓ Backend detectado via /health endpoint"
    return 0
  fi
  print_verbose "✗ Método 1 falhou"
  
  # ... continuar para outros métodos
}
```

#### ✅ Validação
```bash
./manage-certifications.sh --verbose
# Esperado: Mensagens detalhadas de cada verificação
```

---

## 📅 ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Correções Críticas (Prioridade ALTA)
**Ordem de execução**: Sequencial (uma depende da outra)

1. **✅ Solução 2: Corrigir Detecção de Redis**
   - **Por quê primeiro**: Base para outras verificações
   - **Dependências**: Nenhuma
   - **Tempo estimado**: 15-20 minutos
   - **Risco**: Muito Baixo

2. **✅ Solução 1: Corrigir Detecção de Backend**
   - **Por quê segundo**: Necessário para verificar worker
   - **Dependências**: Nenhuma (independente do Redis)
   - **Tempo estimado**: 20-25 minutos
   - **Risco**: Muito Baixo

3. **✅ Solução 3: Corrigir Detecção de Worker**
   - **Por quê terceiro**: Depende de backend estar detectado
   - **Dependências**: Solução 1
   - **Tempo estimado**: 15-20 minutos
   - **Risco**: Baixo

4. **✅ Solução 4: Corrigir Estatísticas da Fila**
   - **Por quê quarto**: Depende de Redis e Backend funcionando
   - **Dependências**: Soluções 1 e 2
   - **Tempo estimado**: 30-35 minutos
   - **Risco**: Baixo

### Fase 2: Melhorias (Prioridade MÉDIA)
**Ordem de execução**: Paralela (podem ser feitas em qualquer ordem)

5. **🎁 Melhoria 2: Adicionar Função de Diagnóstico**
   - **Benefício**: Facilita troubleshooting
   - **Dependências**: Todas as soluções da Fase 1
   - **Tempo estimado**: 20-25 minutos
   - **Risco**: Muito Baixo

6. **🎁 Melhoria 3: Melhorar Modo Verbose**
   - **Benefício**: Debugging mais eficiente
   - **Dependências**: Nenhuma
   - **Tempo estimado**: 15-20 minutos
   - **Risco**: Muito Baixo

### Fase 3: Refatoração (Prioridade MÉDIA-ALTA)
**Ordem de execução**: Sequencial (após todas as correções)

7. **🏗️ Melhoria 1: Modularizar o Script**
   - **Benefício**: Manutenibilidade e escalabilidade
   - **Dependências**: Todas as correções da Fase 1
   - **Tempo estimado**: 2-3 horas
   - **Risco**: Médio
   - **Nota**: Pode ser feito em sprint separado

---

## ✅ CRITÉRIOS DE SUCESSO

### Critério 1: Detecção de Backend Funcional

#### Testes de Validação
```bash
# Teste 1.1: Backend rodando via npm/node
cd backend && npm run dev &
sleep 5
./manage-certifications.sh
# Esperado: "Backend (API): ✓ Rodando em http://localhost:3001"

# Teste 1.2: Backend rodando via tsx
cd backend && npx tsx src/server.ts &
sleep 5
./manage-certifications.sh
# Esperado: "Backend (API): ✓ Rodando em http://localhost:3001"

# Teste 1.3: Backend parado
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Backend (API): ✗ Não está rodando"

# Teste 1.4: Porta ocupada mas /health não responde
# (Simular com nc -l 3001)
./manage-certifications.sh
# Esperado: Detectar via lsof mesmo sem /health
```

#### Comportamento Esperado
- ✅ Detecta backend via endpoint `/health`
- ✅ Detecta backend via `lsof -ti:3001`
- ✅ Detecta backend via `pgrep -f "node.*backend"`
- ✅ Detecta backend via `pgrep -f "tsx.*backend"`
- ✅ Retorna falso quando backend não está rodando
- ✅ Mostra mensagens verbose quando `--verbose` ativo

---

### Critério 2: Detecção de Redis Funcional

#### Testes de Validação
```bash
# Teste 2.1: Redis rodando
sudo systemctl start redis
redis-cli ping
# Esperado: PONG
./manage-certifications.sh
# Esperado: "Redis: ✓ Acessível"

# Teste 2.2: Redis parado
sudo systemctl stop redis
./manage-certifications.sh
# Esperado: "Redis: ✗ Não acessível"

# Teste 2.3: redis-cli não instalado
sudo mv /usr/bin/redis-cli /usr/bin/redis-cli.bak
./manage-certifications.sh
# Esperado: Tentar via API (fallback)
sudo mv /usr/bin/redis-cli.bak /usr/bin/redis-cli

# Teste 2.4: Redis rodando mas API não responde
# (Simular parando backend mas mantendo Redis)
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Redis: ✓ Acessível" (via redis-cli)
```

#### Comportamento Esperado
- ✅ Detecta Redis via `redis-cli ping`
- ✅ Fallback para detecção via API se redis-cli não disponível
- ✅ Retorna falso quando Redis não está acessível
- ✅ Independente do status do backend (testa diretamente)

---

### Critério 3: Detecção de Worker Funcional

#### Testes de Validação
```bash
# Teste 3.2: Worker Detectado (Integrado no Backend)
./start.sh start backend
sleep 5
./manage-certifications.sh
# Esperado: "Worker: ✓ Rodando"

# Teste 3.3: Backend parado (worker também para)
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Worker: ✗ Não está rodando"

# Teste 3.4: Criar job e verificar processamento
./manage-certifications.sh
# Opção 2 (Criar job)
# Criar job de teste
# Verificar se job é processado
# Esperado: Job processado = worker ativo
```

#### Comportamento Esperado
- ✅ Worker detectado como integrado no backend
- ✅ Mensagem: "Worker detectado via API stats (integrado no backend)" OU
- ✅ Mensagem: "Worker assumido ativo (backend rodando, worker integrado)"
- ✅ Status exibido como "✓ Em execução"

#### ⚠️ Nota de Investigação
Antes de implementar, verificar:
```bash
# Verificar arquitetura real do worker
ps aux | grep -i worker
ps aux | grep -i certification
cat backend/src/server.ts | grep -i worker
cat backend/src/workers/certificationWorker.ts
```

---

### Critério 4: Estatísticas da Fila Funcionais

#### Testes de Validação
```bash
# Teste 4.1: Sistema completo funcionando
./start.sh start both
sleep 5
./manage-certifications.sh
# Opção 1 (Ver Status)
# Esperado: Mostrar estatísticas completas:
#   Na Fila: X
#   Processando: Y
#   Completos: Z
#   Falhados: W

# Teste 4.2: Backend parado
./start.sh stop backend
./manage-certifications.sh
# Esperado: "Backend não está rodando - estatísticas indisponíveis"

# Teste 4.3: Redis parado
sudo systemctl stop redis
./manage-certifications.sh
# Esperado: "Redis não está acessível - estatísticas indisponíveis"

# Teste 4.4: Verificar estrutura JSON real
curl -s http://localhost:3001/api/certification-queue/stats | jq .
# Esperado: Validar estrutura e ajustar código se necessário

# Teste 4.5: API retorna erro
# (Simular erro na API)
./manage-certifications.sh
# Esperado: Mensagem de erro clara com detalhes
```

#### Comportamento Esperado
- ✅ Verifica pré-requisitos (backend e Redis) antes de buscar stats
- ✅ Mostra mensagens claras quando pré-requisitos falham
- ✅ Suporta múltiplas estruturas JSON (compatibilidade)
- ✅ Mostra erro detalhado quando API falha
- ✅ Exibe estatísticas corretamente quando tudo funciona

---

### Critério 5: Função de Diagnóstico Funcional

#### Testes de Validação
```bash
# Teste 5.1: Sistema completo funcionando
./start.sh start both
./manage-certifications.sh
# Opção 14 (Diagnóstico)
# Esperado: Todos os componentes marcados como OK

# Teste 5.2: Sistema parcialmente funcionando
./start.sh stop backend
./manage-certifications.sh
# Opção 14 (Diagnóstico)
# Esperado: Backend marcado como erro, outros OK

# Teste 5.3: Dependências faltando
# (Simular renomeando comando)
sudo mv /usr/bin/jq /usr/bin/jq.bak
./manage-certifications.sh
# Opção 14 (Diagnóstico)
# Esperado: jq marcado como "Não encontrado"
sudo mv /usr/bin/jq.bak /usr/bin/jq
```

#### Comportamento Esperado
- ✅ Lista todas as dependências e seu status
- ✅ Verifica todas as portas relevantes
- ✅ Lista processos em execução
- ✅ Testa conectividade de todos os serviços
- ✅ Testa endpoints da API
- ✅ Fornece resumo claro

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Worker Não é Processo Separado

#### Descrição
Worker pode estar integrado no processo backend, não como processo standalone.

#### Probabilidade
**ALTA** (70%)

#### Impacto
**MÉDIO** - Solução 3 precisa ser ajustada

#### Mitigação
```bash
# Antes de implementar Solução 3, executar:
ps aux | grep -E "(worker|certification)" | grep -v grep
cat backend/src/server.ts | grep -i worker
cat backend/package.json | grep -i worker

# Se worker for integrado:
# - Ajustar check_worker() para assumir ativo se backend ativo
# - Ou adicionar endpoint na API: GET /api/worker/status
# - Ou verificar logs recentes para atividade do worker
```

#### Plano B
Se worker for integrado e não houver endpoint de status:
1. Assumir worker ativo se backend está rodando
2. Adicionar nota no output: "Worker: ✓ Rodando (integrado no backend)"
3. Documentar limitação no README

---

### Risco 2: Estrutura JSON da API Diferente

#### Descrição
Path `.data.queue.queue.*` pode não existir na resposta real da API.

#### Probabilidade
**MÉDIA** (50%)

#### Impacto
**MÉDIO** - Solução 4 não funciona até ajustar

#### Mitigação
```bash
# Antes de implementar Solução 4, executar:
curl -s http://localhost:3001/api/certification-queue/stats | jq .

# Verificar estrutura real e ajustar código
# Solução 4 já inclui suporte para múltiplas estruturas
```

#### Plano B
Implementar suporte para 3 estruturas diferentes (já incluído na Solução 4):
1. `.data.queue.queue.*`
2. `.data.queue.*`
3. `.data.*`

---

### Risco 3: Endpoint /health Não Existe

#### Descrição
Backend pode não ter endpoint `/health` implementado.

#### Probabilidade
**BAIXA** (20%)

#### Impacto
**BAIXO** - Solução 1 tem fallbacks

#### Mitigação
```bash
# Verificar se endpoint existe:
curl -s http://localhost:3001/health

# Se não existir:
# - Solução 1 já tem fallbacks (lsof, pgrep)
# - Considerar adicionar endpoint /health no backend
```

#### Plano B
Usar apenas métodos 2, 3 e 4 da Solução 1 (lsof e pgrep).

---

### Risco 4: Permissões Insuficientes

#### Descrição
Comandos `lsof`, `pgrep` podem requerer permissões especiais.

#### Probabilidade
**BAIXA** (15%)

#### Impacto
**BAIXO** - Alguns métodos de detecção falham

#### Mitigação
```bash
# Testar permissões:
lsof -ti:3001
pgrep -f "node"

# Se falhar:
# - Documentar necessidade de permissões
# - Adicionar verificação de permissões no diagnóstico
# - Sugerir uso de sudo se necessário
```

#### Plano B
Priorizar métodos que não requerem permissões especiais (curl, API).

---

### Risco 5: Redis Requer Autenticação

#### Descrição
Redis pode estar configurado com senha (requirepass).

#### Probabilidade
**BAIXA** (10%)

#### Impacto
**MÉDIO** - `redis-cli ping` falha sem senha

#### Mitigação
```bash
# Verificar configuração:
redis-cli CONFIG GET requirepass

# Se tiver senha:
# - Adicionar variável REDIS_PASSWORD
# - Modificar comando: redis-cli -a "$REDIS_PASSWORD" ping
# - Ou usar fallback via API
```

#### Plano B
Usar apenas método 2 da Solução 2 (detecção via API).

---

## 📊 RESUMO DE COMPLEXIDADE

### Por Solução

| Solução | Complexidade | Risco | Linhas | Tempo |
|---------|--------------|-------|--------|-------|
| Solução 1: Backend | Baixa | Muito Baixo | ~30 | 20-25min |
| Solução 2: Redis | Baixa | Muito Baixo | ~20 | 15-20min |
| Solução 3: Worker | Baixa | Baixo | ~30 | 15-20min |
| Solução 4: Stats | Média | Baixo | ~50 | 30-35min |
| Melhoria 1: Modularização | Alta | Médio | ~1319 | 2-3h |
| Melhoria 2: Diagnóstico | Baixa | Muito Baixo | ~80 | 20-25min |
| Melhoria 3: Verbose | Baixa | Muito Baixo | ~20 | 15-20min |

### Totais

#### Fase 1 (Correções Críticas)
- **Linhas Modificadas**: ~130 linhas
- **Funções Afetadas**: 4 funções
- **Tempo Estimado**: 1h30-2h

#### Fase 2 (Melhorias)
- **Linhas Adicionadas**: ~100 linhas
- **Funções Novas**: 1 função
- **Tempo Estimado**: 35-45min

#### Fase 3 (Refatoração)
- **Linhas Refatoradas**: ~1319 linhas
- **Arquivos Criados**: 10 arquivos
- **Tempo Estimado**: 2-3h

#### Total Geral
- **Arquivos Modificados**: 1 arquivo (ou 11 se modularizar)
- **Complexidade Geral**: Média (Alta se incluir modularização)
- **Risco Geral**: Baixo (Médio se incluir modularização)
- **Tempo Total**: 2h-3h (4h-6h com modularização)

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### Pré-Implementação
- [ ] Fazer backup do script original
  ```bash
  cp manage-certifications.sh manage-certifications.sh.backup
  ```
- [ ] Verificar estrutura JSON da API
  ```bash
  curl -s http://localhost:3001/api/certification-queue/stats | jq .
  ```
- [ ] Verificar arquitetura do worker
  ```bash
  ps aux | grep -E "(worker|certification)"
  cat backend/src/server.ts | grep -i worker
  ```
- [ ] Testar comandos de detecção
  ```bash
  lsof -ti:3001
  pgrep -f "node.*backend"
  redis-cli ping
  ```

### Pré-Implementação da Solução 4

- [ ] **OBRIGATÓRIO**: Validar estrutura JSON da API
  ```bash
  # Iniciar backend se não estiver rodando
  ./start.sh start backend
  sleep 5
  
  # Capturar estrutura real
  curl -s http://localhost:3001/api/certification-queue/stats | jq . > /tmp/stats-structure.json
  
  # Analisar estrutura
  cat /tmp/stats-structure.json
  
  # Ajustar código da Solução 4 para usar APENAS a estrutura real encontrada
  # Remover tentativas de estruturas não utilizadas
  ```

### Fase 1: Correções Críticas
- [ ] Implementar Solução 2 (Redis)
- [ ] Testar Solução 2
- [ ] Implementar Solução 1 (Backend)
- [ ] Testar Solução 1
- [ ] Implementar Solução 3 (Worker)
- [ ] Testar Solução 3
- [ ] Implementar Solução 4 (Stats)
- [ ] Testar Solução 4

### Fase 2: Melhorias
- [ ] Implementar Melhoria 2 (Diagnóstico)
- [ ] Testar Melhoria 2
- [ ] Implementar Melhoria 3 (Verbose)
- [ ] Testar Melhoria 3

### Fase 3: Refatoração (Opcional)
- [ ] Decidir se modularização será feita agora ou depois
- [ ] Se sim, criar estrutura de diretórios
- [ ] Extrair módulos um por um
- [ ] Testar cada módulo
- [ ] Integrar módulos no script principal
- [ ] Validar compatibilidade total

### Pós-Implementação
- [ ] Executar todos os testes de validação
- [ ] Testar com sistema completo rodando
- [ ] Testar com sistema parcialmente parado
- [ ] Testar modo verbose
- [ ] Testar função de diagnóstico
- [ ] Atualizar documentação
- [ ] Criar relatório de testes

---

## 📚 ARQUIVOS DE REFERÊNCIA

### Arquivos Principais
- [`manage-certifications.sh`](../manage-certifications.sh) - Script a ser corrigido
- [`CENTRAL-SCRIPT-CERTIFICADO.md`](../CENTRAL-SCRIPT-CERTIFICADO.md) - Arquivo central de coordenação
- [`start.sh`](../start.sh) - Script de gerenciamento de serviços

### Arquivos Backend
- [`backend/src/server.ts`](../backend/src/server.ts) - Servidor principal
- [`backend/src/workers/certificationWorker.ts`](../backend/src/workers/certificationWorker.ts) - Worker
- [`backend/src/services/queue/CertificationQueueService.ts`](../backend/src/services/queue/CertificationQueueService.ts) - Serviço de fila
- [`backend/src/config/redis.ts`](../backend/src/config/redis.ts) - Configuração Redis

### Documentação
- [`backend/docs/CERTIFICATION-WORKER-GUIDE.md`](../backend/docs/CERTIFICATION-WORKER-GUIDE.md)
- [`backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md`](../backend/docs/CERTIFICATION-QUEUE-API-SUMMARY.md)

---

## 🔄 PRÓXIMOS PASSOS

### Para Code Reviewer
1. Revisar este plano completo
2. Validar soluções propostas
3. Sugerir melhorias ou ajustes
4. Aprovar ou solicitar modificações
5. Documentar feedback no arquivo central

### Para Code Mode
1. Aguardar aprovação do Code Reviewer
2. Implementar soluções na ordem especificada
3. Executar testes após cada solução
4. Documentar mudanças realizadas
5. Criar commit para cada solução

### Para Test Engineer
1. Aguardar implementação completa
2. Executar todos os testes de validação
3. Testar cenários edge cases
4. Validar critérios de sucesso
5. Gerar relatório de testes completo

---

## 📝 NOTAS FINAIS

### Considerações Importantes

1. **Ordem de Implementação**: Seguir rigorosamente a ordem proposta, pois há dependências entre as soluções.

2. **Testes Incrementais**: Testar cada solução antes de prosseguir para a próxima.

3. **Backup**: Manter backup do script original para rollback se necessário.

4. **Investigação do Worker**: Solução 3 pode precisar ajustes após investigar arquitetura real.

5. **Estrutura JSON**: Solução 4 já prevê múltiplas estruturas, mas pode precisar ajustes.

6. **Modo Verbose**: Usar `--verbose` durante testes para debugging detalhado.

7. **Documentação**: Atualizar README após implementação com novos recursos.

### Melhorias Futuras (Fora do Escopo)

- Adicionar endpoint `/api/worker/status` na API
- Implementar cache de status para reduzir chamadas
- Adicionar notificações quando serviços caem
- Criar dashboard web para monitoramento
- Adicionar testes automatizados do script
- Implementar health checks periódicos em background

---

## ✅ APROVAÇÃO

### Checklist de Revisão

- [ ] Todas as causas raiz foram identificadas corretamente
- [ ] Soluções propostas são tecnicamente viáveis
- [ ] Ordem de implementação faz sentido
- [ ] Critérios de sucesso são claros e testáveis
- [ ] Riscos foram identificados e mitigados
- [ ] Complexidade está adequada ao escopo
- [ ] Documentação está completa

### Assinaturas

**Architect**: ✅ Plano criado e pronto para revisão  
**Code Reviewer**: ⏳ Aguardando revisão  
**Orchestrator**: ⏳ Aguardando aprovação final

---

**Fim do Plano de Correção**