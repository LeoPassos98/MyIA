# 📊 Proposta de Sistema de Logging Estruturado — MyIA

> **Documento:** Proposta Técnica Personalizada  
> **Versão:** 2.0 (Consolidada)  
> **Data:** 2026-01-26  
> **Status:** Aguardando Aprovação

---

## 📋 Índice

1. [Resumo Executivo](#-resumo-executivo)
2. [Requisitos Validados](#-requisitos-validados)
3. [Arquitetura Faseada](#-arquitetura-faseada)
4. [Estrutura de Log Padronizada](#-estrutura-de-log-padronizada)
5. [Garantias de Não-Retrabalho](#-garantias-de-não-retrabalho)
6. [Exemplos de Implementação](#-exemplos-de-implementação)
7. [Entregáveis por Fase](#-entregáveis-por-fase)
8. [Estimativas e Cronograma](#-estimativas-e-cronograma)
9. [Decisões Arquiteturais](#-decisões-arquiteturais)
10. [Próximos Passos](#-próximos-passos)

---

## 🎯 Resumo Executivo

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

## ✅ Requisitos Validados

### Requisitos Funcionais

1. **Logs Estruturados:** Formato JSON padronizado
2. **Níveis de Log:** info, warn, error, debug
3. **Persistência:** Armazenamento para análise histórica
4. **Correlação:** requestId, userId, inferenceId
5. **Performance:** Métricas de latência e duração
6. **Erros:** Stack traces (apenas desenvolvimento)

### Requisitos Não-Funcionais

1. **Self-Hosted:** Sem dependência de serviços externos
2. **Custo Zero:** Sem CloudWatch, Datadog, etc.
3. **Escalável:** Suportar crescimento sem retrabalho
4. **Manutenível:** Código simples e documentado
5. **Performático:** Impacto mínimo na aplicação

### Requisitos de Negócio

1. **Debugging Eficiente:** Reduzir tempo de investigação de erros
2. **Governança:** Logs auditáveis para compliance
3. **Observabilidade:** Visibilidade em tempo real
4. **Retenção:** 30 dias (configurável)

---

## 🏗️ Arquitetura Faseada

### Visão Geral

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

## 💻 Exemplos de Implementação

### 1. Configuração do Logger (Fase 1)

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import SQLiteTransport from 'winston-sqlite3';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'myia-backend' },
  transports: [
    // Console (desenvolvimento)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Arquivo (fallback)
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    
    // SQLite (MVP)
    new SQLiteTransport({ 
      database: 'logs/logs.db',
      tableName: 'logs'
    })
  ]
});

// Remover stack traces em produção
if (process.env.NODE_ENV === 'production') {
  logger.format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  );
}

export default logger;
```

---

### 2. Middleware de Request ID

```typescript
// backend/src/middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Adicionar ao Express
app.use(requestIdMiddleware);
```

---

### 3. Uso em Controllers

```typescript
// backend/src/controllers/aiController.ts
import logger from '../utils/logger';

export async function generateResponse(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    logger.info('Starting inference', {
      requestId: req.id,
      userId: req.user.id,
      provider: req.body.provider,
      model: req.body.model
    });
    
    const result = await aiService.generate(req.body);
    
    logger.info('Inference completed', {
      requestId: req.id,
      userId: req.user.id,
      inferenceId: result.id,
      provider: result.provider,
      model: result.model,
      duration: Date.now() - startTime,
      statusCode: 200,
      metadata: {
        tokens: result.tokens,
        cost: result.cost
      }
    });
    
    return res.json(jsend.success(result));
    
  } catch (error) {
    logger.error('Inference failed', {
      requestId: req.id,
      userId: req.user.id,
      duration: Date.now() - startTime,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
    
    throw error;
  }
}
```

---

### 4. Uso em Services

```typescript
// backend/src/services/ai/adapters/base.adapter.ts
import logger from '../../../utils/logger';

export abstract class BaseAdapter {
  protected async executeWithLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Record<string, unknown>
  ): Promise<T> {
    const startTime = Date.now();
    
    logger.debug(`Starting ${operation}`, context);
    
    try {
      const result = await fn();
      
      logger.debug(`Completed ${operation}`, {
        ...context,
        duration: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Failed ${operation}`, {
        ...context,
        duration: Date.now() - startTime,
        error: {
          name: error.name,
          message: error.message
        }
      });
      
      throw error;
    }
  }
}
```

---

### 5. Migration PostgreSQL (Fase 2)

```sql
-- backend/prisma/migrations/XXXXXX_create_logs_table/migration.sql

-- Criar tabela de logs
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  
  -- Contexto de requisição
  request_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip INET,
  user_agent TEXT,
  
  -- Contexto de inferência
  inference_id UUID,
  provider VARCHAR(50),
  model VARCHAR(100),
  
  -- Dados adicionais
  metadata JSONB,
  error JSONB,
  
  -- Performance
  duration INTEGER,
  status_code INTEGER,
  
  -- Auditoria
  action VARCHAR(100),
  resource VARCHAR(200)
);

-- Índices para performance
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_user_id ON logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_logs_request_id ON logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_logs_inference_id ON logs(inference_id) WHERE inference_id IS NOT NULL;

-- Índice GIN para busca em metadata
CREATE INDEX idx_logs_metadata ON logs USING GIN(metadata);

-- Função de limpeza automática (retenção 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE logs IS 'Logs estruturados da aplicação MyIA';
COMMENT ON COLUMN logs.metadata IS 'Dados customizados em formato JSON';
COMMENT ON COLUMN logs.error IS 'Detalhes do erro (name, message, stack)';
```

---

### 6. Transport PostgreSQL (Fase 2)

```typescript
// backend/src/utils/logger.ts (atualizado)
import winston from 'winston';
import PostgresTransport from 'winston-postgres';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    
    // PostgreSQL (Produção)
    new PostgresTransport({
      connectionString: process.env.DATABASE_URL,
      tableName: 'logs',
      maxPool: 10
    })
  ]
});

export default logger;
```

---

### 7. Docker Compose (Fase 3)

```yaml
# docker-compose.yml (adicionar)
version: '3.8'

services:
  # Loki (agregação de logs)
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - myia-network
  
  # Grafana (visualização)
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - myia-network
    depends_on:
      - loki
  
  # Promtail (coleta de logs)
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/log:/var/log
    command: -config.file=/etc/promtail/config.yml
    networks:
      - myia-network
    depends_on:
      - loki

volumes:
  loki-data:
  grafana-data:

networks:
  myia-network:
    driver: bridge
```

---

### 8. Configuração Loki

```yaml
# loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-05-15
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 dias
```

---

## 📦 Entregáveis por Fase

### Fase 1: MVP (Winston + SQLite)

| # | Entregável | Descrição | Status |
|---|------------|-----------|--------|
| 1 | Instalar dependências | `winston`, `winston-sqlite3` | ⏳ Pendente |
| 2 | Criar `logger.ts` | Configuração Winston + SQLite | ⏳ Pendente |
| 3 | Criar `LogEntry` interface | Estrutura padronizada | ⏳ Pendente |
| 4 | Middleware `requestId` | Gerar UUID por requisição | ⏳ Pendente |
| 5 | Migrar `console.log` | Substituir por `logger.info/warn/error` | ⏳ Pendente |
| 6 | Criar tabela SQLite | Schema de logs | ⏳ Pendente |
| 7 | Testes unitários | Validar logging | ⏳ Pendente |
| 8 | Documentação | Guia de uso do logger | ⏳ Pendente |

---

### Fase 2: Produção (PostgreSQL)

| # | Entregável | Descrição | Status |
|---|------------|-----------|--------|
| 1 | Migration PostgreSQL | Criar tabela `logs` | ⏳ Pendente |
| 2 | Índices de performance | timestamp, level, user_id, etc. | ⏳ Pendente |
| 3 | Transport PostgreSQL | Configurar Winston | ⏳ Pendente |
| 4 | Retenção automática | Função + cron job (30 dias) | ⏳ Pendente |
| 5 | Queries de análise | Exemplos de consultas úteis | ⏳ Pendente |
| 6 | Testes de carga | Validar performance | ⏳ Pendente |
| 7 | Documentação | Atualizar guia | ⏳ Pendente |

---

### Fase 3: Observabilidade (Grafana + Loki)

| # | Entregável | Descrição | Status |
|---|------------|-----------|--------|
| 1 | Docker Compose | Loki + Grafana + Promtail | ⏳ Pendente |
| 2 | Configuração Loki | `loki-config.yml` | ⏳ Pendente |
| 3 | Configuração Promtail | `promtail-config.yml` | ⏳ Pendente |
| 4 | Dashboard: Erros | Taxa de erro, top erros | ⏳ Pendente |
| 5 | Dashboard: Latência | P50, P95, P99 | ⏳ Pendente |
| 6 | Dashboard: Uso | Requisições/min, usuários ativos | ⏳ Pendente |
| 7 | Alertas | Erro rate > 5%, latência > 2s | ⏳ Pendente |
| 8 | Documentação | Guia de acesso e uso | ⏳ Pendente |

---

## ⏱️ Estimativas e Cronograma

### Estimativas de Tempo

| Fase | Tempo Estimado | Complexidade | Risco |
|------|----------------|--------------|-------|
| Fase 1: MVP | 1-2 dias | Baixa | Baixo |
| Fase 2: Produção | 1 dia | Baixa | Baixo |
| Fase 3: Observabilidade | 2-3 dias | Média | Médio |
| **Total** | **4-6 dias** | **Baixa-Média** | **Baixo-Médio** |

### Cronograma Sugerido

```
Semana 1:
├─ Dia 1-2: Fase 1 (MVP)
│  ├─ Configurar Winston + SQLite
│  ├─ Criar estrutura de log
│  ├─ Migrar console.log
│  └─ Testes e documentação
│
├─ Dia 3: Fase 2 (Produção)
│  ├─ Migration PostgreSQL
│  ├─ Configurar transport
│  ├─ Implementar retenção
│  └─ Testes de carga
│
└─ Dia 4-6: Fase 3 (Observabilidade)
   ├─ Configurar Docker Compose
   ├─ Criar dashboards
   ├─ Configurar alertas
   └─ Documentação final
```

### Recursos Necessários

| Recurso | Quantidade | Observação |
|---------|------------|------------|
| Desenvolvedor Backend | 1 | Tempo integral |
| Desenvolvedor DevOps | 0.5 | Apenas Fase 3 |
| Servidor de Testes | 1 | Validar performance |
| Revisão de Código | 2h | Após cada fase |

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

### Alternativas Rejeitadas

#### 1. AWS CloudWatch
* **Prós:** Integrado com AWS, escalável
* **Contras:** Custos mensais ($0.50/GB ingestão + $0.03/GB armazenamento), vendor lock-in
* **Decisão:** Rejeitado (requisito: self-hosted, sem custos externos)

#### 2. Datadog
* **Prós:** Dashboards avançados, APM integrado, alertas inteligentes
* **Contras:** Custos altos ($15-31/host/mês), vendor lock-in
* **Decisão:** Rejeitado (requisito: sem custos externos)

#### 3. ELK Stack (Elasticsearch + Logstash + Kibana)
* **Prós:** Poderoso, open-source, busca avançada
* **Contras:** Complexo, alto consumo de recursos (8GB RAM mínimo), curva de aprendizado
* **Decisão:** Rejeitado (overkill para MVP, complexidade desnecessária)

#### 4. Splunk
* **Prós:** Líder de mercado, recursos avançados
* **Contras:** Custos proibitivos ($150/GB/mês), complexo
* **Decisão:** Rejeitado (custos e complexidade)

---

## 🚀 Próximos Passos

### 1. Aprovação da Proposta
- [ ] Revisar documento com stakeholders
- [ ] Validar requisitos e arquitetura
- [ ] Aprovar cronograma e recursos
- [ ] Definir data de início

### 2. Preparação (Pré-Fase 1)
- [ ] Criar branch `feature/logging-system`
- [ ] Instalar dependências (`winston`, `winston-sqlite3`)
- [ ] Criar estrutura de diretórios (`logs/`, `backend/src/types/logging.ts`)
- [ ] Configurar `.gitignore` (ignorar `logs/*.db`, `logs/*.log`)

### 3. Implementação Fase 1 (MVP)
- [ ] Criar `logger.ts` com configuração Winston
- [ ] Criar interface `LogEntry`
- [ ] Implementar middleware `requestId`
- [ ] Migrar `console.log` para `logger` (controllers, services)
- [ ] Criar testes unitários
- [ ] Documentar uso do logger

### 4. Validação e Testes
- [ ] Testar logs em desenvolvimento
- [ ] Validar estrutura de log (JSON)
- [ ] Testar correlação (requestId, userId)
- [ ] Validar performance (impacto < 5ms)
- [ ] Code review

### 5. Deploy Fase 1
- [ ] Merge para `main`
- [ ] Deploy em ambiente de staging
- [ ] Monitorar por 1 semana
- [ ] Coletar feedback

### 6. Planejamento Fase 2
- [ ] Agendar implementação (após validação Fase 1)
- [ ] Preparar migration PostgreSQL
- [ ] Definir estratégia de retenção
- [ ] Planejar testes de carga

---

## 📚 Referências

### Documentação Oficial
* [Winston Documentation](https://github.com/winstonjs/winston)
* [Winston Transports](https://github.com/winstonjs/winston/blob/master/docs/transports.md)
* [Grafana Loki](https://grafana.com/docs/loki/latest/)
* [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)

### Documentação do Projeto
* [ADR-005: Sistema de Logging](./architecture/ADR-005-LOGGING-SYSTEM.md)
* [STANDARDS.md](./STANDARDS.md)
* [ADR-004: Auditoria como Objeto Rico](./architecture/ADR-004.md)

### Artigos e Tutoriais
* [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
* [Winston + PostgreSQL Integration](https://github.com/winstonjs/winston/wiki/Transports)
* [Grafana + Loki Setup Guide](https://grafana.com/docs/loki/latest/setup/)

---

## 📊 Métricas de Sucesso

### Fase 1 (MVP)
* ✅ 100% dos `console.log` migrados para `logger`
* ✅ Logs estruturados em JSON
* ✅ Correlação por `requestId` funcionando
* ✅ Impacto de performance < 5ms por log
* ✅ Testes unitários com cobertura > 80%

### Fase 2 (Produção)
* ✅ Logs persistidos no PostgreSQL
* ✅ Retenção automática (30 dias) funcionando
* ✅ Queries de análise < 100ms
* ✅ Zero perda de logs em produção
* ✅ Backup automático configurado

### Fase 3 (Observabilidade)
* ✅ Dashboards Grafana funcionando
* ✅ Alertas configurados e testados
* ✅ Tempo de resposta a incidentes < 5min
* ✅ Visibilidade em tempo real
* ✅ Documentação completa

---

## 🔒 Considerações de Segurança

### Dados Sensíveis
* ❌ **NUNCA** logar senhas, tokens, chaves de API
* ❌ **NUNCA** logar dados pessoais (CPF, cartão de crédito)
* ✅ Logar apenas IDs de usuários (não nomes/emails)
* ✅ Sanitizar inputs antes de logar

### Stack Traces
* ✅ Stack traces **APENAS** em desenvolvimento
* ❌ Stack traces **PROIBIDOS** em produção
* ✅ Usar `error.message` em produção

### Acesso aos Logs
* ✅ Logs acessíveis apenas por admins
* ✅ Grafana com autenticação obrigatória
* ✅ PostgreSQL com permissões restritas
* ✅ Logs de acesso aos logs (auditoria)

---

## 💡 Dicas de Implementação

### 1. Migração Gradual
```typescript
// ❌ NÃO fazer tudo de uma vez
console.log('Starting inference');
console.log('Completed inference');

// ✅ Migrar arquivo por arquivo
logger.info('Starting inference', { requestId, userId });
logger.info('Completed inference', { requestId, userId, duration });
```

### 2. Contexto Rico
```typescript
// ❌ Log pobre
logger.info('Error');

// ✅ Log rico
logger.error('Inference failed', {
  requestId: req.id,
  userId: req.user.id,
  provider: 'bedrock',
  model: 'claude-3-sonnet',
  error: { name: error.name, message: error.message }
});
```

### 3. Níveis Corretos
```typescript
// ❌ Uso incorreto
logger.error('User logged in');  // Não é erro!
logger.info('Database connection failed');  // É erro!

// ✅ Uso correto
logger.info('User logged in', { userId });
logger.error('Database connection failed', { error });
```

### 4. Performance
```typescript
// ❌ Log síncrono (bloqueia)
logger.info('Heavy operation', { data: heavyObject });

// ✅ Log assíncrono (não bloqueia)
logger.info('Heavy operation', {
  dataSize: heavyObject.length,
  summary: heavyObject.slice(0, 10)
});
```

---

## 🎓 Treinamento da Equipe

### Sessão 1: Introdução (1h)
* O que é logging estruturado?
* Por que Winston?
* Estrutura de log padronizada
* Níveis de log (info, warn, error, debug)

### Sessão 2: Prática (2h)
* Configurar logger local
* Migrar `console.log` para `logger`
* Adicionar contexto (requestId, userId)
* Testar logs no SQLite

### Sessão 3: Avançado (1h)
* Queries de análise
* Debugging com logs
* Performance e boas práticas
* Segurança (dados sensíveis)

---

## 📝 Checklist Final

### Antes de Começar
- [ ] Proposta aprovada
- [ ] Recursos alocados
- [ ] Branch criada
- [ ] Dependências instaladas

### Durante Implementação
- [ ] Seguir estrutura de log padronizada
- [ ] Adicionar contexto rico
- [ ] Testar cada migração
- [ ] Code review contínuo

### Antes de Deploy
- [ ] Todos testes passando
- [ ] Documentação atualizada
- [ ] Performance validada
- [ ] Segurança revisada

### Após Deploy
- [ ] Monitorar logs em produção
- [ ] Validar correlação
- [ ] Coletar feedback
- [ ] Planejar próxima fase

---

## 🎉 Conclusão

Esta proposta apresenta um **sistema de logging estruturado e observabilidade** completo, personalizado para as necessidades do projeto MyIA:

✅ **Self-hosted** (sem custos externos)
✅ **Faseado** (MVP → Produção → Observabilidade)
✅ **Sem retrabalho** (código imutável entre fases)
✅ **Escalável** (suporta crescimento)
✅ **Documentado** (guias e exemplos)

### Próximo Passo
Aguardando aprovação para iniciar **Fase 1: MVP (Winston + SQLite)**.

---

**Documento criado em:** 2026-01-26
**Versão:** 2.0 (Consolidada)
**Autor:** Documentation Specialist
**Status:** Aguardando Aprovação