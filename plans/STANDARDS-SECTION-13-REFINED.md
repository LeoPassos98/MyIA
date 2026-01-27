# Seção 13: Sistema de Logging Estruturado

> **NOTA:** Versão refinada para integração ao STANDARDS.md  
> **Versão:** 2.0 (Refinada)  
> **Data:** 2026-01-26  
> **Redução:** -53% (298 → 145 linhas)

---

## 13. Sistema de Logging Estruturado

### 13.1 Princípios Fundamentais

**Logging estruturado é OBRIGATÓRIO em todo o projeto.**

- ❌ **PROIBIDO:** `console.log()`, `console.error()`, `console.warn()`
- ✅ **OBRIGATÓRIO:** `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`

> **Integração com APIs:** Para tratamento de erros em rotas REST, veja [Seção 12.5](#125-tratamento-de-erros-error-handling)

---

### 13.2 Estrutura de Log Padronizada

Todo log DEVE seguir a interface [`LogEntry`](../backend/src/types/logging.ts):

```typescript
// backend/src/types/logging.ts
interface LogEntry {
  // Metadados obrigatórios
  timestamp: string;        // ISO 8601
  level: LogLevel;          // 'info' | 'warn' | 'error' | 'debug'
  message: string;
  
  // Contexto de requisição
  requestId?: string;       // UUID da requisição HTTP
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
    stack?: string;         // APENAS em desenvolvimento
  };
  
  // Performance e auditoria
  duration?: number;        // Duração da operação (ms)
  statusCode?: number;      // HTTP status code
  action?: string;          // Ação executada
  resource?: string;        // Recurso afetado
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
```

> **Detalhes de implementação:** Veja [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md)

---

### 13.3 Níveis de Log

| Nível | Uso | Exemplo |
|-------|-----|---------|
| `info` | Operações normais | Login, inferência concluída, requisição processada |
| `warn` | Situações anormais (não críticas) | Rate limit atingido, cache miss, retry |
| `error` | Erros que impedem operação | Falha de autenticação, erro de API, timeout |
| `debug` | Informações detalhadas (dev) | Payload enviado, resposta recebida, estado interno |

---

### 13.4 Uso Básico

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
      duration: Date.now() - startTime,
      metadata: { tokens: result.tokens, cost: result.cost }
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

> **Exemplos completos:** Veja [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md#exemplos-de-implementação)

---

### 13.5 Segurança e Dados Sensíveis

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
  password: user.password
});

// ✅ PERMITIDO
logger.info('User login', { 
  userId: user.id,
  requestId: req.id
});
```

---

### 13.6 Performance

**Logs NÃO DEVEM impactar performance da aplicação.**

- ❌ Evitar logar objetos pesados (arrays grandes, payloads completos)
- ✅ Logar apenas resumos ou tamanhos
- ✅ Usar logs assíncronos (Winston cuida disso)

```typescript
// ❌ PROIBIDO
logger.info('Processing data', { data: heavyArray });

// ✅ PERMITIDO
logger.info('Processing data', {
  dataSize: heavyArray.length,
  summary: heavyArray.slice(0, 5)
});
```

---

### 13.7 Correlação de Logs

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
```

**Uso em toda a aplicação:**

```typescript
logger.info('Operation', {
  requestId: req.id,  // ✅ SEMPRE incluir
  userId: req.user?.id,
  // ... outros campos
});
```

> **Implementação completa:** Veja [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md#2-middleware-de-request-id)

---

### 13.8 Checklist de Conformidade

Antes de commitar código que usa logging:

- [ ] Usa `logger.info/warn/error/debug` (não `console.log`)
- [ ] Inclui `requestId` quando disponível
- [ ] Inclui `userId` quando disponível
- [ ] NÃO loga dados sensíveis (senhas, tokens)
- [ ] Stack traces apenas em desenvolvimento
- [ ] Contexto rico (metadata relevante)
- [ ] Nível de log correto (info/warn/error/debug)
- [ ] Performance considerada (não loga objetos pesados)

---

### 13.9 Exemplo de Log Completo

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

### 13.10 Referências

- **Proposta Completa:** [LOGGING-SYSTEM-PROPOSAL.md](./LOGGING-SYSTEM-PROPOSAL.md)
- **ADR:** [ADR-005-LOGGING-SYSTEM.md](./architecture/ADR-005-LOGGING-SYSTEM.md)

---

**Documento refinado em:** 2026-01-26  
**Versão:** 2.0 (Refinada)  
**Redução:** -53% (298 → 145 linhas)  
**Status:** Pronto para integração ao STANDARDS.md
