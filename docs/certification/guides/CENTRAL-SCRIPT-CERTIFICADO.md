# CENTRAL DE COORDENAÇÃO - CORREÇÃO DO SCRIPT DE CERTIFICAÇÕES

> **Arquivo Central de Gerenciamento**: Este documento é a fonte única de verdade para todos os modos envolvidos na correção completa do script [`manage-certifications.sh`](manage-certifications.sh).

---

## 🎯 OBJETIVO

Corrigir completamente o script [`manage-certifications.sh`](manage-certifications.sh) para que todas as 16 funcionalidades operem sem erros, incluindo:
- Detecção correta de serviços (Backend, Worker, Redis, PostgreSQL)
- Comunicação funcional com APIs
- Gerenciamento de fila Bull/Redis
- Exibição de estatísticas e logs
- Funcionalidade de tela travada/destravada

---

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. Detecção de Serviços Incorreta
**Evidência**: Output mostra "Backend (API): ✗ Não está rodando" mas `./start.sh status` mostra PID 169243 ativo
**Impacto**: Usuário não consegue confiar no status do sistema

### 2. Redis Inacessível
**Evidência**: "Redis: ✗ Não acessível"
**Impacto**: Não consegue obter estatísticas da fila Bull

### 3. Worker Não Detectado
**Evidência**: "Worker: ✗ Não está rodando"
**Impacto**: Sistema de certificação pode estar inoperante

### 4. Estatísticas da Fila Falham
**Evidência**: "✗ Não foi possível obter estatísticas"
**Impacto**: Usuário não tem visibilidade do estado da fila

---

## 🏗️ ARQUITETURA DO SISTEMA

### Serviços
- **Backend API**: Porta 3001 (Express + TypeScript)
- **Worker**: Processa jobs Bull (certificationWorker.ts)
- **Redis**: Porta 6379 (Bull Queue)
- **PostgreSQL**: Porta 5432 (Prisma ORM)
- **Frontend**: Porta 3000
- **Frontend Admin**: Porta 3003
- **Grafana**: Porta 3002

### APIs Relevantes
```
GET  /api/certification-queue/stats
GET  /api/certification-queue/jobs
POST /api/certification-queue/jobs
GET  /api/certification-queue/jobs/:id
DELETE /api/certification-queue/jobs/:id
POST /api/certification-queue/clean
GET  /api/certification-queue/logs
```

### Comandos de Detecção
```bash
# Backend
lsof -ti:3001 || pgrep -f "node.*backend/src/server"

# Worker
pgrep -f "certificationWorker"

# Redis
redis-cli ping

# PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1" -t
```

---

## 📋 CAPACIDADES DO ORQUESTRADOR

### Modos Disponíveis
1. **architect** - Planejamento e design de soluções
2. **code** - Implementação de código
3. **code-reviewer** - Revisão e aprovação de código
4. **test-engineer** - Testes e validação
5. **debug** - Investigação de problemas
6. **frontend-specialist** - Especialista React/TypeScript
7. **docs-specialist** - Documentação técnica

### Ferramentas Disponíveis
- `new_task`: Delegar tarefas para modos especializados
- `switch_mode`: Mudar de modo quando necessário
- `update_todo_list`: Rastrear progresso

### Regras de Delegação
- Cada subtarefa deve ter escopo claro e limitado
- Fornecer todo contexto necessário na mensagem
- Instruir uso de `attempt_completion` ao finalizar
- Estas instruções superam instruções gerais do modo

---

## 📝 REGRAS DE ATUALIZAÇÃO DESTE ARQUIVO

### Permitido Adicionar
✅ Descobertas técnicas relevantes (comandos, APIs, bugs)
✅ Soluções testadas e validadas
✅ Referências a arquivos críticos com links
✅ Comandos de diagnóstico úteis

### Proibido Adicionar
❌ Conversas ou discussões
❌ Código completo (apenas referências)
❌ Informações redundantes
❌ Especulações não verificadas

### Formato de Adição
```markdown
## [SEÇÃO] - [TÍTULO]
**Adicionado por**: [modo]
**Data**: [timestamp]
**Conteúdo**: [informação concisa e acionável]
```

---

## 🔄 WORKFLOW DE CORREÇÃO

### Fase 1: Planejamento (Architect)
- Analisar problemas identificados
- Criar plano de correção detalhado
- Priorizar correções por impacto

### Fase 2: Revisão (Code Reviewer)
- Revisar plano proposto
- Sugerir melhorias
- Aprovar ou solicitar ajustes

### Fase 3: Implementação (Code)
- Executar plano aprovado
- Aplicar correções no script
- Documentar mudanças

### Fase 4: Validação (Test Engineer)
- Testar todas as 16 funcionalidades
- Validar detecção de serviços
- Confirmar comunicação com APIs
- Gerar relatório de testes

---

## 📊 STATUS ATUAL

**Última Atualização**: 2026-02-02T15:47:00Z  
**Fase Atual**: Correção de Bugs Identificados  
**Próximo Passo**: Corrigir Bug #1 (autenticação API)

### Progresso do Projeto

- [x] **Fase 1**: Planejamento (Architect) - ✅ Completo
- [x] **Fase 2**: Revisão (Code Reviewer) - ✅ Completo
- [x] **Fase 3**: Implementação (Code) - ✅ Completo
- [x] **Fase 4**: Validação (Test Engineer) - ✅ Completo
- [ ] **Fase 5**: Correção de Bugs - 🔄 Em Andamento
  - [ ] Bug #1: Autenticação API (CRÍTICO)
  - [ ] Bug #2: Documentação redis-cli (RECOMENDADO)
- [ ] **Fase 6**: Validação Final - ⏳ Pendente

### Métricas Atuais

- **Taxa de Sucesso**: 81% (13/16 testes)
- **Bugs Críticos**: 1 (autenticação API)
- **Bugs Médios**: 1 (documentação)
- **Funções Corrigidas**: 4/4 (100%)
- **Linhas Modificadas**: ~130

---

## 📚 APRENDIZADOS DA FASE 1

**Adicionado por**: orchestrator  
**Data**: 2026-02-02T15:47:00Z

### ✅ Sucessos do Workflow Orquestrado

1. **Arquivo Central Efetivo**
   - Manteve todos os modos alinhados com contexto único
   - Evitou perda de informação entre delegações
   - Facilitou rastreamento de progresso

2. **Revisão Técnica Crítica**
   - Code Reviewer identificou problema crítico: worker é integrado, não standalone
   - Correção aplicada antes da implementação evitou retrabalho
   - 3 correções obrigatórias aplicadas com sucesso

3. **Implementação Robusta**
   - 4 funções modificadas com múltiplos fallbacks
   - 130 linhas de código alteradas
   - 100% das soluções implementadas corretamente

4. **Validação Completa**
   - 16 testes executados sistematicamente
   - 81% de taxa de sucesso (13/16)
   - 2 bugs identificados antes de produção

### ⚠️ Desafios Encontrados

1. **Autenticação API Não Prevista**
   - Problema: Script não obtém token JWT para chamadas API
   - Impacto: Fallback de Redis e estatísticas não funcionam
   - Lição: Validar requisitos de autenticação antes de implementar integrações

2. **Dependências Opcionais Não Documentadas**
   - Problema: `redis-cli` não listado em dependências
   - Impacto: Usuário não sabe que falta ferramenta opcional
   - Lição: Documentar todas as dependências (obrigatórias e opcionais)

3. **Validação de Estrutura JSON Tardia**
   - Problema: Estrutura JSON validada durante implementação
   - Impacto: Código preparado para 3 estruturas, apenas 1 necessária
   - Lição: Validar APIs e estruturas de dados antes de codificar

### 🎯 Melhorias para Próximas Fases

1. **Checklist de Pré-Implementação**
   - Validar autenticação de APIs
   - Listar todas as dependências (obrigatórias + opcionais)
   - Testar estruturas de dados reais

2. **Smoke Tests**
   - Adicionar fase de testes rápidos antes da validação completa
   - Identificar problemas críticos mais cedo

3. **Documentação Contínua**
   - Atualizar README conforme implementação
   - Documentar decisões técnicas em tempo real

---

## 🐛 BUGS IDENTIFICADOS - FASE 1

**Adicionado por**: test-engineer  
**Data**: 2026-02-02T15:39:00Z

### Bug #1: Autenticação API Não Implementada

**Severidade**: 🔴 **ALTA** (CRÍTICO)  
**Status**: Identificado, aguardando correção  
**Impacto**: Fallback de Redis não funciona, estatísticas da fila não exibidas

**Descrição**:
O script [`manage-certifications.sh`](manage-certifications.sh) não implementa autenticação nas chamadas à API. A API requer token JWT, mas o script não obtém nem passa o token, causando erro 401 (No token provided).

**Localização**:
- [`manage-certifications.sh:33`](manage-certifications.sh:33) - Variável `API_TOKEN` vazia
- [`manage-certifications.sh:185-187`](manage-certifications.sh:185) - Condição que adiciona token (nunca executada)
- [`manage-certifications.sh:228-253`](manage-certifications.sh:228) - Função `check_redis()` (fallback via API falha)
- [`manage-certifications.sh:361-419`](manage-certifications.sh:361) - Função `show_status()` (estatísticas não exibidas)

**Evidência**:
```bash
$ curl -s http://localhost:3001/api/certification-queue/stats
Error: No token provided
```

**Solução Proposta**:
```bash
# Adicionar função de login automático
login_to_api() {
  if [ -z "$API_TOKEN" ]; then
    print_verbose "Fazendo login na API..."
    local response
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"123@123.com","password":"123123"}' 2>/dev/null || echo "")
    
    if echo "$response" | jq -e '.status == "success"' >/dev/null 2>&1; then
      API_TOKEN=$(echo "$response" | jq -r '.data.token')
      print_verbose "Token obtido com sucesso"
    else
      print_warning "Não foi possível fazer login na API"
    fi
  fi
}

# Chamar após check_dependencies() no início do script
```

**Testes Afetados**:
- Critério 2: Detecção de Redis (fallback via API)
- Critério 4: Estatísticas da Fila

**Prioridade**: 🔴 **OBRIGATÓRIA** antes de considerar projeto completo

---

### Bug #2: Dependência redis-cli Não Documentada

**Severidade**: 🟡 **MÉDIA**  
**Status**: Identificado, aguardando correção  
**Impacto**: Usuário não sabe que falta dependência opcional

**Descrição**:
O script depende de `redis-cli` para detecção primária de Redis, mas esta dependência não está documentada nem verificada na função [`check_dependencies()`](manage-certifications.sh:143).

**Localização**:
- [`manage-certifications.sh:143-167`](manage-certifications.sh:143) - Função `check_dependencies()` (não lista redis-cli)
- [`manage-certifications.sh:228-253`](manage-certifications.sh:228) - Função `check_redis()` (usa redis-cli sem verificar)

**Comportamento Atual**:
- `redis-cli` não listado em dependências
- Sem aviso se comando não existir
- Fallback via API não funciona (Bug #1)

**Solução Proposta**:
```bash
check_dependencies() {
  local missing=()
  local optional_missing=()
  
  # Dependências obrigatórias
  for cmd in curl jq psql; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      missing+=("$cmd")
    fi
  done
  
  # Dependências opcionais
  for cmd in redis-cli lsof; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      optional_missing+=("$cmd")
    fi
  done
  
  if [ ${#missing[@]} -gt 0 ]; then
    print_error "Dependências obrigatórias faltando: ${missing[*]}"
    print_info "Instale com: sudo dnf install ${missing[*]}"
    return 1
  fi
  
  if [ ${#optional_missing[@]} -gt 0 ]; then
    print_warning "Dependências opcionais faltando: ${optional_missing[*]}"
    print_info "Algumas funcionalidades podem ter desempenho reduzido"
    print_info "Instale com: sudo dnf install ${optional_missing[*]}"
  fi
  
  return 0
}
```

**Prioridade**: 🟡 **RECOMENDADA** para melhor experiência do usuário

---

## 🔗 ARQUIVOS CRÍTICOS

- [`manage-certifications.sh`](manage-certifications.sh) - Script principal (35KB, ~1200 linhas)
- [`backend/src/services/queue/CertificationQueueService.ts`](backend/src/services/queue/CertificationQueueService.ts) - Serviço de fila
- [`backend/src/workers/certificationWorker.ts`](backend/src/workers/certificationWorker.ts) - Worker Bull
- [`backend/src/config/redis.ts`](backend/src/config/redis.ts) - Configuração Redis
- [`start.sh`](start.sh) - Script de inicialização dos serviços

---

## 📚 CONTEXTO ADICIONAL

### Credenciais de Teste
- Login: 123@123.com
- Senha: 123123

### URLs de Acesso
- Frontend: http://localhost:3000
- Frontend Admin: http://localhost:3003
- Backend API: http://localhost:3001
- Grafana: http://localhost:3002

### Comandos Úteis
```bash
# Status dos serviços
./start.sh status

# Iniciar serviços
./start.sh start both

# Testar API de certificação
curl http://localhost:3001/api/certification-queue/stats

# Verificar Redis
redis-cli ping

# Verificar PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1"
```
