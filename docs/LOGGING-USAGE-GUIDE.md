# Guia de Uso - Sistema de Logging

> **Versão:** 1.0  
> **Data:** 2026-01-26  
> **Status:** Ativo  
> **Referências:** [`STANDARDS.md §13`](./STANDARDS.md#13-sistema-de-logging-estruturado) | [`LOGGING-IMPLEMENTATION-PLAN.md`](./LOGGING-IMPLEMENTATION-PLAN.md) | [`ADR-005`](./architecture/ADR-005-LOGGING-SYSTEM.md)

---

## 📋 Índice

1. [Introdução](#1-introdução)
2. [Uso Básico](#2-uso-básico)
3. [Logging Estruturado](#3-logging-estruturado)
4. [Correlação de Logs (requestId)](#4-correlação-de-logs-requestid)
5. [Contexto de Usuário (userId)](#5-contexto-de-usuário-userid)
6. [Logging em Controllers](#6-logging-em-controllers)
7. [Logging em Services](#7-logging-em-services)
8. [Logging de Erros](#8-logging-de-erros)
9. [Boas Práticas](#9-boas-práticas)
10. [Segurança](#10-segurança)
11. [Troubleshooting](#11-troubleshooting)
12. [FAQ](#12-faq)

---

## 1. Introdução

O sistema de logging do MyIA utiliza **Winston** para criar logs estruturados, rastreáveis e seguros. Este guia fornece exemplos práticos para desenvolvedores que precisam adicionar logging ao código.

### Por que Logging Estruturado?

- ✅ **Rastreabilidade:** Correlacionar logs de uma mesma requisição via `requestId`
- ✅ **Debugging:** Identificar problemas rapidamente com contexto rico
- ✅ **Auditoria:** Rastrear ações de usuários e operações de IA
- ✅ **Performance:** Identificar gargalos com métricas de duração
- ✅ **Segurança:** Logs seguros sem expor dados sensíveis

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplicação Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Services    │  │  Middlewares │      │
│  │              │  │              │  │              │      │
│  │ logger.info()│  │ logger.warn()│  │ logger.error()│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │   Winston   │                          │
│                    │   Logger    │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │ Console │      │  File   │      │  Future │          │
│    │Transport│      │Transport│      │PostgreSQL│         │
│    └─────────┘      └─────────┘      └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Uso Básico

### 2.1 Importar o Logger

```typescript
import { logger } from '../utils/logger';
```

### 2.2 Níveis de Log

| Nível | Método | Quando Usar |
|-------|--------|-------------|
| `info` | `logger.info()` | Operações normais (login, inferência concluída) |
| `warn` | `logger.warn()` | Situações anormais não críticas (rate limit, cache miss) |
| `error` | `logger.error()` | Erros que impedem operação (falha de API, timeout) |
| `debug` | `logger.debug()` | Informações detalhadas para desenvolvimento |

### 2.3 Exemplo Simples

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

## 3. Logging Estruturado

### 3.1 Interface LogEntry

Todo log segue a interface [`LogEntry`](../backend/src/types/logging.ts):

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

### 3.2 Exemplo de Log Estruturado

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

### 3.3 Formato de Saída

**Console (Desenvolvimento):**
```
[2026-01-26 17:30:00] [info] AI inference completed {
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "inferenceId": "inf-456",
  "metadata": {
    "provider": "bedrock",
    "model": "anthropic.claude-3-sonnet",
    "tokensIn": 500,
    "tokensOut": 300,
    "cost": 0.01,
    "duration": 1234
  }
}
```

**Arquivo (Produção - JSON):**
```json
{
  "timestamp": "2026-01-26T20:30:00.000Z",
  "level": "info",
  "message": "AI inference completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "inferenceId": "inf-456",
  "metadata": {
    "provider": "bedrock",
    "model": "anthropic.claude-3-sonnet",
    "tokensIn": 500,
    "tokensOut": 300,
    "cost": 0.01,
    "duration": 1234
  }
}
```

---

## 4. Correlação de Logs (requestId)

### 4.1 O que é requestId?

O `requestId` é um UUID único gerado para cada requisição HTTP. Ele permite correlacionar todos os logs de uma mesma requisição, facilitando o debugging.

### 4.2 Como Funciona?

1. **Middleware** [`requestIdMiddleware`](../backend/src/middleware/requestId.ts) gera UUID único
2. UUID é adicionado a `req.id`
3. Header `X-Request-ID` é incluído na resposta
4. Todos os logs da requisição incluem o mesmo `requestId`

### 4.3 Exemplo de Uso

```typescript
// backend/src/controllers/chatController.ts
export async function sendMessage(req: AuthRequest, res: Response) {
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

### 4.4 Rastreando Logs por requestId

**Buscar todos os logs de uma requisição:**

```bash
# Em logs/combined.log
grep "550e8400-e29b-41d4-a716-446655440000" logs/combined.log

# Resultado:
# [2026-01-26 17:30:00] [info] Chat message received {"requestId":"550e8400..."}
# [2026-01-26 17:30:01] [info] Fetching chat history {"requestId":"550e8400..."}
# [2026-01-26 17:30:02] [info] AI inference started {"requestId":"550e8400..."}
# [2026-01-26 17:30:05] [info] AI inference completed {"requestId":"550e8400..."}
# [2026-01-26 17:30:05] [info] Chat message sent {"requestId":"550e8400..."}
```

---

## 5. Contexto de Usuário (userId)

### 5.1 Por que incluir userId?

- ✅ Rastrear ações de usuários específicos
- ✅ Identificar padrões de uso
- ✅ Auditoria de segurança
- ✅ Debugging de problemas específicos de usuários

### 5.2 Como Obter userId?

```typescript
// Após autenticação (middleware authMiddleware)
const userId = req.user?.id;

// Em rotas autenticadas
logger.info('Operation', {
  requestId: req.id,
  userId: req.user.id  // ✅ Disponível após authMiddleware
});

// Em rotas públicas (login, registro)
logger.info('Login attempt', {
  requestId: req.id,
  userId: undefined  // ✅ Ainda não autenticado
});
```

### 5.3 Exemplo Completo

```typescript
// backend/src/controllers/authController.ts
export async function login(req: AuthRequest, res: Response) {
  // Antes da autenticação
  logger.info('Login attempt', {
    requestId: req.id,
    // userId ainda não disponível
  });
  
  const user = await authService.login(req.body);
  
  // Após autenticação
  logger.info('Login successful', {
    requestId: req.id,
    userId: user.id,  // ✅ Agora disponível
    duration: Date.now() - startTime
  });
}
```

---

## 6. Logging em Controllers

### 6.1 Padrão Recomendado

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

### 6.2 Checklist para Controllers

- [ ] Log de início da operação (`logger.info`)
- [ ] Incluir `requestId` e `userId`
- [ ] Log de sucesso com métricas (`duration`, `metadata`)
- [ ] Log de erro com contexto (`error`, `stack` apenas em dev)
- [ ] Não logar dados sensíveis (senhas, tokens)
- [ ] Não logar payloads completos (apenas resumos)

---

## 7. Logging em Services

### 7.1 Padrão para Services de IA

```typescript
// backend/src/services/ai/adapters/anthropic.adapter.ts
import { logger } from '../../../utils/logger';

export class AnthropicAdapter {
  async generate(payload: any, options: any) {
    const startTime = Date.now();
    
    // 1. Log de início
    logger.info('AI inference started', {
      requestId: options.requestId,
      userId: options.userId,
      provider: 'anthropic',
      model: options.modelId,
      metadata: {
        messageCount: payload.length,
        estimatedTokens: this.estimateTokens(payload)
      }
    });
    
    try {
      // 2. Chamada à API
      const response = await this.client.messages.create({
        model: options.modelId,
        messages: payload,
        max_tokens: options.maxTokens || 4096
      });
      
      // 3. Log de sucesso
      logger.info('AI inference completed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: 'anthropic',
        model: options.modelId,
        duration: Date.now() - startTime,
        metadata: {
          tokensIn: response.usage.input_tokens,
          tokensOut: response.usage.output_tokens,
          cost: this.calculateCost(response.usage),
          stopReason: response.stop_reason
        }
      });
      
      return response;
      
    } catch (error) {
      // 4. Log de erro
      logger.error('AI inference failed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: 'anthropic',
        model: options.modelId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
        metadata: {
          errorType: error.constructor.name,
          statusCode: (error as any).status
        }
      });
      
      throw error;
    }
  }
}
```

### 7.2 Padrão para Services de Negócio

```typescript
// backend/src/services/chat/contextService.ts
import { logger } from '../../utils/logger';

export class ContextService {
  async getHybridRagHistory(
    chatId: string,
    query: string,
    requestId: string,
    userId: string
  ) {
    const startTime = Date.now();
    
    logger.info('Fetching hybrid RAG history', {
      requestId,
      userId,
      metadata: {
        chatId,
        queryLength: query.length
      }
    });
    
    try {
      // 1. Buscar mensagens pinadas
      const pinnedMessages = await this.getPinnedMessages(chatId);
      
      logger.debug('Pinned messages fetched', {
        requestId,
        metadata: {
          count: pinnedMessages.length
        }
      });
      
      // 2. Buscar mensagens por RAG
      const ragMessages = await this.getRagMessages(chatId, query);
      
      logger.debug('RAG messages fetched', {
        requestId,
        metadata: {
          count: ragMessages.length,
          similarity: ragMessages[0]?.similarity
        }
      });
      
      // 3. Combinar contexto
      const finalContext = this.mergeContext(pinnedMessages, ragMessages);
      
      logger.info('Hybrid RAG history completed', {
        requestId,
        userId,
        duration: Date.now() - startTime,
        metadata: {
          totalMessages: finalContext.length,
          pinnedCount: pinnedMessages.length,
          ragCount: ragMessages.length
        }
      });
      
      return finalContext;
      
    } catch (error) {
      logger.error('Hybrid RAG history failed', {
        requestId,
        userId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}
```

### 7.3 Checklist para Services

- [ ] Propagar `requestId` e `userId` de controllers
- [ ] Log de início e fim de operações longas
- [ ] Incluir métricas de performance (`duration`)
- [ ] Logs de debug para etapas intermediárias
- [ ] Contexto rico em `metadata`
- [ ] Não logar dados sensíveis

---

## 8. Logging de Erros

### 8.1 Padrão de Erro Completo

```typescript
try {
  // Operação que pode falhar
  const result = await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    requestId: req.id,
    userId: req.user?.id,
    duration: Date.now() - startTime,
    
    // Informações do erro
    error: error instanceof Error ? error.message : String(error),
    
    // Stack trace apenas em desenvolvimento
    stack: process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.stack
      : undefined,
    
    // Contexto adicional
    metadata: {
      operation: 'riskyOperation',
      input: sanitizedInput,  // ✅ Sanitizado
      errorType: error.constructor.name,
      statusCode: (error as any).status
    }
  });
  
  throw error;  // Re-throw para errorHandler global
}
```

### 8.2 Tipos de Erro

#### Erro de Validação (400)

```typescript
logger.warn('Validation failed', {
  requestId: req.id,
  metadata: {
    field: 'email',
    value: 'invalid-email',  // ✅ OK logar valor inválido (não sensível)
    reason: 'Invalid email format'
  }
});
```

#### Erro de Autenticação (401)

```typescript
logger.warn('Authentication failed', {
  requestId: req.id,
  metadata: {
    reason: 'Invalid credentials'
    // ❌ NÃO logar email ou senha
  }
});
```

#### Erro de API Externa (502)

```typescript
logger.error('External API failed', {
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime,
  error: error.message,
  metadata: {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat',
    statusCode: error.status,
    retryAttempt: 2
  }
});
```

#### Erro de Timeout (504)

```typescript
logger.error('Operation timeout', {
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime,
  metadata: {
    operation: 'AI inference',
    timeout: 30000,
    provider: 'bedrock'
  }
});
```

### 8.3 Checklist para Erros

- [ ] Usar `logger.error` para erros críticos
- [ ] Usar `logger.warn` para erros não críticos
- [ ] Incluir `requestId` e `userId`
- [ ] Incluir `duration` para medir impacto
- [ ] Stack trace **APENAS** em desenvolvimento
- [ ] Contexto rico em `metadata`
- [ ] Não logar dados sensíveis

---

## 9. Boas Práticas

### 9.1 Mensagens Claras e Concisas

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

### 9.2 Níveis de Log Apropriados

```typescript
// ✅ INFO - Operações normais
logger.info('User logged in', { userId: 'user-123' });
logger.info('AI inference completed', { inferenceId: 'inf-456' });

// ✅ WARN - Situações anormais não críticas
logger.warn('Rate limit approaching', { currentRequests: 45, limit: 50 });
logger.warn('Cache miss', { cacheKey: 'user-settings-123' });

// ✅ ERROR - Erros que impedem operação
logger.error('Database connection failed', { error: error.message });
logger.error('AI inference timeout', { duration: 30000 });

// ✅ DEBUG - Informações detalhadas (apenas dev)
logger.debug('Request payload', { body: req.body });
logger.debug('Context state', { historySize: 10, ragEnabled: true });
```

### 9.3 Contexto Rico

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

### 9.4 Performance

```typescript
// ❌ RUIM - Logar objeto pesado
logger.info('Processing data', {
  data: heavyArray  // Array com 10.000 itens
});

// ✅ BOM - Logar resumo
logger.info('Processing data', {
  dataSize: heavyArray.length,
  firstItems: heavyArray.slice(0, 5),
  lastItems: heavyArray.slice(-5)
});

// ❌ RUIM - Logar payload completo
logger.debug('Request payload', {
  payload: req.body  // Pode conter dados sensíveis
});

// ✅ BOM - Logar apenas tamanho
logger.debug('Request payload', {
  payloadSize: JSON.stringify(req.body).length,
  fields: Object.keys(req.body)
});
```

### 9.5 Consistência

```typescript
// ✅ Padrão consistente em todo o projeto

// Início de operação
logger.info('Operation started', {
  requestId: req.id,
  userId: req.user.id,
  metadata: { /* contexto */ }
});

// Fim de operação
logger.info('Operation completed', {
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime,
  metadata: { /* resultado */ }
});

// Erro
logger.error('Operation failed', {
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime,
  error: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});
```

---

## 10. Segurança

### 10.1 Dados Sensíveis (NUNCA logar)

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

### 10.2 Sanitização de Dados

```typescript
// Função helper para sanitizar
function sanitizeForLog(data: any): any {
  const sensitive = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Uso
logger.debug('Request received', {
  requestId: req.id,
  body: sanitizeForLog(req.body),  // ✅ Sanitizado
  headers: sanitizeForLog(req.headers)
});
```

### 10.3 Stack Traces em Produção

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

### 10.4 Checklist de Segurança

Antes de adicionar um log, verificar:

- [ ] **NÃO** contém senhas ou tokens
- [ ] **NÃO** contém emails ou nomes completos
- [ ] **NÃO** contém dados de pagamento
- [ ] **NÃO** contém chaves de API
- [ ] **NÃO** contém headers de autenticação
- [ ] Stack traces **APENAS** em desenvolvimento
- [ ] Usa apenas IDs para identificar usuários
- [ ] Payloads grandes são resumidos

---

## 11. Troubleshooting

### 11.1 Logs não aparecem no console

**Problema:** Logs não são exibidos no terminal durante desenvolvimento.

**Solução:**

```bash
# Verificar nível de log
echo $LOG_LEVEL  # Deve ser 'debug' ou 'info'

# Definir nível de log
export LOG_LEVEL=debug

# Reiniciar aplicação
npm run dev
```

### 11.2 Logs não são salvos em arquivo

**Problema:** Arquivo `logs/combined.log` não é criado.

**Solução:**

```bash
# Verificar se diretório existe
ls -la backend/logs

# Criar diretório se não existir
mkdir -p backend/logs

# Verificar permissões
chmod 755 backend/logs

# Reiniciar aplicação
npm run dev
```

### 11.3 requestId não aparece nos logs

**Problema:** Campo `requestId` está `undefined` nos logs.

**Solução:**

```typescript
// Verificar se middleware está aplicado
// backend/src/server.ts

import { requestIdMiddleware } from './middleware/requestId';

// ✅ Aplicar ANTES das rotas
app.use(requestIdMiddleware);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
```

### 11.4 Performance degradada

**Problema:** Aplicação lenta após adicionar logs.

**Solução:**

```typescript
// ❌ RUIM - Logar objetos pesados
logger.info('Processing', { data: heavyArray });

// ✅ BOM - Logar apenas resumo
logger.info('Processing', {
  dataSize: heavyArray.length,
  summary: heavyArray.slice(0, 5)
});

// ❌ RUIM - Logs síncronos
logger.info('Message', { /* ... */ });

// ✅ BOM - Winston já é assíncrono por padrão
// Não precisa fazer nada especial
```

### 11.5 Erro "Cannot find module 'winston'"

**Problema:** Erro ao importar Winston.

**Solução:**

```bash
# Instalar dependências
cd backend
npm install winston winston-sqlite3

# Verificar instalação
npm list winston

# Resultado esperado:
# winston@3.19.0
```

---

## 12. FAQ

### Q1: Devo logar em todos os métodos?

**R:** Não necessariamente. Foque em:
- ✅ Pontos de entrada (controllers)
- ✅ Operações críticas (IA, banco de dados)
- ✅ Erros e exceções
- ❌ Funções auxiliares simples
- ❌ Getters/setters

### Q2: Qual a diferença entre `logger.warn` e `logger.error`?

**R:**
- **`logger.warn`**: Situações anormais que **NÃO impedem** a operação (rate limit, cache miss, retry)
- **`logger.error`**: Erros que **impedem** a operação (falha de API, timeout, exceção)

**Exemplo:**
```typescript
// ✅ WARN - Operação continua
logger.warn('Cache miss, using database', {
  cacheKey: 'user-settings-123'
});

// ✅ ERROR - Operação falhou
logger.error('Database connection failed', {
  error: error.message
});
```

### Q3: Posso usar `console.log` em testes?

**R:** Sim, mas com moderação:
- ✅ **Permitido** em testes para debug temporário
- ❌ **Proibido** em código de produção
- ✅ **Recomendado** usar `logger.debug` mesmo em testes

**Exemplo:**
```typescript
// ✅ OK em testes (temporário)
console.log('Test data:', testData);

// ✅ MELHOR - Usar logger
logger.debug('Test data', { testData });
```

### Q4: Como logar operações assíncronas (fire-and-forget)?

**R:** Use `logger` normalmente, Winston é assíncrono por padrão:

```typescript
// Fire-and-forget (não aguarda)
aiService.embed(content).then(async (emb) => {
  if (emb) {
    await prisma.message.update({
      where: { id: messageId },
      data: { vector: emb.vector }
    });
    
    // ✅ Log de sucesso
    logger.info('Embedding generated', {
      requestId,
      messageId,
      vectorSize: emb.vector.length
    });
  }
}).catch(error => {
  // ✅ Log de erro
  logger.error('Embedding generation failed', {
    requestId,
    messageId,
    error: error.message
  });
});
```

### Q5: Devo logar em middlewares?

**R:** Sim, especialmente para:
- ✅ Autenticação (sucesso/falha)
- ✅ Rate limiting (avisos/bloqueios)
- ✅ Validação (erros de validação)
- ❌ Middlewares simples (CORS, body-parser)

**Exemplo:**
```typescript
// backend/src/middleware/authMiddleware.ts
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.warn('Authentication failed: no token', {
        requestId: req.id
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.info('Authentication successful', {
      requestId: req.id,
      userId: decoded.id
    });
    
    next();
  } catch (error) {
    logger.error('Authentication failed: invalid token', {
      requestId: req.id,
      error: error.message
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

### Q6: Como logar em loops?

**R:** Evite logar em cada iteração. Prefira resumos:

```typescript
// ❌ RUIM - Log em cada iteração
for (const item of items) {
  logger.info('Processing item', { item });
  await processItem(item);
}

// ✅ BOM - Log de resumo
logger.info('Processing items started', {
  requestId: req.id,
  totalItems: items.length
});

for (const item of items) {
  await processItem(item);
}

logger.info('Processing items completed', {
  requestId: req.id,
  totalItems: items.length,
  duration: Date.now() - startTime
});

// ✅ ACEITÁVEL - Log de progresso (a cada 100 itens)
for (let i = 0; i < items.length; i++) {
  await processItem(items[i]);
  
  if (i % 100 === 0) {
    logger.debug('Processing progress', {
      requestId: req.id,
      processed: i,
      total: items.length,
      percentage: Math.round((i / items.length) * 100)
    });
  }
}
```

### Q7: Como logar em streams (SSE)?

**R:** Use logs estruturados para rastrear o ciclo de vida do stream:

```typescript
// Início do stream
logger.info('SSE stream started', {
  requestId: req.id,
  userId: req.user.id,
  chatId: req.body.chatId
});

try {
  for await (const chunk of stream) {
    // ❌ NÃO logar cada chunk (muito verboso)
    // logger.debug('Chunk received', { chunk });
    
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  
  // Fim do stream
  logger.info('SSE stream completed', {
    requestId: req.id,
    userId: req.user.id,
    duration: Date.now() - startTime
  });
  
} catch (error) {
  // Erro no stream
  logger.error('SSE stream failed', {
    requestId: req.id,
    userId: req.user.id,
    duration: Date.now() - startTime,
    error: error.message
  });
}
```

### Q8: Como logar métricas de performance?

**R:** Use o campo `duration` e `metadata`:

```typescript
const startTime = Date.now();

// Operação
const result = await heavyOperation();

// Log com métricas
logger.info('Heavy operation completed', {
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime,  // ✅ Duração em ms
  metadata: {
    itemsProcessed: result.count,
    cacheHits: result.cacheHits,
    cacheMisses: result.cacheMisses,
    avgProcessingTime: result.avgTime
  }
});
```

### Q9: Posso logar em produção?

**R:** Sim! O sistema de logging foi projetado para produção:
- ✅ Logs estruturados em JSON
- ✅ Rotação automática de arquivos
- ✅ Performance otimizada (< 5ms por log)
- ✅ Sem dados sensíveis
- ✅ Stack traces apenas em desenvolvimento

**Configuração de produção:**
```bash
# .env (produção)
NODE_ENV=production
LOG_LEVEL=info  # Não usar 'debug' em produção
```

### Q10: Como buscar logs específicos?

**R:** Use `grep` ou ferramentas de busca:

**Por requestId:**
```bash
grep "550e8400-e29b-41d4-a716-446655440000" logs/combined.log
```

**Por userId:**
```bash
grep "user-123" logs/combined.log
```

**Por nível de erro:**
```bash
grep '"level":"error"' logs/combined.log
```

**Por período:**
```bash
grep "2026-01-26" logs/combined.log
```

**Combinado:**
```bash
grep "user-123" logs/combined.log | grep "error"
```

### Q11: Quanto espaço os logs ocupam?

**R:** Depende do volume de requisições, mas o Winston gerencia automaticamente:

**Configuração atual:**
- **Tamanho máximo por arquivo:** 10MB
- **Número de arquivos:** 5 (rotação automática)
- **Espaço total máximo:** ~50MB por tipo de log

**Exemplo:**
```
logs/
├── combined.log      (10MB - atual)
├── combined.log.1    (10MB - rotacionado)
├── combined.log.2    (10MB - rotacionado)
├── combined.log.3    (10MB - rotacionado)
├── combined.log.4    (10MB - rotacionado)
├── error.log         (10MB - atual)
└── error.log.1       (10MB - rotacionado)
```

### Q12: Como testar logs?

**R:** Use mocks do Winston em testes unitários:

```typescript
// backend/src/utils/__tests__/logger.test.ts
import { logger } from '../logger';

// Mock do Winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  },
  config: {
    npm: {
      levels: {}
    }
  }
}));

describe('Logger', () => {
  it('should log info messages', () => {
    logger.info('Test message', { userId: 'user-123' });
    
    // Verificar que foi chamado
    expect(logger.info).toHaveBeenCalledWith('Test message', {
      userId: 'user-123'
    });
  });
});
```

---

## 📚 Referências

- **STANDARDS.md Seção 13:** [`docs/STANDARDS.md#13-sistema-de-logging-estruturado`](./STANDARDS.md#13-sistema-de-logging-estruturado)
- **Plano de Implementação:** [`docs/LOGGING-IMPLEMENTATION-PLAN.md`](./LOGGING-IMPLEMENTATION-PLAN.md)
- **Proposta Completa:** [`docs/LOGGING-SYSTEM-PROPOSAL.md`](./LOGGING-SYSTEM-PROPOSAL.md)
- **ADR-005:** [`docs/architecture/ADR-005-LOGGING-SYSTEM.md`](./architecture/ADR-005-LOGGING-SYSTEM.md)
- **Interface LogEntry:** [`backend/src/types/logging.ts`](../backend/src/types/logging.ts)
- **Logger Implementation:** [`backend/src/utils/logger.ts`](../backend/src/utils/logger.ts)
- **RequestId Middleware:** [`backend/src/middleware/requestId.ts`](../backend/src/middleware/requestId.ts)

---

## 🎯 Próximos Passos

Após dominar este guia:

1. **Fase 2:** Migração para PostgreSQL (logs persistentes)
2. **Fase 3:** Observabilidade com Grafana + Loki
3. **Dashboards:** Visualização de logs em tempo real
4. **Alertas:** Notificações automáticas de erros críticos

---

**Última atualização:** 2026-01-26  
**Versão:** 1.0  
**Autor:** MyIA Team