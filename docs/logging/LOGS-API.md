# API de Logs - Referência Técnica

> **Fonte de Verdade:** Documentação completa da API REST de logs  
> **Última atualização:** 04/02/2026  
> **Consolidado de:** LOGS-API-DOCUMENTATION.md, LOG-RETENTION.md

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints](#endpoints)
3. [Retenção de Logs](#retenção-de-logs)
4. [Histórico](#histórico)

---

## 📋 Visão Geral

> **Origem:** LOGS-API-DOCUMENTATION.md

API REST completa para busca, filtragem e análise de logs do sistema MyIA. Implementada como parte da **Fase 2.4 do Plano de Logging**.

### 🎯 Características

- ✅ **Busca Avançada**: Filtros por level, userId, requestId, inferenceId, datas e texto
- ✅ **Paginação**: Suporte completo com metadata (page, limit, total, totalPages)
- ✅ **Ordenação**: Ascendente ou descendente por timestamp
- ✅ **Performance**: Todas as queries < 100ms (média: 11-26ms)
- ✅ **Segurança**: Todas as rotas protegidas com autenticação JWT
- ✅ **Validação**: Validação completa de parâmetros com Zod
- ✅ **Correlação**: Busca de logs por requestId para rastreamento de requisições
- ✅ **Estatísticas**: Agregação de logs por nível

---

## 🔌 Endpoints

### Base URL
```
http://localhost:3001/api/logs
```

### Autenticação
Todas as rotas requerem header de autenticação:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 1. **GET /api/logs** - Buscar Logs (Paginado)

Busca logs com filtros, paginação e ordenação.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `level` | string | Não | Nível do log | `error`, `warn`, `info`, `debug` |
| `userId` | string (UUID) | Não | ID do usuário | `550e8400-e29b-41d4-a716-446655440000` |
| `requestId` | string | Não | ID da requisição | `req-test-123` |
| `inferenceId` | string | Não | ID da inferência | `inf-test-456` |
| `startDate` | string (ISO 8601) | Não | Data início | `2026-01-26T00:00:00Z` |
| `endDate` | string (ISO 8601) | Não | Data fim | `2026-01-26T23:59:59Z` |
| `search` | string | Não | Busca em message | `provider` |
| `page` | number | Não | Número da página (default: 1) | `1` |
| `limit` | number | Não | Itens por página (default: 20, max: 100) | `20` |
| `sort` | string | Não | Ordenação (default: desc) | `asc`, `desc` |

#### Exemplo de Requisição
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/logs?level=error&page=1&limit=5&sort=desc"
```

#### Exemplo de Resposta
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "e5582549-828d-4461-856f-7fa004e44627",
        "timestamp": "2026-01-26T22:59:40.343Z",
        "level": "error",
        "message": "Erro ao processar inferência",
        "requestId": null,
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "inferenceId": "inf-test-789",
        "metadata": {
          "model": "claude-3-sonnet",
          "provider": "anthropic"
        },
        "error": {
          "code": "API_ERROR",
          "message": "Rate limit exceeded"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 4,
      "totalPages": 1
    },
    "performance": {
      "duration": "11ms"
    }
  }
}
```

#### Performance
- ⚡ Média: **11-26ms**
- 🎯 Objetivo: < 100ms ✅

---

### 2. **GET /api/logs/:id** - Buscar Log por ID

Busca um log específico por ID.

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string (UUID) | ID do log |

#### Exemplo de Requisição
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/logs/e5582549-828d-4461-856f-7fa004e44627"
```

#### Exemplo de Resposta
```json
{
  "status": "success",
  "data": {
    "log": {
      "id": "e5582549-828d-4461-856f-7fa004e44627",
      "timestamp": "2026-01-26T22:59:40.343Z",
      "level": "error",
      "message": "Erro ao processar inferência",
      "requestId": null,
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "inferenceId": "inf-test-789",
      "metadata": {
        "model": "claude-3-sonnet",
        "provider": "anthropic"
      },
      "error": {
        "code": "API_ERROR",
        "message": "Rate limit exceeded"
      }
    }
  }
}
```

---

### 3. **GET /api/logs/request/:requestId** - Correlação de Logs

Busca todos os logs de uma requisição específica (útil para rastreamento).

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `requestId` | string | ID da requisição |

#### Exemplo de Requisição
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/logs/request/req-test-123"
```

#### Exemplo de Resposta
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "60d756ba-5cd1-40cb-b53b-6a3ad6526c74",
        "timestamp": "2026-01-26T22:59:40.336Z",
        "level": "info",
        "message": "Usuário fez login com sucesso",
        "requestId": "req-test-123",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "inferenceId": null,
        "metadata": {
          "ip": "192.168.1.1",
          "action": "login"
        },
        "error": null
      },
      {
        "id": "8d9e7ebd-8186-429f-a576-fdcd8b4b70fb",
        "timestamp": "2026-01-26T22:59:40.339Z",
        "level": "info",
        "message": "Requisição processada com sucesso",
        "requestId": "req-test-123",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "inferenceId": null,
        "metadata": {
          "status": 200,
          "duration": 45
        },
        "error": null
      }
    ],
    "count": 2
  }
}
```

---

### 4. **GET /api/logs/errors/recent** - Erros Recentes

Busca logs de erro mais recentes.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição | Default |
|-----------|------|-------------|-----------|---------|
| `limit` | number | Não | Número de logs | 50 (max: 100) |

#### Exemplo de Requisição
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/logs/errors/recent?limit=5"
```

#### Exemplo de Resposta
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "e5582549-828d-4461-856f-7fa004e44627",
        "timestamp": "2026-01-26T22:59:40.343Z",
        "level": "error",
        "message": "Erro ao processar inferência",
        "requestId": null,
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "inferenceId": "inf-test-789",
        "metadata": {
          "model": "claude-3-sonnet",
          "provider": "anthropic"
        },
        "error": {
          "code": "API_ERROR",
          "message": "Rate limit exceeded"
        }
      }
    ],
    "count": 4
  }
}
```

---

### 5. **GET /api/logs/stats** - Estatísticas de Logs

Retorna estatísticas agregadas de logs por nível.

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `startDate` | string (ISO 8601) | Não | Data início |
| `endDate` | string (ISO 8601) | Não | Data fim |

#### Exemplo de Requisição
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/logs/stats"
```

#### Exemplo de Resposta
```json
{
  "status": "success",
  "data": {
    "stats": [
      {
        "level": "info",
        "count": 26
      },
      {
        "level": "warn",
        "count": 1
      },
      {
        "level": "error",
        "count": 4
      },
      {
        "level": "debug",
        "count": 1
      }
    ]
  }
}
```

---

## 🧪 Testes

### Executar Testes Automatizados

```bash
# Popular logs de teste
cd backend && npx tsx scripts/test-logs-api.ts

# Executar suite de testes
./backend/scripts/test-logs-api.sh
```

### Resultados dos Testes

| Teste | Performance | Status |
|-------|-------------|--------|
| Buscar todos os logs (paginado) | 26ms | ✅ |
| Buscar logs de erro | 11ms | ✅ |
| Buscar logs de usuário específico | 12ms | ✅ |
| Buscar logs por requestId | 12ms | ✅ |
| Buscar logs com texto | 16ms | ✅ |
| Buscar erros recentes | 11ms | ✅ |
| Estatísticas de logs | 11ms | ✅ |
| Buscar com múltiplos filtros | 11ms | ✅ |

**Média de Performance: 13.75ms** 🚀

---

## 🔒 Segurança

- ✅ Todas as rotas protegidas com JWT
- ✅ Validação de parâmetros com Zod
- ✅ Rate limiting aplicado (via apiLimiter)
- ✅ Sanitização de inputs
- ✅ Logs estruturados de auditoria

---

## 📊 Performance

### Otimizações Implementadas

1. **Índices PostgreSQL** (schema.prisma):
   - `@@index([timestamp(sort: Desc)])` - Queries temporais
   - `@@index([level])` - Filtro por nível
   - `@@index([userId])` - Filtro por usuário
   - `@@index([requestId])` - Correlação de logs

2. **Queries Paralelas**:
   - `Promise.all([findMany, count])` - Busca e contagem simultâneas

3. **Limites de Paginação**:
   - Máximo 100 itens por página
   - Default: 20 itens

### Benchmarks

```
Query típica (20 logs): ~15ms
Query com filtros: ~11ms
Query de estatísticas: ~11ms
Query de correlação: ~12ms
```

---

## 🎯 Casos de Uso

### 1. Monitoramento de Erros
```bash
# Buscar erros das últimas 24h
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/logs?level=error&startDate=2026-01-25T00:00:00Z"
```

### 2. Debug de Requisição Específica
```bash
# Rastrear todos os logs de uma requisição
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/logs/request/req-abc-123"
```

### 3. Auditoria de Usuário
```bash
# Ver todas as ações de um usuário
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/logs?userId=550e8400-e29b-41d4-a716-446655440000"
```

### 4. Análise de Inferências
```bash
# Buscar logs de uma inferência específica
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/logs?inferenceId=inf-test-456"
```

---

## 🗄️ Retenção de Logs

> **Origem:** LOG-RETENTION.md

### Visão Geral

Sistema de retenção automática de logs que deleta registros com mais de **30 dias** para evitar crescimento infinito da tabela `logs` no PostgreSQL.

### Objetivos

- ✅ Manter apenas logs dos últimos 30 dias
- ✅ Executar limpeza diariamente (2h da manhã)
- ✅ Logs de auditoria da operação
- ✅ Zero impacto na performance da aplicação
- ✅ Tratamento robusto de erros

### Componentes

1. **Função PostgreSQL:** `cleanup_old_logs()`
2. **Script Node.js:** `cleanup-logs.ts`
3. **Cron Job:** Agendamento no sistema operacional

---

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CRON JOB (Sistema)                        │
│              Executa diariamente às 2h da manhã              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Script Node.js (cleanup-logs.ts)                │
│  - Conecta ao PostgreSQL via Prisma                          │
│  - Executa função cleanup_old_logs()                         │
│  - Registra logs de auditoria                                │
│  - Retorna exit code (0 = sucesso, 1 = erro)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Função PostgreSQL (cleanup_old_logs())               │
│  - DELETE FROM logs WHERE timestamp < NOW() - 30 days        │
│  - Retorna número de logs deletados                          │
│  - Transação atômica (rollback em caso de erro)             │
└─────────────────────────────────────────────────────────────┘
```

---

### Configuração

#### 1. Função PostgreSQL

A função foi criada automaticamente pela migration:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;
```

**Validar função:**

```bash
psql -U leonardo -h localhost -d myia -c "SELECT cleanup_old_logs();"
```

---

#### 2. Script Node.js

O script está em `backend/scripts/cleanup-logs.ts`.

**Testar manualmente:**

```bash
cd backend
npx ts-node scripts/cleanup-logs.ts
```

**Saída esperada:**

```
✅ Log Cleanup Summary:
   - Deleted logs: 0
   - Retention period: 30 days
   - Duration: 45ms
   - Timestamp: 2026-01-26T21:00:00.000Z
```

---

#### 3. Configurar Cron Job

##### Opção A: Crontab do Usuário (Recomendado)

```bash
# Editar crontab
crontab -e

# Adicionar linha (executar diariamente às 2h da manhã)
0 2 * * * cd /home/leonardo/Documents/VSCODE/MyIA/backend && npx ts-node scripts/cleanup-logs.ts >> logs/cleanup.log 2>&1
```

**Importante:** Ajustar o caminho absoluto para o seu ambiente.

##### Opção B: Systemd Timer (Produção)

Criar arquivo `/etc/systemd/system/myia-log-cleanup.service`:

```ini
[Unit]
Description=MyIA Log Cleanup Service
After=postgresql.service

[Service]
Type=oneshot
User=leonardo
WorkingDirectory=/home/leonardo/Documents/VSCODE/MyIA/backend
ExecStart=/usr/bin/npx ts-node scripts/cleanup-logs.ts
StandardOutput=append:/home/leonardo/Documents/VSCODE/MyIA/backend/logs/cleanup.log
StandardError=append:/home/leonardo/Documents/VSCODE/MyIA/backend/logs/cleanup.log

[Install]
WantedBy=multi-user.target
```

Criar arquivo `/etc/systemd/system/myia-log-cleanup.timer`:

```ini
[Unit]
Description=MyIA Log Cleanup Timer
Requires=myia-log-cleanup.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Ativar timer:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable myia-log-cleanup.timer
sudo systemctl start myia-log-cleanup.timer
```

**Verificar status:**

```bash
sudo systemctl status myia-log-cleanup.timer
sudo systemctl list-timers | grep myia
```

---

### Uso

#### Execução Manual

```bash
cd backend
npx ts-node scripts/cleanup-logs.ts
```

#### Verificar Logs de Auditoria

Os logs de auditoria são salvos na tabela `logs` e também em `logs/cleanup.log` (se configurado no cron):

```bash
# Ver logs de cleanup no PostgreSQL
psql -U leonardo -h localhost -d myia -c "
  SELECT timestamp, level, message, metadata 
  FROM logs 
  WHERE message LIKE '%cleanup%' 
  ORDER BY timestamp DESC 
  LIMIT 10;
"

# Ver logs de cleanup no arquivo
tail -f backend/logs/cleanup.log
```

#### Verificar Logs Restantes

```bash
# Contar logs por data
psql -U leonardo -h localhost -d myia -c "
  SELECT 
    DATE(timestamp) as date,
    COUNT(*) as count
  FROM logs
  GROUP BY DATE(timestamp)
  ORDER BY date DESC;
"

# Ver logs mais antigos
psql -U leonardo -h localhost -d myia -c "
  SELECT MIN(timestamp), MAX(timestamp), COUNT(*) 
  FROM logs;
"
```

---

### Monitoramento

#### Métricas Importantes

1. **Número de logs deletados por execução**
   - Esperado: Varia conforme volume de logs
   - Alerta: > 100.000 logs/dia (pode indicar problema)

2. **Duração da limpeza**
   - Esperado: < 1 segundo
   - Alerta: > 10 segundos (otimizar índices)

3. **Taxa de falha**
   - Esperado: 0%
   - Alerta: > 1% (investigar erros)

#### Dashboard de Monitoramento

Criar query para dashboard (Grafana/Metabase):

```sql
-- Logs deletados nos últimos 30 dias
SELECT 
  DATE(timestamp) as date,
  (metadata->>'deletedCount')::int as deleted_count,
  (metadata->>'durationMs')::int as duration_ms
FROM logs
WHERE message = 'Log cleanup completed successfully'
  AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

---

### Troubleshooting

#### Problema: Cron job não está executando

**Diagnóstico:**

```bash
# Verificar se cron está rodando
sudo systemctl status cron

# Ver logs do cron
sudo tail -f /var/log/syslog | grep CRON

# Verificar crontab do usuário
crontab -l
```

**Solução:**

1. Verificar permissões do script
2. Usar caminho absoluto para `npx` e `ts-node`
3. Adicionar variáveis de ambiente no crontab

---

#### Problema: Script falha com erro de conexão

**Diagnóstico:**

```bash
# Testar conexão PostgreSQL
psql -U leonardo -h localhost -d myia -c "SELECT 1;"

# Verificar variáveis de ambiente
cd backend
cat .env | grep DATABASE_URL
```

**Solução:**

1. Verificar `DATABASE_URL` no `.env`
2. Verificar se PostgreSQL está rodando
3. Verificar permissões do usuário no banco

---

#### Problema: Função cleanup_old_logs() não existe

**Diagnóstico:**

```bash
# Verificar se função existe
psql -U leonardo -h localhost -d myia -c "
  SELECT proname, prosrc 
  FROM pg_proc 
  WHERE proname = 'cleanup_old_logs';
"
```

**Solução:**

```bash
# Recriar função manualmente
cd backend
psql -U leonardo -h localhost -d myia < prisma/migrations/20260126205957_add_log_retention/migration.sql
```

---

#### Problema: Logs não estão sendo deletados

**Diagnóstico:**

```bash
# Verificar logs antigos
psql -U leonardo -h localhost -d myia -c "
  SELECT COUNT(*) 
  FROM logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
"
```

**Solução:**

1. Executar função manualmente: `SELECT cleanup_old_logs();`
2. Verificar se há locks na tabela: `SELECT * FROM pg_locks WHERE relation = 'logs'::regclass;`
3. Verificar permissões do usuário: `GRANT DELETE ON logs TO leonardo;`

---

### Logs de Auditoria

Todos os eventos de limpeza são registrados na tabela `logs` com os seguintes campos:

```typescript
{
  level: 'info',
  message: 'Log cleanup completed successfully',
  metadata: {
    deletedCount: 1234,
    retentionDays: 30,
    durationMs: 45,
    timestamp: '2026-01-26T21:00:00.000Z'
  }
}
```

Em caso de erro:

```typescript
{
  level: 'error',
  message: 'Log cleanup failed',
  metadata: {
    error: 'Connection timeout',
    stack: '...',
    durationMs: 5000,
    timestamp: '2026-01-26T21:00:00.000Z'
  }
}
```

---

### Segurança

#### Permissões Necessárias

O usuário do banco de dados precisa ter:

```sql
-- Permissão para deletar logs
GRANT DELETE ON logs TO leonardo;

-- Permissão para executar função
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO leonardo;
```

#### Backup Antes da Limpeza (Opcional)

Para ambientes críticos, criar backup antes de deletar:

```bash
# Backup de logs antigos antes de deletar
pg_dump -U leonardo -h localhost -d myia \
  --table=logs \
  --data-only \
  --file=logs_backup_$(date +%Y%m%d).sql
```

---

## 📚 Histórico

### Documentos Consolidados

Este documento consolida o conteúdo dos seguintes arquivos:

- [`LOGS-API-DOCUMENTATION.md`](../../archive/logging/LOGS-API-DOCUMENTATION.md) - Movido para archive/
- [`LOG-RETENTION.md`](../../archive/logging/LOG-RETENTION.md) - Movido para archive/

### Documentos Históricos

Para consultar versões antigas:

- [archive/logging/](../../archive/logging/) - Documentos históricos de logging

---

**Criado por:** Kilo Code  
**Data:** 04/02/2026  
**Versão:** 1.0  
**Status:** ✅ Completo
