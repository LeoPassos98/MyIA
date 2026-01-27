# Seção 13: Sistema de Logging Estruturado

> **NOTA:** Esta seção será integrada ao STANDARDS.md após aprovação.  
> **Versão:** 1.0  
> **Data:** 2026-01-26  
> **Status:** Em Revisão

---

## 13. Sistema de Logging Estruturado

### 13.1 Princípios Fundamentais

**Logging estruturado é OBRIGATÓRIO em todo o projeto.**

- ❌ **PROIBIDO:** `console.log()`, `console.error()`, `console.warn()`
- ✅ **OBRIGATÓRIO:** `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`

### 13.2 Estrutura de Log Padronizada

Todo log DEVE seguir a interface `LogEntry`:

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

### 13.3 Níveis de Log

| Nível | Uso | Exemplo |
|-------|-----|---------|
| `info` | Operações normais | Login, inferência concluída, requisição processada |
| `warn` | Situações anormais (não críticas) | Rate limit atingido, cache miss, retry |
| `error` | Erros que impedem operação | Falha de autenticação, erro de API, timeout |
| `debug` | Informações detalhadas (dev) | Payload enviado, resposta recebida, estado interno |

### 13.4 Uso em Controllers

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

### 13.5 Uso em Services

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

### 13.6 Segurança e Dados Sensíveis

**REGRAS ESTRITAS:**

- ❌ **NUNCA** logar senhas, tokens, chaves de API
- ❌ **NUNCA** logar dados pessoais (CPF, cartão de crédito)
- ❌ **NUNCA** logar payloads completos (podem conter dados sensíveis)
- ✅ Logar apenas IDs de usuários (não nomes/emails)
- ✅ Sanitizar inputs antes de logar
- ✅ Stack traces **APENAS** em desenvolvimento

```typescript
// ❌ PROIBIDO
logger.info('User login', { 
  email: user.email, 
  password: user.password  // NUNCA!
});

// ✅ PERMITIDO
logger.info('User login', { 
  userId: user.id,
  requestId: req.id
});
```

### 13.7 Performance

**Logs NÃO DEVEM impactar performance da aplicação.**

```typescript
// ❌ PROIBIDO - Log síncrono com objeto pesado
logger.info('Processing data', { 
  data: heavyObject  // Pode bloquear!
});

// ✅ PERMITIDO - Log assíncrono com resumo
logger.info('Processing data', {
  dataSize: heavyObject.length,
  summary: heavyObject.slice(0, 10)
});
```

### 13.8 Correlação de Logs

**Todo log DEVE incluir `requestId` quando disponível.**

```typescript
// Middleware de requestId (obrigatório)
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

// Uso em toda a aplicação
logger.info('Operation', {
  requestId: req.id,  // ✅ SEMPRE incluir
  userId: req.user?.id,
  // ... outros campos
});
```

### 13.9 Checklist de Conformidade

Antes de commitar código que usa logging:

- [ ] Usa `logger.info/warn/error/debug` (não `console.log`)
- [ ] Inclui `requestId` quando disponível
- [ ] Inclui `userId` quando disponível
- [ ] NÃO loga dados sensíveis (senhas, tokens)
- [ ] Stack traces apenas em desenvolvimento
- [ ] Contexto rico (metadata relevante)
- [ ] Nível de log correto (info/warn/error/debug)
- [ ] Performance considerada (não loga objetos pesados)

### 13.10 Migração de console.log

**FASE 1: Avisos (Não Bloqueia Commits)**

Durante a migração, o Husky irá **avisar** sobre uso de `console.log/error/warn`, mas **não bloqueará** commits.

```bash
# Exemplo de aviso
⚠️  AVISO: Encontrado console.log/error/warn
📝 Migre para logger.info/error/warn
📖 Veja: docs/STANDARDS-SECTION-13-LOGGING.md
```

**FASE 2: Bloqueio (Após Migração Completa)**

Após 100% de migração, o Husky irá **bloquear** commits com `console.log/error/warn`.

### 13.11 Exemplo de Log Completo

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

### 13.12 Referências

- **Proposta Completa:** [docs/LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md)
- **ADR:** [docs/architecture/ADR-005-LOGGING-SYSTEM.md](./architecture/ADR-005-LOGGING-SYSTEM.md)
- **Winston Docs:** [https://github.com/winstonjs/winston](https://github.com/winstonjs/winston)

---

**Documento criado em:** 2026-01-26  
**Versão:** 1.0  
**Status:** Em Revisão (Aguardando integração ao STANDARDS.md)
