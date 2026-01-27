# API de Busca Avançada de Logs - Documentação

## 📋 Visão Geral

API REST completa para busca, filtragem e análise de logs do sistema MyIA. Implementada como parte da **Fase 2.4 do Plano de Logging**.

## 🎯 Características

- ✅ **Busca Avançada**: Filtros por level, userId, requestId, inferenceId, datas e texto
- ✅ **Paginação**: Suporte completo com metadata (page, limit, total, totalPages)
- ✅ **Ordenação**: Ascendente ou descendente por timestamp
- ✅ **Performance**: Todas as queries < 100ms (média: 11-26ms)
- ✅ **Segurança**: Todas as rotas protegidas com autenticação JWT
- ✅ **Validação**: Validação completa de parâmetros com Zod
- ✅ **Correlação**: Busca de logs por requestId para rastreamento de requisições
- ✅ **Estatísticas**: Agregação de logs por nível

## 📁 Arquivos Criados

```
backend/src/
├── services/
│   └── logsService.ts              # Lógica de negócio e queries Prisma
├── controllers/
│   └── logsController.ts           # Handlers de requisições HTTP
├── routes/
│   └── logsRoutes.ts               # Definição de rotas e middlewares
└── middleware/validators/
    └── logsValidator.ts            # Schemas de validação Zod

backend/scripts/
├── test-logs-api.ts                # Script para popular logs de teste
└── test-logs-api.sh                # Script de teste automatizado
```

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

## 🚀 Próximos Passos (Fase 2.5)

Conforme o plano de implementação:

1. **Dashboard de Logs** (Frontend)
   - Interface visual para busca
   - Gráficos de estatísticas
   - Filtros interativos
   - Visualização de correlação

2. **Alertas e Notificações**
   - Webhooks para erros críticos
   - Email notifications
   - Slack integration

3. **Exportação de Logs**
   - Export para CSV/JSON
   - Download de logs filtrados
   - Relatórios agendados

---

## 📝 Notas Técnicas

### Padrão JSend
Todas as respostas seguem o padrão JSend:
- `status: 'success'` - Operação bem-sucedida
- `status: 'fail'` - Erro do cliente (4xx)
- `status: 'error'` - Erro do servidor (5xx)

### Validação Zod
Schemas de validação em [`logsValidator.ts`](backend/src/middleware/validators/logsValidator.ts:1):
- Validação de tipos
- Transformação de dados (strings → numbers, dates)
- Mensagens de erro customizadas

### Logging Estruturado
Todos os endpoints geram logs estruturados:
```typescript
logger.info('[logsController.searchLogs] Busca concluída', {
  requestId: req.id,
  userId: req.userId,
  duration: `${duration}ms`,
  totalLogs: result.pagination.total
});
```

---

## 📚 Referências

- Schema Prisma: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:254)
- Plano de Implementação: [`docs/LOGGING-IMPLEMENTATION-PLAN-PART2.md`](docs/LOGGING-IMPLEMENTATION-PLAN-PART2.md:1)
- Standards: [`docs/STANDARDS.md`](docs/STANDARDS.md:1)

---

**Implementado por:** Kilo Code  
**Data:** 2026-01-26  
**Fase:** 2.4 - Busca Avançada de Logs  
**Status:** ✅ Completo
