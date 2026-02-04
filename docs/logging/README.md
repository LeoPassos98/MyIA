# Sistema de Logging - MyIA

> **Fonte de Verdade:** Início rápido e guia de uso do sistema de logging estruturado  
> **Última atualização:** 04/02/2026  
> **Consolidado de:** LOGGING-QUICK-START.md, LOGGING-USAGE-GUIDE.md

---

## 📖 Índice

1. [🚀 Quick Start (5 minutos)](#-quick-start-5-minutos)
2. [📘 Como Usar](#-como-usar)
3. [📚 Documentação Completa](#-documentação-completa)
4. [📚 Histórico](#-histórico)

---

## 🚀 Quick Start (5 minutos)

> **Origem:** LOGGING-QUICK-START.md

### 🎯 O Que Você Pode Fazer

O sistema de logging do MyIA oferece **4 formas** de visualizar e analisar logs:

| Método | Uso | Tempo de Setup | Melhor Para |
|--------|-----|----------------|-------------|
| **Console** | Desenvolvimento local | 0 min | Debug rápido |
| **Arquivos** | Análise offline | 0 min | Auditoria |
| **API REST** | Integração programática | 2 min | Automação |
| **Grafana** | Observabilidade visual | 3 min | Produção |

---

### 1️⃣ Ver Logs no Console (Desenvolvimento)

**Objetivo:** Ver logs em tempo real durante desenvolvimento

**Tempo:** Imediato

**Como fazer:**

```bash
# 1. Iniciar o backend
cd backend
npm run dev

# 2. Fazer uma requisição
curl http://localhost:3001/api/health

# 3. Ver logs no terminal
```

**Resultado esperado:**

```
[2026-01-26T20:30:45.123Z] INFO: [server] Servidor iniciado na porta 3001
[2026-01-26T20:30:50.456Z] INFO: [healthCheck] Health check realizado
```

**Níveis de log:**
- 🔵 **INFO** - Operações normais
- 🟡 **WARN** - Avisos (não críticos)
- 🔴 **ERROR** - Erros que precisam atenção
- 🟣 **DEBUG** - Informações detalhadas (apenas em dev)

---

### 2️⃣ Ver Logs em Arquivos

**Objetivo:** Analisar logs salvos em disco

**Tempo:** Imediato

**Como fazer:**

```bash
# 1. Navegar até a pasta de logs
cd backend/logs

# 2. Ver logs do dia atual
cat combined-2026-01-26.log

# 3. Ver apenas erros
cat error-2026-01-26.log

# 4. Buscar logs específicos
grep "userId" combined-2026-01-26.log

# 5. Ver logs em tempo real (tail)
tail -f combined-2026-01-26.log
```

**Estrutura dos arquivos:**

```
backend/logs/
├── combined-2026-01-26.log    # Todos os logs (info, warn, error)
├── error-2026-01-26.log       # Apenas erros
├── combined-2026-01-25.log    # Logs do dia anterior
└── error-2026-01-25.log       # Erros do dia anterior
```

**Formato JSON:**

```json
{
  "timestamp": "2026-01-26T20:30:45.123Z",
  "level": "info",
  "message": "Usuário fez login",
  "requestId": "req-abc-123",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "ip": "192.168.1.1",
    "action": "login"
  }
}
```

**Retenção:**
- Logs são mantidos por **30 dias**
- Arquivos antigos são deletados automaticamente

---

### 3️⃣ Buscar Logs via API REST

**Objetivo:** Buscar logs programaticamente com filtros avançados

**Tempo:** 2 minutos

**Pré-requisitos:**
- Backend rodando
- Token JWT válido

**Como fazer:**

```bash
# 1. Fazer login e obter token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"123@123.com","password":"123123"}' \
  | jq -r '.data.token')

# 2. Buscar todos os logs (paginado)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?page=1&limit=10"

# 3. Buscar apenas erros
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?level=error"

# 4. Buscar logs de um usuário
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?userId=550e8400-e29b-41d4-a716-446655440000"

# 5. Buscar logs de uma requisição (correlação)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/request/req-abc-123"

# 6. Buscar logs com texto
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?search=login"

# 7. Ver estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/stats"
```

**Resposta típica:**

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
        "metadata": {
          "model": "claude-3-sonnet",
          "provider": "anthropic"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

**Filtros disponíveis:**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `level` | Nível do log | `error`, `warn`, `info` |
| `userId` | ID do usuário | `550e8400-e29b-41d4-a716-446655440000` |
| `requestId` | ID da requisição | `req-abc-123` |
| `inferenceId` | ID da inferência | `inf-xyz-789` |
| `startDate` | Data início | `2026-01-26T00:00:00Z` |
| `endDate` | Data fim | `2026-01-26T23:59:59Z` |
| `search` | Busca em message | `login` |
| `page` | Número da página | `1` |
| `limit` | Itens por página | `20` (max: 100) |
| `sort` | Ordenação | `asc`, `desc` |

**Performance:**
- ⚡ Média: **11-26ms**
- 🎯 Todas as queries < 100ms

**Documentação completa:** [LOGS-API.md](LOGS-API.md)

---

### 4️⃣ Usar Grafana (Observabilidade Visual)

**Objetivo:** Visualizar logs em dashboards interativos

**Tempo:** 3 minutos

**Como fazer:**

```bash
# 1. Iniciar stack de observabilidade
cd observability
./start.sh start

# 2. Aguardar serviços subirem (30s)
# Loki: http://localhost:3100
# Grafana: http://localhost:3002

# 3. Acessar Grafana
# URL: http://localhost:3002
# Usuário: admin
# Senha: admin
```

**Dashboards disponíveis:**

1. **📊 Overview** - Visão geral do sistema
   - Total de logs por nível
   - Taxa de logs por minuto
   - Logs recentes

2. **🔴 Errors** - Monitoramento de erros
   - Taxa de erro em tempo real
   - Top 10 erros mais frequentes
   - Erros por endpoint
   - Timeline de erros

3. **⚡ Performance** - Análise de performance
   - Latência P50/P95/P99
   - Latência por endpoint
   - Latência por provider/model

**Queries LogQL úteis:**

```logql
# Buscar todos os logs
{app="myia-backend"}

# Buscar apenas erros
{app="myia-backend",level="error"}

# Buscar por usuário
{app="myia-backend",userId="550e8400-e29b-41d4-a716-446655440000"}

# Buscar por requestId
{app="myia-backend",requestId="req-abc-123"}

# Buscar com texto
{app="myia-backend"} |= "login"

# Taxa de erro
sum(rate({app="myia-backend",level="error"}[5m])) 
/ 
sum(rate({app="myia-backend"}[5m]))
```

**Comandos úteis:**

```bash
# Ver status dos serviços
./start.sh status

# Parar serviços
./start.sh stop

# Reiniciar serviços
./start.sh restart

# Ver logs do Loki
docker logs myia-loki -f

# Ver logs do Grafana
docker logs myia-grafana -f
```

---

## 💡 Casos de Uso Comuns

### 🔍 Caso 1: Debug de Erro em Produção

**Cenário:** Usuário reportou erro ao fazer login

**Passo a passo:**

```bash
# 1. Buscar erros recentes do usuário
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?level=error&userId=USER_ID&limit=10"

# 2. Identificar requestId do erro
# Exemplo: "requestId": "req-abc-123"

# 3. Buscar todos os logs da requisição (correlação)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/request/req-abc-123"

# 4. Analisar sequência de eventos
# - O que aconteceu antes do erro?
# - Qual foi o erro exato?
# - Qual foi o stack trace?
```

**Tempo estimado:** 2 minutos

---

### 📊 Caso 2: Monitorar Taxa de Erro

**Cenário:** Verificar se sistema está saudável

**Opção 1: Via API**

```bash
# Buscar estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs/stats"

# Resposta:
# {
#   "stats": [
#     {"level": "info", "count": 1000},
#     {"level": "error", "count": 5}
#   ]
# }
# Taxa de erro: 5/1005 = 0.5% ✅
```

**Opção 2: Via Grafana**

1. Acessar dashboard "Errors"
2. Ver painel "Taxa de Erro"
3. Verificar se está abaixo de 5%

**Tempo estimado:** 1 minuto

---

### 🔎 Caso 3: Rastrear Jornada do Usuário

**Cenário:** Entender o que um usuário fez no sistema

**Passo a passo:**

```bash
# 1. Buscar todos os logs do usuário (últimas 24h)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/logs?userId=USER_ID&startDate=2026-01-26T00:00:00Z&limit=100"

# 2. Analisar ações:
# - Login
# - Requisições feitas
# - Erros encontrados
# - Logout

# 3. Identificar padrões:
# - Quais features mais usou?
# - Onde teve problemas?
# - Quanto tempo ficou ativo?
```

**Tempo estimado:** 3 minutos

---

## 🆘 Problemas Comuns

### ❌ Problema 1: Logs não aparecem no console

**Sintomas:**
- Terminal não mostra logs
- Aplicação parece "muda"

**Soluções:**

1. **Nível de log muito alto:**
   ```bash
   # Definir nível para debug
   export LOG_LEVEL=debug
   npm run dev
   ```

2. **Logger não inicializado:**
   ```typescript
   // Verificar se logger está sendo importado
   import { logger } from './utils/logger';
   ```

---

### ❌ Problema 2: API retorna 401 Unauthorized

**Sintomas:**
- Todas as requisições retornam 401
- Mensagem: "Token inválido"

**Soluções:**

1. **Token expirado:**
   ```bash
   # Fazer login novamente
   TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"123@123.com","password":"123123"}' \
     | jq -r '.data.token')
   ```

2. **Token malformado:**
   ```bash
   # Verificar formato: Bearer <token>
   curl -H "Authorization: Bearer $TOKEN" ...
   ```

---

### ❌ Problema 3: Grafana não mostra logs

**Sintomas:**
- Dashboards vazios
- Queries não retornam dados

**Soluções:**

1. **Loki não está rodando:**
   ```bash
   cd observability
   ./start.sh start
   ```

2. **Promtail não encontra arquivos:**
   ```bash
   # Verificar path em promtail-config.yml
   cat observability/promtail/promtail-config.yml | grep path
   
   # Deve apontar para: /var/log/myia/*.log
   # Que mapeia para: ../backend/logs/*.log
   ```

---

## 📚 Referências Rápidas

### Comandos Essenciais

```bash
# Backend
npm run dev                    # Iniciar backend
npm run build                  # Build para produção
npm run test                   # Executar testes

# Observabilidade
cd observability
./start.sh start              # Iniciar Loki + Grafana
./start.sh stop               # Parar serviços
./start.sh status             # Ver status
./validate.sh                 # Validar configuração

# Logs
tail -f backend/logs/combined-*.log    # Ver logs em tempo real
grep "error" backend/logs/*.log        # Buscar erros
cat backend/logs/error-*.log           # Ver apenas erros

# Database
psql -U leonardo -h localhost -d myia  # Conectar ao banco
npx tsx scripts/cleanup-logs.ts        # Limpar logs antigos
```

### URLs Importantes

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Backend | http://localhost:3001 | - |
| Grafana | http://localhost:3002 | admin / admin |
| Loki | http://localhost:3100 | - |

---

## 📘 Como Usar

> **Origem:** LOGGING-USAGE-GUIDE.md

### 1. Introdução

O sistema de logging do MyIA utiliza **Winston** para criar logs estruturados, rastreáveis e seguros. Este guia fornece exemplos práticos para desenvolvedores que precisam adicionar logging ao código.

#### Por que Logging Estruturado?

- ✅ **Rastreabilidade:** Correlacionar logs de uma mesma requisição via `requestId`
- ✅ **Debugging:** Identificar problemas rapidamente com contexto rico
- ✅ **Auditoria:** Rastrear ações de usuários e operações de IA
- ✅ **Performance:** Identificar gargalos com métricas de duração
- ✅ **Segurança:** Logs seguros sem expor dados sensíveis

---

### 2. Uso Básico

#### 2.1 Importar o Logger

```typescript
import { logger } from '../utils/logger';
```

#### 2.2 Níveis de Log

| Nível | Método | Quando Usar |
|-------|--------|-------------|
| `info` | `logger.info()` | Operações normais (login, inferência concluída) |
| `warn` | `logger.warn()` | Situações anormais não críticas (rate limit, cache miss) |
| `error` | `logger.error()` | Erros que impedem operação (falha de API, timeout) |
| `debug` | `logger.debug()` | Informações detalhadas para desenvolvimento |

#### 2.3 Exemplo Simples

```typescript
// Log básico
logger.info('Aplicação iniciada');

// Log com contexto
logger.info('Usuário autenticado', {
  userId: 'user-123',
  requestId: req.id
});

// Log de aviso
logger.warn('Rate limit approaching', {
  requestId: req.id,
  metadata: {
    currentRequests: 45,
    limit: 50
  }
});

// Log de erro
logger.error('Database connection failed', {
  requestId: req.id,
  error: error.message
});
```

---

### 3. Logging Estruturado

#### 3.1 Interface LogEntry

Todo log segue a interface `LogEntry`:

```typescript
interface LogEntry {
  // Obrigatórios (gerados automaticamente)
  timestamp: string;        // ISO 8601
  level: LogLevel;          // 'info' | 'warn' | 'error' | 'debug'
  message: string;
  
  // Contexto de requisição (recomendado)
  requestId?: string;       // UUID da requisição HTTP
  userId?: string;          // ID do usuário autenticado
  
  // Contexto de inferência (opcional)
  inferenceId?: string;     // ID da inferência de IA
  
  // Dados adicionais (opcional)
  metadata?: Record<string, any>;
  error?: Error;
}
```

#### 3.2 Exemplo de Log Estruturado

```typescript
logger.info('AI inference completed', {
  // Contexto de requisição
  requestId: req.id,
  userId: req.user.id,
  
  // Contexto de inferência
  inferenceId: result.id,
  
  // Metadados adicionais
  metadata: {
    provider: 'bedrock',
    model: 'anthropic.claude-3-sonnet',
    tokensIn: 500,
    tokensOut: 300,
    cost: 0.01,
    duration: 1234
  }
});
```

---

### 4. Correlação de Logs (requestId)

#### 4.1 O que é requestId?

O `requestId` é um UUID único gerado para cada requisição HTTP. Ele permite correlacionar todos os logs de uma mesma requisição, facilitando o debugging.

#### 4.2 Como Funciona?

1. **Middleware** `requestIdMiddleware` gera UUID único
2. UUID é adicionado a `req.id`
3. Header `X-Request-ID` é incluído na resposta
4. Todos os logs da requisição incluem o mesmo `requestId`

#### 4.3 Exemplo de Uso

```typescript
// backend/src/controllers/chatController.ts
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  // Início da requisição
  logger.info('Chat message received', {
    requestId: req.id,  // ✅ SEMPRE incluir
    userId: req.user.id
  });
  
  // Durante processamento
  logger.info('Fetching chat history', {
    requestId: req.id,  // ✅ Mesmo requestId
    chatId: req.body.chatId
  });
  
  // Chamada ao service
  const result = await aiService.generate(payload, {
    requestId: req.id,  // ✅ Propagar para services
    userId: req.user.id
  });
  
  // Fim da requisição
  logger.info('Chat message sent', {
    requestId: req.id,  // ✅ Mesmo requestId
    userId: req.user.id,
    duration: Date.now() - startTime
  });
}
```

---

### 5. Logging em Controllers

#### 5.1 Padrão Recomendado

```typescript
// backend/src/controllers/chatController.ts
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';

export async function sendMessage(req: AuthRequest, res: Response) {
  const startTime = Date.now();
  
  try {
    // 1. Log de início
    logger.info('Chat message received', {
      requestId: req.id,
      userId: req.user.id,
      metadata: {
        chatId: req.body.chatId,
        messageLength: req.body.message.length
      }
    });
    
    // 2. Processamento
    const result = await chatService.processMessage(req.body, {
      requestId: req.id,
      userId: req.user.id
    });
    
    // 3. Log de sucesso
    logger.info('Chat message sent', {
      requestId: req.id,
      userId: req.user.id,
      duration: Date.now() - startTime,
      metadata: {
        messageId: result.id,
        tokensUsed: result.tokens
      }
    });
    
    return res.json(jsend.success(result));
    
  } catch (error) {
    // 4. Log de erro
    logger.error('Chat message failed', {
      requestId: req.id,
      userId: req.user.id,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined
    });
    
    throw error;  // Deixar errorHandler global tratar
  }
}
```

#### 5.2 Checklist para Controllers

- [ ] Log de início da operação (`logger.info`)
- [ ] Incluir `requestId` e `userId`
- [ ] Log de sucesso com métricas (`duration`, `metadata`)
- [ ] Log de erro com contexto (`error`, `stack` apenas em dev)
- [ ] Não logar dados sensíveis (senhas, tokens)
- [ ] Não logar payloads completos (apenas resumos)

---

### 6. Boas Práticas

#### 6.1 Mensagens Claras e Concisas

```typescript
// ❌ RUIM - Vago
logger.info('Done');

// ✅ BOM - Específico
logger.info('AI inference completed');

// ❌ RUIM - Muito longo
logger.info('The user with ID user-123 has successfully completed the authentication process and is now logged in to the system');

// ✅ BOM - Conciso
logger.info('User login successful', {
  userId: 'user-123'
});
```

#### 6.2 Contexto Rico

```typescript
// ❌ RUIM - Sem contexto
logger.info('Inference completed');

// ✅ BOM - Contexto rico
logger.info('AI inference completed', {
  requestId: req.id,
  userId: req.user.id,
  inferenceId: result.id,
  duration: Date.now() - startTime,
  metadata: {
    provider: 'bedrock',
    model: 'anthropic.claude-3-sonnet',
    tokensIn: 500,
    tokensOut: 300,
    cost: 0.01,
    strategy: 'rag'
  }
});
```

---

### 7. Segurança

#### 7.1 Dados Sensíveis (NUNCA logar)

```typescript
// ❌ PROIBIDO
logger.info('User login', {
  email: user.email,           // ❌ Dado pessoal
  password: user.password,     // ❌ Credencial
  token: jwt.sign(user),       // ❌ Token de autenticação
  apiKey: process.env.API_KEY  // ❌ Chave de API
});

// ✅ PERMITIDO
logger.info('User login', {
  userId: user.id,             // ✅ Apenas ID
  requestId: req.id
});
```

#### 7.2 Stack Traces em Produção

```typescript
// ❌ PROIBIDO - Stack trace em produção
logger.error('Operation failed', {
  error: error.message,
  stack: error.stack  // ❌ Expõe estrutura interna
});

// ✅ PERMITIDO - Stack trace apenas em desenvolvimento
logger.error('Operation failed', {
  error: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});
```

---

## 📚 Documentação Completa

- **[LOGGING-SYSTEM.md](LOGGING-SYSTEM.md)** - Arquitetura e implementação completa
- **[LOGS-API.md](LOGS-API.md)** - Referência de API REST
- **[STANDARDS.md §13](../STANDARDS.md#13-sistema-de-logging-estruturado)** - Padrões de logging

---

## 📚 Histórico

### Documentos Consolidados

Este documento consolida o conteúdo dos seguintes arquivos:

- [`LOGGING-QUICK-START.md`](../../archive/logging/LOGGING-QUICK-START.md) - Movido para archive/
- [`LOGGING-USAGE-GUIDE.md`](../../archive/logging/LOGGING-USAGE-GUIDE.md) - Movido para archive/

### Documentos Históricos

Para consultar versões antigas e roadmaps arquivados:

- [archive/logging/](../../archive/logging/) - Documentos históricos de logging

---

**Criado por:** Kilo Code  
**Data:** 04/02/2026  
**Versão:** 1.0  
**Status:** ✅ Completo
