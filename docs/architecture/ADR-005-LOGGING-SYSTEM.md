# 📘 ADR-005 — Sistema de Logging Estruturado e Observabilidade

**Status:** Proposed  
**Data:** 2026-01-26  
**Escopo:** Backend + Infraestrutura  
**Versão:** V1.0

---

## Contexto

A aplicação MyIA executa inferências de IA com múltiplos provedores, modelos e estratégias. O sistema atual possui:

* Logs básicos com `console.log` sem estrutura padronizada
* Ausência de níveis de log (info, warn, error, debug)
* Dificuldade em rastrear erros em produção
* Falta de persistência de logs para análise histórica
* Impossibilidade de correlacionar logs com requisições específicas
* Ausência de métricas de performance e observabilidade

### Necessidades Identificadas

1. **Rastreabilidade:** Correlacionar logs com requisições, usuários e inferências
2. **Estruturação:** Logs em formato JSON para análise programática
3. **Persistência:** Armazenar logs para análise histórica e debugging
4. **Níveis de Log:** Separar info, warn, error, debug
5. **Self-Hosted:** Solução sem custos externos (CloudWatch, Datadog)
6. **Escalabilidade:** Suportar crescimento sem retrabalho
7. **Observabilidade:** Dashboards e alertas para monitoramento

---

## Decisão

Implementar sistema de logging estruturado em **3 fases**, garantindo evolução sem retrabalho:

### Fase 1: MVP (Winston + SQLite)
* **Biblioteca:** Winston (padrão Node.js)
* **Armazenamento:** SQLite (arquivo local)
* **Transporte:** Console + File + SQLite
* **Estrutura:** JSON padronizado
* **Tempo:** 1-2 dias

### Fase 2: Produção (Winston + PostgreSQL)
* **Armazenamento:** PostgreSQL (já usado no projeto)
* **Retenção:** 30 dias (configurável)
* **Índices:** timestamp, level, userId, requestId
* **Tempo:** 1 dia (migração)

### Fase 3: Observabilidade (Grafana + Loki)
* **Visualização:** Grafana (dashboards)
* **Agregação:** Loki (log aggregation)
* **Alertas:** Prometheus + Alertmanager
* **Tempo:** 2-3 dias

---

## Estrutura de Log Padronizada

```typescript
interface LogEntry {
  // Metadados obrigatórios
  timestamp: string;        // ISO 8601
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  
  // Contexto de requisição
  requestId?: string;       // UUID da requisição
  userId?: string;          // ID do usuário autenticado
  
  // Contexto de inferência
  inferenceId?: string;     // ID da inferência (se aplicável)
  provider?: string;        // Provider usado (bedrock, openai)
  model?: string;           // Modelo usado
  
  // Dados adicionais
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;         // Apenas em desenvolvimento
  };
  
  // Performance
  duration?: number;        // Duração em ms
  statusCode?: number;      // HTTP status code
}
```

---

## Arquitetura Técnica

### Fase 1: MVP (Winston + SQLite)

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import SQLiteTransport from 'winston-sqlite3';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new SQLiteTransport({ database: 'logs/logs.db' })
  ]
});

export default logger;
```

### Fase 2: PostgreSQL

```sql
-- Migration: create_logs_table
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID,
  user_id UUID REFERENCES users(id),
  inference_id UUID,
  provider VARCHAR(50),
  model VARCHAR(100),
  metadata JSONB,
  error JSONB,
  duration INTEGER,
  status_code INTEGER,
  
  -- Índices para performance
  INDEX idx_logs_timestamp (timestamp DESC),
  INDEX idx_logs_level (level),
  INDEX idx_logs_user_id (user_id),
  INDEX idx_logs_request_id (request_id)
);

-- Retenção automática (30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Executar diariamente
SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs()');
```

### Fase 3: Grafana + Loki

```yaml
# docker-compose.yml (adicionar)
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

---

## Consequências

### Positivas

1. **Rastreabilidade Total:** Correlação entre logs, requisições e inferências
2. **Debugging Eficiente:** Logs estruturados facilitam análise de erros
3. **Observabilidade:** Dashboards e alertas em tempo real
4. **Self-Hosted:** Sem custos externos (CloudWatch, Datadog)
5. **Escalável:** Arquitetura suporta crescimento sem retrabalho
6. **Compliance:** Logs auditáveis para governança
7. **Performance:** Índices otimizados para queries rápidas

### Negativas (Aceitas)

1. **Complexidade Inicial:** Configuração de Winston + SQLite
2. **Armazenamento:** Logs ocupam espaço (mitigado por retenção)
3. **Manutenção:** Monitoramento de espaço em disco
4. **Curva de Aprendizado:** Equipe precisa aprender Winston + Loki

### Trade-offs

| Aspecto | Decisão | Alternativa Rejeitada | Justificativa |
|---------|---------|----------------------|---------------|
| Biblioteca | Winston | Pino, Bunyan | Padrão Node.js, comunidade ativa |
| Armazenamento MVP | SQLite | Arquivo .log | Queries estruturadas |
| Armazenamento Prod | PostgreSQL | MongoDB, Elasticsearch | Já usado no projeto |
| Visualização | Grafana + Loki | CloudWatch, Datadog | Self-hosted, sem custos |

---

## Alternativas Consideradas

### 1. AWS CloudWatch
* **Prós:** Integrado com AWS, escalável
* **Contras:** Custos mensais, vendor lock-in
* **Decisão:** Rejeitado (requisito: self-hosted)

### 2. Datadog
* **Prós:** Dashboards avançados, APM integrado
* **Contras:** Custos altos ($15-31/host/mês)
* **Decisão:** Rejeitado (requisito: sem custos externos)

### 3. ELK Stack (Elasticsearch + Logstash + Kibana)
* **Prós:** Poderoso, open-source
* **Contras:** Complexo, alto consumo de recursos
* **Decisão:** Rejeitado (overkill para MVP)

### 4. Loki + Grafana (Direto)
* **Prós:** Solução completa, open-source
* **Contras:** Complexo para MVP
* **Decisão:** Adiado para Fase 3

---

## Garantias de Não-Retrabalho

### Migração SQLite → PostgreSQL
* Mesma estrutura de log (LogEntry)
* Apenas mudança de transporte Winston
* Código de aplicação **não muda**

### Migração PostgreSQL → Loki
* Logs já estruturados em JSON
* Loki consome logs do PostgreSQL
* Código de aplicação **não muda**

### Exemplo de Uso (Imutável)

```typescript
// Fase 1, 2 e 3: MESMO CÓDIGO
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

---

## Entregáveis por Fase

### Fase 1: MVP (1-2 dias)
- [x] Instalar Winston + SQLite transport
- [x] Criar `logger.ts` com estrutura padronizada
- [x] Migrar `console.log` para `logger.info/warn/error`
- [x] Criar tabela SQLite para logs
- [x] Adicionar `requestId` middleware
- [x] Documentar uso do logger

### Fase 2: Produção (1 dia)
- [ ] Criar migration PostgreSQL (`logs` table)
- [ ] Configurar Winston PostgreSQL transport
- [ ] Implementar retenção automática (30 dias)
- [ ] Criar índices de performance
- [ ] Testar queries de análise

### Fase 3: Observabilidade (2-3 dias)
- [ ] Configurar Loki + Grafana (Docker)
- [ ] Criar dashboards (erros, latência, uso)
- [ ] Configurar alertas (erro rate, latência)
- [ ] Documentar acesso e uso

---

## Estimativas de Tempo e Esforço

| Fase | Tempo | Esforço | Risco |
|------|-------|---------|-------|
| Fase 1 (MVP) | 1-2 dias | Baixo | Baixo |
| Fase 2 (PostgreSQL) | 1 dia | Baixo | Baixo |
| Fase 3 (Grafana + Loki) | 2-3 dias | Médio | Médio |
| **Total** | **4-6 dias** | **Baixo-Médio** | **Baixo** |

---

## Próximos Passos

1. **Aprovação:** Validar ADR com stakeholders
2. **Implementação Fase 1:** Winston + SQLite (MVP)
3. **Testes:** Validar logs em desenvolvimento
4. **Migração Fase 2:** PostgreSQL (produção)
5. **Observabilidade Fase 3:** Grafana + Loki

---

## Status Final

📌 **Decisão proposta e aguardando aprovação**  
📌 **Implementação faseada garante evolução sem retrabalho**  
📌 **Mudanças futuras exigem novo ADR**

---

## Referências

* [STANDARDS.md](../STANDARDS.md)
* [ADR-004 — Auditoria como Objeto Rico](./ADR-004.md)
* [Winston Documentation](https://github.com/winstonjs/winston)
* [Grafana Loki](https://grafana.com/oss/loki/)
* [logging/LOGGING-SYSTEM.md](../logging/LOGGING-SYSTEM.md)
