# Sistema de Logging - Arquitetura e Implementação

> **Fonte de Verdade:** Documento completo sobre o sistema de logging  
> **Última atualização:** 04/02/2026  
> **Consolidado de:** LOGGING-SYSTEM-PROPOSAL.md, LOGGING-ENHANCEMENT-PROPOSAL.md, LOGGING-IMPLEMENTATION-PLAN.md, LOGGING-IMPLEMENTATION-PLAN-PART2.md

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Implementação](#implementação)
4. [Melhorias](#melhorias)
5. [Histórico](#histórico)

---

## 🏗️ Visão Geral

> **Origem:** LOGGING-SYSTEM-PROPOSAL.md

### Resumo Executivo

Esta proposta apresenta um **sistema de logging estruturado e observabilidade** para o projeto MyIA, desenvolvido com base em:

* ✅ Requisitos validados com o usuário
* ✅ Solução self-hosted (sem custos externos)
* ✅ Arquitetura faseada (MVP → Produção → Observabilidade)
* ✅ Garantia de não-retrabalho entre fases
* ✅ Integração com infraestrutura existente (PostgreSQL)

### Solução Proposta

**Winston + SQLite (MVP) → PostgreSQL (Produção) → Grafana + Loki (Observabilidade)**

### Benefícios Principais

| Benefício | Descrição |
|-----------|-----------|
| 🔍 **Rastreabilidade** | Correlação entre logs, requisições e inferências |
| 📊 **Observabilidade** | Dashboards e alertas em tempo real |
| 💰 **Custo Zero** | Self-hosted, sem serviços externos |
| 🚀 **Escalável** | Suporta crescimento sem retrabalho |
| 🔒 **Compliance** | Logs auditáveis para governança |

---

### Requisitos Validados

#### Requisitos Funcionais

1. **Logs Estruturados:** Formato JSON padronizado
2. **Níveis de Log:** info, warn, error, debug
3. **Persistência:** Armazenamento para análise histórica
4. **Correlação:** requestId, userId, inferenceId
5. **Performance:** Métricas de latência e duração
6. **Erros:** Stack traces (apenas desenvolvimento)

#### Requisitos Não-Funcionais

1. **Self-Hosted:** Sem dependência de serviços externos
2. **Custo Zero:** Sem CloudWatch, Datadog, etc.
3. **Escalável:** Suportar crescimento sem retrabalho
4. **Manutenível:** Código simples e documentado
5. **Performático:** Impacto mínimo na aplicação

#### Requisitos de Negócio

1. **Debugging Eficiente:** Reduzir tempo de investigação de erros
2. **Governança:** Logs auditáveis para compliance
3. **Observabilidade:** Visibilidade em tempo real
4. **Retenção:** 30 dias (configurável)

---

## 🏗️ Arquitetura

> **Origem:** LOGGING-SYSTEM-PROPOSAL.md

### Arquitetura de Fases

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1: MVP                               │
│  Winston + SQLite + Middleware + Migração console.log       │
│  Tempo: 1-2 semanas | Risco: Baixo                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 FASE 2: PRODUÇÃO                             │
│  PostgreSQL + Retenção + Índices + Busca Avançada          │
│  Tempo: 3-4 semanas | Risco: Baixo-Médio                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FASE 3: OBSERVABILIDADE                         │
│  Grafana + Loki + Dashboards + Alertas + SSE               │
│  Tempo: 4-6 semanas | Risco: Médio                         │
└─────────────────────────────────────────────────────────────┘
```

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO MyIA                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Winston Logger (Core)                    │   │
│  │  • Estrutura padronizada (LogEntry)                  │   │
│  │  • Níveis: info, warn, error, debug                  │   │
│  │  • Contexto: requestId, userId, inferenceId          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Console    │   │  File (.log) │   │   Database   │
│  (Dev only)  │   │  (Fallback)  │   │   (Primary)  │
└──────────────┘   └──────────────┘   └──────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
            │  FASE 1: MVP │        │ FASE 2: PROD │        │ FASE 3: OBS  │
            │              │        │              │        │              │
            │   SQLite     │   →    │ PostgreSQL   │   →    │ Grafana +    │
            │   (Local)    │        │  (Prod DB)   │        │    Loki      │
            └──────────────┘        └──────────────┘        └──────────────┘
             1-2 dias                  1 dia                   2-3 dias
```

---

### Fase 1: MVP (Winston + SQLite)

**Objetivo:** Implementar logging estruturado com armazenamento local

**Componentes:**
* Winston (biblioteca de logging)
* SQLite (banco de dados local)
* Transports: Console + File + SQLite

**Entregáveis:**
* Logger configurado e funcional
* Estrutura de log padronizada
* Migração de `console.log` para `logger`
* Middleware de `requestId`

**Tempo:** 1-2 dias

---

### Fase 2: Produção (Winston + PostgreSQL)

**Objetivo:** Migrar armazenamento para PostgreSQL (já usado no projeto)

**Componentes:**
* Winston (mesmo código)
* PostgreSQL (banco existente)
* Retenção automática (30 dias)
* Índices de performance

**Entregáveis:**
* Migration PostgreSQL (`logs` table)
* Transport PostgreSQL configurado
* Retenção automática (cron job)
* Queries de análise

**Tempo:** 1 dia

---

### Fase 3: Observabilidade (Grafana + Loki)

**Objetivo:** Dashboards e alertas em tempo real

**Componentes:**
* Grafana (visualização)
* Loki (agregação de logs)
* Prometheus (métricas)
* Alertmanager (alertas)

**Entregáveis:**
* Docker Compose configurado
* Dashboards (erros, latência, uso)
* Alertas (erro rate, latência)
* Documentação de uso

**Tempo:** 2-3 dias

---

## 📝 Estrutura de Log Padronizada

### Interface TypeScript

```typescript
// backend/src/types/logging.ts
interface LogEntry {
  // ===== METADADOS OBRIGATÓRIOS =====
  timestamp: string;        // ISO 8601 (ex: "2026-01-26T18:00:00.000Z")
  level: LogLevel;          // 'info' | 'warn' | 'error' | 'debug'
  message: string;          // Descrição legível
  
  // ===== CONTEXTO DE REQUISIÇÃO =====
  requestId?: string;       // UUID da requisição HTTP
  userId?: string;          // ID do usuário autenticado
  ip?: string;              // IP do cliente (opcional)
  userAgent?: string;       // User-Agent (opcional)
  
  // ===== CONTEXTO DE INFERÊNCIA =====
  inferenceId?: string;     // ID da inferência (se aplicável)
  provider?: string;        // Provider usado (bedrock, openai)
  model?: string;           // Modelo usado (claude-3-sonnet)
  
  // ===== DADOS ADICIONAIS =====
  metadata?: Record<string, unknown>;  // Dados customizados
  error?: {
    name: string;           // Nome do erro (ex: "ValidationError")
    message: string;        // Mensagem do erro
    stack?: string;         // Stack trace (APENAS em desenvolvimento)
    code?: string;          // Código de erro customizado
  };
  
  // ===== PERFORMANCE =====
  duration?: number;        // Duração da operação (ms)
  statusCode?: number;      // HTTP status code
  
  // ===== AUDITORIA =====
  action?: string;          // Ação executada (ex: "user.login")
  resource?: string;        // Recurso afetado (ex: "chat.123")
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
```

### Exemplo de Log Completo

```json
{
  "timestamp": "2026-01-26T18:00:00.000Z",
  "level": "info",
  "message": "Inference completed successfully",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "inferenceId": "inf-456",
  "provider": "bedrock",
  "model": "anthropic.claude-3-sonnet-20240229-v1:0",
  "duration": 1234,
  "statusCode": 200,
  "metadata": {
    "tokens": 500,
    "cost": 0.01,
    "strategy": "rag"
  }
}
```

---

## 🛡️ Garantias de Não-Retrabalho

### Princípio: Código de Aplicação Imutável

**O código que usa o logger NÃO MUDA entre fases.**

```typescript
// ✅ MESMO CÓDIGO nas 3 fases
logger.info('Inference completed', {
  requestId: req.id,
  userId: req.user.id,
  inferenceId: inference.id,
  provider: 'bedrock',
  model: 'claude-3-sonnet',
  duration: 1234,
  metadata: { tokens: 500, cost: 0.01 }
});
```

### Migração SQLite → PostgreSQL

**O que muda:**
* Apenas configuração de transport Winston
* Migration PostgreSQL (criar tabela)

**O que NÃO muda:**
* Código de aplicação
* Estrutura de log (LogEntry)
* Chamadas `logger.info/warn/error`

### Migração PostgreSQL → Loki

**O que muda:**
* Adicionar Loki como consumidor de logs
* Configurar Grafana dashboards

**O que NÃO muda:**
* Código de aplicação
* Estrutura de log (LogEntry)
* Armazenamento PostgreSQL (continua funcionando)

---

## 💻 Implementação

> **Origem:** LOGGING-IMPLEMENTATION-PLAN.md, LOGGING-IMPLEMENTATION-PLAN-PART2.md

### Fase 1: MVP (Winston + SQLite)

#### Objetivos Mensuráveis

- [ ] Winston instalado e configurado com 3 transports (Console, File, SQLite)
- [ ] Interface `LogEntry` criada e documentada
- [ ] Middleware `requestId` funcionando em todas as rotas
- [ ] 100% dos `console.log` migrados para `logger`
- [ ] Testes unitários com cobertura > 80%
- [ ] Performance < 5ms por log

#### Duração Estimada
**1-2 semanas** (10-15 dias úteis)

#### Tarefas Principais

1. **Instalar e Configurar Winston**
   - Instalar dependências Winston
   - Criar arquivo `logger.ts`
   - Configurar transports (Console, File, SQLite)
   - Criar diretório `logs/` e configurar `.gitignore`

2. **Criar Interface LogEntry**
   - Criar arquivo `backend/src/types/logging.ts`
   - Definir interface `LogEntry`
   - Definir type `LogLevel`
   - Documentar campos com JSDoc

3. **Implementar Middleware requestId**
   - Criar arquivo `backend/src/middleware/requestId.ts`
   - Implementar geração de UUID
   - Adicionar header `X-Request-ID`
   - Integrar no `server.ts`

4. **Migrar console.log para logger**
   - Identificar todos os `console.log/error/warn` no backend
   - Substituir por `logger.info/error/warn`
   - Adicionar contexto (requestId, userId)
   - Remover `console.log` de produção

5. **Criar Testes Unitários**
   - Criar testes para `logger.ts`
   - Criar testes para `requestIdMiddleware`
   - Criar testes de integração (logger + middleware)
   - Validar cobertura > 80%

6. **Documentação e Validação Final**
   - Atualizar `STANDARDS.md` (Seção 13)
   - Criar guia de uso do logger
   - Documentar exemplos práticos
   - Validar performance (< 5ms por log)

---

### Fase 2: Produção (PostgreSQL)

#### Objetivos Mensuráveis

- [ ] Migration PostgreSQL criada e aplicada
- [ ] Transport PostgreSQL configurado
- [ ] Retenção automática (30 dias) funcionando
- [ ] Índices de performance criados
- [ ] Busca avançada implementada (filtros, paginação)
- [ ] Dashboard básico de logs (SSE)
- [ ] Performance de queries < 100ms

#### Duração Estimada
**3-4 semanas** (15-20 dias úteis)

#### Tarefas Principais

1. **Criar Migration PostgreSQL**
   - Criar migration Prisma para tabela `logs`
   - Definir schema com todos os campos de `LogEntry`
   - Criar índices de performance
   - Criar função de retenção automática

2. **Configurar Transport PostgreSQL**
   - Instalar `winston-postgres` ou criar transport customizado
   - Configurar conexão com PostgreSQL
   - Atualizar `logger.ts`
   - Testar persistência

3. **Implementar Retenção Automática**
   - Criar função PostgreSQL `cleanup_old_logs()`
   - Configurar cron job (pg_cron ou script Node.js)
   - Testar retenção (30 dias)
   - Adicionar logs de auditoria da limpeza

4. **Busca Avançada e Dashboard SSE**
   - Implementar endpoint `/api/logs` com filtros
   - SSE para streaming em tempo real
   - Dashboard renderizando 1000+ logs sem lag

---

### Fase 3: Observabilidade (Grafana + Loki)

#### Objetivos Mensuráveis

- [ ] Docker Compose funcionando (Loki + Grafana + Promtail)
- [ ] Loki consumindo logs em tempo real (latência < 5s)
- [ ] 3 Dashboards criados e funcionando
- [ ] Alertas configurados e disparando
- [ ] Documentação completa

#### Duração Estimada
**4-6 semanas** (20-30 dias úteis)

#### Tarefas Principais

1. **Docker Compose (Loki + Grafana + Promtail)**
   - YAML válido e serviços iniciando
   - Loki acessível em http://localhost:3100
   - Grafana acessível em http://localhost:3001

2. **Configurar Loki**
   - Loki recebendo logs do backend
   - Retenção de 30 dias configurada
   - Latência < 5s (do log até Loki)

3. **Dashboards Grafana**
   - **Dashboard de Erros:** Taxa de erro, Top 10 erros, Erros por endpoint, Timeline
   - **Dashboard de Latência:** P50, P95, P99, Latência por endpoint/provider/model
   - **Dashboard de Uso:** Requisições/minuto, Usuários ativos, Uso por provider, Custos

4. **Alertas**
   - **High Error Rate:** Taxa de erro > 5% em 5 minutos
   - **High Latency:** P95 > 2s em 5 minutos

---

## ⚡ Melhorias

> **Origem:** LOGGING-ENHANCEMENT-PROPOSAL.md

### Situação Atual

✅ **Implementado:**
- Sistema de logging básico (Winston + PostgreSQL + Grafana)
- Transport PostgreSQL funcional
- Estrutura de logs definida
- Middleware de requestId
- Logs básicos em alguns controllers e services

❌ **Gaps Identificados:**
- **Falta logging HTTP estruturado** → Painéis de performance do Grafana não funcionam
- **Falta logging de negócio** → Não há rastreamento de operações críticas
- **Falta logging de integrações** → Chamadas a APIs externas (OpenAI, AWS Bedrock) sem logs estruturados
- **Falta logging de segurança** → Tentativas de login, mudanças de permissões não são auditadas
- **Inconsistência** → Alguns arquivos usam `console.log`, outros usam `logger`

### Impacto dos Gaps

| Gap | Impacto | Severidade |
|-----|---------|------------|
| Sem logging HTTP | Painéis Grafana não funcionam, impossível medir performance | 🔴 **CRÍTICO** |
| Sem logging de integrações | Falhas de API externa não são rastreadas, dificulta debug | 🔴 **CRÍTICO** |
| Sem logging de segurança | Violações de segurança não são detectadas, compliance em risco | 🟠 **ALTO** |
| Sem logging de negócio | Operações críticas não são auditadas, dificulta troubleshooting | 🟠 **ALTO** |
| Inconsistência (console.log) | Logs não estruturados, impossível consultar no Grafana | 🟡 **MÉDIO** |

### Benefícios da Implementação

✅ **Observabilidade:**
- Painéis Grafana funcionais (performance HTTP, integrações, erros)
- Rastreamento completo de requisições (requestId)
- Correlação entre logs de diferentes camadas

✅ **Debugging:**
- Identificação rápida de problemas (< 5 minutos)
- Stack traces completos em desenvolvimento
- Contexto rico para troubleshooting

✅ **Segurança:**
- Auditoria completa de ações sensíveis
- Detecção de tentativas de acesso não autorizado
- Compliance com LGPD/GDPR

✅ **Performance:**
- Identificação de endpoints lentos (> 1s)
- Monitoramento de uso de recursos (tokens, custo)
- Otimização baseada em dados reais

---

### Categorias de Logging

#### 1. HTTP Logging

**Objetivo:** Rastrear todas as requisições HTTP para medir performance e identificar problemas.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info';
  message: 'HTTP Request';
  requestId: string;
  userId?: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  contentLength: number;
  userAgent: string;
  ip: string;
  metadata?: {
    query?: object;
    bodySize?: number;
  }
}
```

#### 2. Business Logic Logging

**Objetivo:** Auditar operações de negócio críticas.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  userId: string;
  action: string;
  resource: string;
  duration: number;
  metadata?: {
    fieldsUpdated?: string[];
    previousValue?: any;
    newValue?: any;
  }
}
```

#### 3. Integration Logging

**Objetivo:** Rastrear chamadas a APIs externas e banco de dados.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  userId: string;
  provider: string;
  model?: string;
  duration: number;
  metadata?: {
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    retryCount?: number;
  }
}
```

#### 4. Security Logging

**Objetivo:** Auditar ações sensíveis e detectar ameaças.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  userId?: string;
  action: string;
  result: 'success' | 'failure';
  ip: string;
  userAgent: string;
  metadata?: {
    reason?: string;
    attemptCount?: number;
  }
}
```

---

## 🎯 Decisões Arquiteturais

### Por que Winston?

| Critério | Winston | Pino | Bunyan |
|----------|---------|------|--------|
| Comunidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Transports | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Documentação | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maturidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Decisão:** Winston (padrão Node.js, transports flexíveis)

---

### Por que SQLite (MVP)?

| Critério | SQLite | Arquivo .log | PostgreSQL |
|----------|--------|--------------|------------|
| Queries estruturadas | ✅ | ❌ | ✅ |
| Simplicidade | ✅ | ✅ | ❌ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Escalabilidade | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Migração fácil | ✅ | ❌ | N/A |

**Decisão:** SQLite (queries estruturadas + simplicidade)

---

### Por que PostgreSQL (Produção)?

| Critério | PostgreSQL | MongoDB | Elasticsearch |
|----------|------------|---------|---------------|
| Já usado no projeto | ✅ | ❌ | ❌ |
| Queries SQL | ✅ | ❌ | ❌ |
| JSONB (flexibilidade) | ✅ | ✅ | ✅ |
| Retenção automática | ✅ | ✅ | ✅ |
| Complexidade | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Decisão:** PostgreSQL (já usado, JSONB, SQL familiar)

---

### Por que Grafana + Loki?

| Critério | Grafana + Loki | ELK Stack | CloudWatch | Datadog |
|----------|----------------|-----------|------------|---------|
| Self-hosted | ✅ | ✅ | ❌ | ❌ |
| Custo | $0 | $0 | $$$ | $$$$ |
| Complexidade | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Escalabilidade | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Dashboards | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Decisão:** Grafana + Loki (self-hosted, custo zero, dashboards poderosos)

---

## 📚 Histórico

### Documentos Consolidados

Este documento consolida o conteúdo dos seguintes arquivos:

- [`LOGGING-SYSTEM-PROPOSAL.md`](../../archive/logging/LOGGING-SYSTEM-PROPOSAL.md) - Movido para archive/
- [`LOGGING-ENHANCEMENT-PROPOSAL.md`](../../archive/logging/LOGGING-ENHANCEMENT-PROPOSAL.md) - Movido para archive/
- [`LOGGING-IMPLEMENTATION-PLAN.md`](../../archive/logging/LOGGING-IMPLEMENTATION-PLAN.md) - Movido para archive/
- [`LOGGING-IMPLEMENTATION-PLAN-PART2.md`](../../archive/logging/LOGGING-IMPLEMENTATION-PLAN-PART2.md) - Movido para archive/

### Documentos Históricos

Para consultar roadmaps e propostas arquivadas:

- [archive/logging/](../../archive/logging/) - Documentos históricos de logging

---

**Criado por:** Kilo Code  
**Data:** 04/02/2026  
**Versão:** 1.0  
**Status:** ✅ Completo
