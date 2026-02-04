# 🎯 Plano de Modularização: start_interactive.sh

> **Arquivo Original:** `start_interactive.sh` (2.038 linhas)  
> **Objetivo:** Quebrar em módulos ≤250 linhas cada  
> **Estratégia:** Organização por contexto funcional  
> **Data:** 2026-02-03

---

## 📊 Análise do Arquivo Atual

### Estatísticas
- **Linhas totais:** 2.038
- **Funções:** 48
- **Complexidade:** MUITO ALTA
- **Manutenibilidade:** CRÍTICA (509% acima do limite)

### Funções Mapeadas (48 total)

```bash
# === UTILITÁRIOS GERAIS (8 funções) ===
debug_log()                     # Logging de debug
check_prerequisites()           # Verifica Node, Docker, npm
validate_directories()          # Valida estrutura de pastas
check_port_available()          # Verifica se porta está livre
validate_env_files()            # Valida .env files
cleanup_orphan_pids()           # Limpa PIDs órfãos
rotate_logs()                   # Rotação automática de logs
validate_service_dependencies() # Valida dependências entre serviços

# === MONITORAMENTO (3 funções) ===
wait_for_port()                # Aguarda porta ficar disponível
show_error_logs()              # Exibe logs de erro
check_service_status()         # Verifica status de serviço

# === CONTROLE DE PROCESSOS (2 funções) ===
graceful_kill()                # Mata processo gracefully
update_running_status()        # Atualiza status global

# === INTERFACE/UI (10 funções) ===
clear_screen()                 # Limpa tela
hide_cursor()                  # Esconde cursor
show_cursor()                  # Mostra cursor
draw_box_top()                 # Desenha topo da caixa
draw_box_middle()              # Desenha meio da caixa
draw_box_bottom()              # Desenha fundo da caixa
show_menu()                    # Menu interativo principal
toggle_service()               # Liga/desliga serviço
select_all()                   # Seleciona todos
deselect_all()                 # Deseleciona todos

# === BARRAS DE PROGRESSO (2 funções) ===
draw_progress_bar()            # Desenha barra de progresso
get_status_icon()              # Retorna ícone de status (✅❌)
show_progress()                # Exibe progresso geral

# === SERVIÇOS (6 funções start_*) ===
start_database()               # Inicia Redis
start_backend_service()        # Inicia Backend API
start_frontend_service()       # Inicia Frontend
start_frontend_admin_service() # Inicia Frontend Admin
start_worker_service()         # Inicia Worker (certificações)
start_grafana_service()        # Inicia Grafana Stack (CORRIGIDO)

# === ORQUESTRAÇÃO (2 funções) ===
start_selected_services()      # Inicia serviços selecionados
show_completion_summary()      # Mostra resumo final

# === REINICIAR (6 funções restart_*) ===
restart_service_menu()         # Menu de reinicialização
restart_backend()
restart_frontend()
restart_frontend_admin()
restart_worker()
restart_grafana()

# === LOGS (2 funções) ===
view_logs_menu()               # Menu de visualização de logs
clean_old_logs()               # Limpa logs antigos

# === PERFIS (2 funções) ===
save_profile()                 # Salva perfil de serviços
load_profile()                 # Carrega perfil salvo

# === STATUS (2 funções) ===
get_uptime()                   # Calcula uptime de serviço
show_status()                  # Mostra status detalhado

# === PARAR (1 função) ===
stop_all_services()            # Para todos os serviços

# === MAIN (1 função) ===
main()                         # Loop principal interativo
```

---

## 🗂️ Nova Estrutura de Módulos

```
MyIA/
├── start_interactive.sh                    (200 linhas) - Orquestrador principal
│
└── scripts/
    ├── common/                             # Utilitários compartilhados
    │   ├── colors.sh                       (50 linhas)  - Definição de cores
    │   ├── config.sh                       (100 linhas) - Configurações globais
    │   └── utils.sh                        (200 linhas) - Funções utilitárias
    │
    ├── ui/                                 # Interface do usuário
    │   ├── menu.sh                         (250 linhas) - Menu interativo
    │   ├── progress.sh                     (150 linhas) - Barras de progresso
    │   └── drawing.sh                      (100 linhas) - Funções de desenho
    │
    ├── services/                           # Gerenciamento de serviços
    │   ├── database.sh                     (100 linhas) - Start/stop Redis
    │   ├── backend.sh                      (120 linhas) - Start/stop Backend
    │   ├── frontend.sh                     (100 linhas) - Start/stop Frontend
    │   ├── frontend-admin.sh               (100 linhas) - Start/stop Frontend Admin
    │   ├── worker.sh                       (100 linhas) - Start/stop Worker
    │   └── grafana.sh                      (150 linhas) - Start/stop Grafana (CORRIGIDO)
    │
    ├── health/                             # Health checks e monitoramento
    │   ├── checks.sh                       (150 linhas) - Health checks HTTP
    │   ├── wait.sh                         (100 linhas) - Wait for port/service
    │   └── status.sh                       (200 linhas) - Status de serviços
    │
    ├── logs/                               # Gerenciamento de logs
    │   ├── rotate.sh                       (100 linhas) - Rotação de logs
    │   ├── viewer.sh                       (150 linhas) - Visualização de logs
    │   └── cleanup.sh                      (80 linhas)  - Limpeza de logs
    │
    ├── profiles/                           # Perfis de inicialização
    │   ├── save.sh                         (120 linhas) - Salvar perfis
    │   └── load.sh                         (120 linhas) - Carregar perfis
    │
    └── validation/                         # Validações
        ├── prerequisites.sh                (150 linhas) - Verifica deps do sistema
        ├── dependencies.sh                 (100 linhas) - Valida deps entre serviços
        └── env.sh                          (100 linhas) - Valida .env files
```

---

## 📋 Plano de Execução (7 Fases)

### Fase 1: Criar Estrutura Base (10 min)
**Objetivo:** Criar diretórios e arquivos base

```bash
# Criar estrutura
mkdir -p scripts/{common,ui,services,health,logs,profiles,validation}

# Criar arquivos vazios com headers
touch scripts/common/{colors.sh,config.sh,utils.sh}
touch scripts/ui/{menu.sh,progress.sh,drawing.sh}
touch scripts/services/{database.sh,backend.sh,frontend.sh,frontend-admin.sh,worker.sh,grafana.sh}
touch scripts/health/{checks.sh,wait.sh,status.sh}
touch scripts/logs/{rotate.sh,viewer.sh,cleanup.sh}
touch scripts/profiles/{save.sh,load.sh}
touch scripts/validation/{prerequisites.sh,dependencies.sh,env.sh}

# Permissões de execução
chmod +x scripts/**/*.sh
```

**Custo:** ~$0.50 (geração de headers + estrutura básica)

---

### Fase 2: Extrair Módulo `common/` (30 min)
**Objetivo:** Centralizar cores, configs e utilitários

#### 2.1: `scripts/common/colors.sh` (~50 linhas)
```bash
# Extrair variáveis de cores (linhas 1-50 do original)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
# ... todas as cores
```

#### 2.2: `scripts/common/config.sh` (~100 linhas)
```bash
# Extrair configurações (linhas 60-160 do original)
BACKEND_PORT=3001
FRONTEND_PORT=3000
PID_FILE_BACKEND="$LOG_DIR/backend.pid"
# ... todas as configs
```

#### 2.3: `scripts/common/utils.sh` (~200 linhas)
```bash
# Extrair funções utilitárias
debug_log()
check_port_available()
cleanup_orphan_pids()
graceful_kill()
```

**Custo:** ~$1.50 (extração + testes)

---

### Fase 3: Extrair Módulo `ui/` (40 min)
**Objetivo:** Isolar toda a interface do usuário

#### 3.1: `scripts/ui/drawing.sh` (~100 linhas)
```bash
clear_screen()
hide_cursor()
show_cursor()
draw_box_top()
draw_box_middle()
draw_box_bottom()
```

#### 3.2: `scripts/ui/progress.sh` (~150 linhas)
```bash
draw_progress_bar()
get_status_icon()
show_progress()
```

#### 3.3: `scripts/ui/menu.sh` (~250 linhas)
```bash
show_menu()
toggle_service()
select_all()
deselect_all()
restart_service_menu()
```

**Custo:** ~$2.00 (extração + testes visuais)

---

### Fase 4: Extrair Módulo `services/` (60 min) ⭐ **CRÍTICO**
**Objetivo:** Modularizar start/stop de cada serviço

#### 4.1: `scripts/services/database.sh` (~100 linhas)
```bash
start_database()    # Com correção de health check
stop_database()
restart_database()
```

#### 4.2: `scripts/services/backend.sh` (~120 linhas)
```bash
start_backend_service()
stop_backend()
restart_backend()
```

#### 4.3: `scripts/services/frontend.sh` (~100 linhas)
```bash
start_frontend_service()
stop_frontend()
restart_frontend()
```

#### 4.4: `scripts/services/frontend-admin.sh` (~100 linhas)
```bash
start_frontend_admin_service()
stop_frontend_admin()
restart_frontend_admin()
```

#### 4.5: `scripts/services/worker.sh` (~100 linhas)
```bash
start_worker_service()
stop_worker()
restart_worker()
```

#### 4.6: `scripts/services/grafana.sh` (~150 linhas) 🔧 **CORREÇÃO APLICADA**
```bash
start_grafana_service()    # ← Health check HTTP (não lsof)
stop_grafana()
restart_grafana()
```

**Custo:** ~$3.00 (maior módulo, mais testes necessários)

---

### Fase 5: Extrair Módulos `health/`, `logs/`, `profiles/` (40 min)
**Objetivo:** Funcionalidades auxiliares

#### 5.1: `scripts/health/` (~350 linhas total)
```bash
# checks.sh (150 linhas)
check_service_status()
update_running_status()

# wait.sh (100 linhas)
wait_for_port()

# status.sh (200 linhas)
get_uptime()
show_status()
show_completion_summary()
```

#### 5.2: `scripts/logs/` (~330 linhas total)
```bash
# rotate.sh (100 linhas)
rotate_logs()

# viewer.sh (150 linhas)
view_logs_menu()
show_error_logs()

# cleanup.sh (80 linhas)
clean_old_logs()
```

#### 5.3: `scripts/profiles/` (~240 linhas total)
```bash
# save.sh (120 linhas)
save_profile()

# load.sh (120 linhas)
load_profile()
```

**Custo:** ~$1.50 (módulos mais simples)

---

### Fase 6: Extrair Módulo `validation/` (30 min)
**Objetivo:** Centralizar validações

#### 6.1: `scripts/validation/prerequisites.sh` (~150 linhas)
```bash
check_prerequisites()    # Node, Docker, npm
```

#### 6.2: `scripts/validation/dependencies.sh` (~100 linhas)
```bash
validate_service_dependencies()
```

#### 6.3: `scripts/validation/env.sh` (~100 linhas)
```bash
validate_env_files()
validate_directories()
```

**Custo:** ~$1.00

---

### Fase 7: Criar Orquestrador Principal (40 min)
**Objetivo:** `start_interactive.sh` limpo e enxuto

#### `start_interactive.sh` (~200 linhas)
```bash
#!/usr/bin/env bash
# start_interactive.sh
# LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

# ============================================================================
# IMPORTS (Carregar todos os módulos)
# ============================================================================
source scripts/common/colors.sh
source scripts/common/config.sh
source scripts/common/utils.sh
source scripts/ui/drawing.sh
source scripts/ui/progress.sh
source scripts/ui/menu.sh
source scripts/services/database.sh
source scripts/services/backend.sh
source scripts/services/frontend.sh
source scripts/services/frontend-admin.sh
source scripts/services/worker.sh
source scripts/services/grafana.sh
source scripts/health/checks.sh
source scripts/health/wait.sh
source scripts/health/status.sh
source scripts/logs/rotate.sh
source scripts/logs/viewer.sh
source scripts/logs/cleanup.sh
source scripts/profiles/save.sh
source scripts/profiles/load.sh
source scripts/validation/prerequisites.sh
source scripts/validation/dependencies.sh
source scripts/validation/env.sh

# ============================================================================
# ORQUESTRAÇÃO PRINCIPAL
# ============================================================================
start_selected_services() {
  # Lógica de orquestração (já usa funções dos módulos)
}

stop_all_services() {
  # Para todos os serviços
}

main() {
  # Loop interativo principal
  while true; do
    show_menu
    read -r choice
    case "$choice" in
      1-6) toggle_service "$choice" ;;
      7) start_selected_services ;;
      8) show_status ;;
      9) stop_all_services ;;
      r) restart_service_menu ;;
      l) view_logs_menu ;;
      c) clean_old_logs ;;
      s) save_profile ;;
      p) load_profile ;;
      0) exit 0 ;;
    esac
  done
}

# Executar
main "$@"
```

**Custo:** ~$1.00

---

## 💰 Resumo de Custos (Sonnet 4.5)

| Fase | Módulo | Linhas | Tempo | Custo (USD) |
|------|--------|--------|-------|-------------|
| 1 | Estrutura base | - | 10 min | $0.50 |
| 2 | `common/` | 350 | 30 min | $1.50 |
| 3 | `ui/` | 500 | 40 min | $2.00 |
| 4 | `services/` ⭐ | 670 | 60 min | $3.00 |
| 5 | `health/logs/profiles/` | 920 | 40 min | $1.50 |
| 6 | `validation/` | 350 | 30 min | $1.00 |
| 7 | Orquestrador principal | 200 | 40 min | $1.00 |
| **TOTAL** | **18 arquivos** | **~2.990** | **~4h** | **~$10.50** |

**Observação:** Estimativa conservadora. Pode ser menos se não houver muitas iterações.

---

## ✅ Benefícios Esperados

### Antes da Modularização
```
start_interactive.sh (2.038 linhas)
├── ❌ Viola STANDARDS.md § 15 (509% acima do limite)
├── ❌ Difícil de manter/debugar
├── ❌ Impossível de testar módulos isolados
├── ❌ Pre-commit hook BLOQUEIA commits
└── ❌ Onboarding de novos devs leva horas
```

### Depois da Modularização
```
start_interactive.sh (200 linhas) + 18 módulos (≤250 linhas cada)
├── ✅ Conforme STANDARDS.md § 15
├── ✅ Fácil de manter (1 módulo = 1 responsabilidade)
├── ✅ Testável (cada módulo pode ter testes isolados)
├── ✅ Pre-commit hook PASSA
├── ✅ Onboarding simplificado (docs por módulo)
├── ✅ Reutilizável (outros scripts podem usar módulos)
└── ✅ CORREÇÃO DO GRAFANA já aplicada (health check HTTP)
```

---

## 🧪 Plano de Testes

### Teste 1: Inicialização Completa
```bash
./start_interactive.sh
# Selecionar "7. INICIAR TUDO"
# Verificar: Todos os 6 serviços iniciam? ✅
```

### Teste 2: Inicialização Parcial
```bash
./start_interactive.sh
# Selecionar apenas: 1 (Database), 2 (Backend), 6 (Grafana)
# Verificar: Apenas 3 serviços iniciam? ✅
```

### Teste 3: Grafana Health Check (CRÍTICO)
```bash
./start_interactive.sh
# Selecionar apenas: 6 (Grafana)
# Verificar:
#   - Progresso chega a 100%? ✅
#   - Status final: ✅ (não ❌)? ✅
#   - Grafana acessível em http://localhost:3002? ✅
```

### Teste 4: Reinicialização
```bash
# Iniciar todos
./start_interactive.sh
# Pressionar "r" (Reiniciar)
# Selecionar "3. Frontend"
# Verificar: Frontend reinicia sem afetar outros? ✅
```

### Teste 5: Logs
```bash
./start_interactive.sh
# Pressionar "l" (Ver logs)
# Selecionar "1. Backend"
# Verificar: Logs aparecem em tempo real? ✅
```

### Teste 6: Perfis
```bash
# Salvar perfil
./start_interactive.sh
# Selecionar: 1,2,3 (Database, Backend, Frontend)
# Pressionar "s" (Salvar perfil)
# Nome: "dev-essentials"
# Verificar: Arquivo criado em ~/.myia-profiles/? ✅

# Carregar perfil
./start_interactive.sh
# Pressionar "p" (Carregar perfil)
# Selecionar "dev-essentials"
# Verificar: Mesmos 3 serviços selecionados? ✅
```

---

## 🚀 Ordem de Implementação Recomendada

### ✅ Fase 1: Fundação (Fases 1-2) - 40 min - $2.00
- Criar estrutura de diretórios
- Extrair `common/` (cores, configs, utils)
- **Checkpoint:** Scripts importam colors.sh com sucesso

### ✅ Fase 2: Interface (Fase 3) - 40 min - $2.00
- Extrair `ui/` (menu, progress, drawing)
- **Checkpoint:** Menu interativo funciona

### ✅ Fase 3: Serviços (Fase 4) - 60 min - $3.00 ⭐ **MAIS IMPORTANTE**
- Extrair `services/` (database, backend, frontend, admin, worker, grafana)
- **APLICAR CORREÇÃO DO GRAFANA** (health check HTTP)
- **Checkpoint:** Iniciar todos os serviços funciona

### ✅ Fase 4: Auxiliares (Fases 5-6) - 70 min - $2.50
- Extrair `health/`, `logs/`, `profiles/`, `validation/`
- **Checkpoint:** Health checks, logs e perfis funcionam

### ✅ Fase 5: Orquestrador (Fase 7) - 40 min - $1.00
- Criar `start_interactive.sh` final (200 linhas)
- **Checkpoint:** Script completo funciona end-to-end

**TOTAL:** ~4h | ~$10.50

---

## 📝 Notas de Implementação

### Correções Aplicadas Durante Modularização

1. **Grafana Health Check** (`scripts/services/grafana.sh`)
   - ❌ Antes: `lsof -ti:3002` (falha com Docker)
   - ✅ Depois: `curl http://localhost:3002/api/health` (funciona sempre)
   - ✅ Fallback: `docker ps | grep myia-grafana`

2. **Imports Relativos**
   - Todos os `source` usam caminhos relativos a raiz
   - Ex: `source scripts/common/colors.sh` (não `./colors.sh`)

3. **Headers Obrigatórios**
   - Todo arquivo tem caminho relativo + referência ao STANDARDS.md
   - Ex: `# scripts/services/grafana.sh`

---

## ✅ Checklist de Conformidade Final

Após modularização completa:

- [ ] Nenhum arquivo excede 400 linhas? ✅
- [ ] Todos têm header obrigatório? ✅
- [ ] Pre-commit hook passa? ✅
- [ ] Testes manuais passam (6 cenários)? ✅
- [ ] Correção do Grafana aplicada? ✅
- [ ] Documentação atualizada? ✅
- [ ] Git commit com mensagem descritiva? ✅

---

## 🎯 Próximos Passos

1. **APROVAR este plano** ← VOCÊ ESTÁ AQUI
2. **Executar Fase 1** (criar estrutura)
3. **Executar Fases 2-7** (modularização incremental)
4. **Testes manuais** (6 cenários)
5. **Commit final** (`refactor: modularize start_interactive.sh (2038→200 lines)`)
6. **Atualizar STANDARDS.md** (adicionar § 16 - Organização de Scripts)

---

**Quer iniciar a Fase 1 agora?** (~40 min, $2)
