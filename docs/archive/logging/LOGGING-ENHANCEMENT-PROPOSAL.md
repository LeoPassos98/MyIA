# Proposta de Aprimoramento do Sistema de Logging

> **Documento:** Análise Completa e Roadmap de Implementação  
> **Data:** 2026-01-27  
> **Versão:** 1.0  
> **Status:** 🟡 Proposta para Aprovação

---

## 📋 Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Análise da Aplicação](#2-análise-da-aplicação)
3. [Categorias de Logging](#3-categorias-de-logging)
4. [Plano de Implementação](#4-plano-de-implementação)
5. [Exemplos de Código](#5-exemplos-de-código)
6. [Dashboards Grafana](#6-dashboards-grafana)
7. [Métricas de Sucesso](#7-métricas-de-sucesso)
8. [Riscos e Mitigações](#8-riscos-e-mitigações)

---

## 1. Resumo Executivo

### 1.1 Situação Atual

✅ **Implementado:**
- Sistema de logging básico (Winston + PostgreSQL + Grafana)
- Transport PostgreSQL funcional
- Estrutura de logs definida ([`types/logging.ts`](../backend/src/types/logging.ts:1))
- Middleware de requestId ([`middleware/requestId.ts`](../backend/src/middleware/requestId.ts:1))
- Logs básicos em alguns controllers e services

❌ **Gaps Identificados:**
- **Falta logging HTTP estruturado** → Painéis de performance do Grafana não funcionam
- **Falta logging de negócio** → Não há rastreamento de operações críticas
- **Falta logging de integrações** → Chamadas a APIs externas (OpenAI, AWS Bedrock) sem logs estruturados
- **Falta logging de segurança** → Tentativas de login, mudanças de permissões não são auditadas
- **Inconsistência** → Alguns arquivos usam `console.log`, outros usam `logger`

### 1.2 Impacto dos Gaps

| Gap | Impacto | Severidade |
|-----|---------|------------|
| Sem logging HTTP | Painéis Grafana não funcionam, impossível medir performance | 🔴 **CRÍTICO** |
| Sem logging de integrações | Falhas de API externa não são rastreadas, dificulta debug | 🔴 **CRÍTICO** |
| Sem logging de segurança | Violações de segurança não são detectadas, compliance em risco | 🟠 **ALTO** |
| Sem logging de negócio | Operações críticas não são auditadas, dificulta troubleshooting | 🟠 **ALTO** |
| Inconsistência (console.log) | Logs não estruturados, impossível consultar no Grafana | 🟡 **MÉDIO** |

### 1.3 Benefícios da Implementação

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

## 2. Análise da Aplicação

### 2.1 Estatísticas Gerais

**Arquivos Analisados:** 75 arquivos em [`backend/src/`](../backend/src/:1)

**Distribuição:**
- Controllers: 12 arquivos
- Services: 15 arquivos (incluindo AI)
- Middlewares: 5 arquivos
- Routes: 12 arquivos
- Adapters/Providers: 10 arquivos
- Utils/Config: 21 arquivos

**Cobertura de Logging Atual:**
- ✅ Com logging estruturado: ~30% (23/75 arquivos)
- ⚠️ Com `console.log`: ~15% (11/75 arquivos)
- ❌ Sem logging: ~55% (41/75 arquivos)

---

### 2.2 HTTP Layer

#### Arquivos Analisados

| Arquivo | Função | Logging Atual | Gaps Identificados |
|---------|--------|---------------|-------------------|
| [`server.ts`](../backend/src/server.ts:1) | Servidor Express | ⚠️ Parcial | Falta logging HTTP estruturado |
| [`middleware/errorHandler.ts`](../backend/src/middleware/errorHandler.ts:1) | Tratamento de erros | ⚠️ Parcial | Falta contexto (requestId, userId) |
| [`middleware/authMiddleware.ts`](../backend/src/middleware/authMiddleware.ts:1) | Autenticação | ✅ Básico | Falta logging de tentativas falhadas |
| [`middleware/rateLimiter.ts`](../backend/src/middleware/rateLimiter.ts:1) | Rate limiting | ✅ Básico | Falta métricas estruturadas |
| [`middleware/requestId.ts`](../backend/src/middleware/requestId.ts:1) | Request ID | ✅ OK | Nenhum |

#### Gaps Identificados

**🔴 CRÍTICO: Falta Middleware HTTP Logger**

O [`server.ts`](../backend/src/server.ts:87-94) tem logging básico:

```typescript
// Logging atual (INSUFICIENTE)
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  logger.info(`📡 [Request] ${req.method} ${req.path}`);
  if (req.query && Object.keys(req.query).length > 0) {
    logger.info(`📡 [Query]:`, req.query);
  }
  next();
});
```

**Problemas:**
- ❌ Não loga duração da requisição
- ❌ Não loga status code da resposta
- ❌ Não loga tamanho do payload
- ❌ Não loga IP do cliente
- ❌ Não loga user-agent
- ❌ Não correlaciona com userId

**Impacto:**
- Painéis Grafana de performance HTTP não funcionam
- Impossível medir latência de endpoints
- Impossível identificar endpoints lentos

#### Proposta de Implementação

**Criar middleware HTTP logger estruturado:**

```typescript
// backend/src/middleware/httpLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Captura o fim da requisição
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const contentLength = res.get('Content-Length') || 0;
    
    logger.info('HTTP Request', {
      requestId: req.id,
      userId: (req as any).userId, // Se autenticado
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: parseInt(contentLength.toString()),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.socket.remoteAddress,
      metadata: {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: req.get('content-length') || 0
      }
    });
  });
  
  next();
}
```

**Integração no [`server.ts`](../backend/src/server.ts:1):**

```typescript
import { httpLogger } from './middleware/httpLogger';

// Após requestIdMiddleware
app.use(requestIdMiddleware);
app.use(httpLogger); // ← NOVO
```

---

### 2.3 Controllers

#### Análise Detalhada

##### 2.3.1 [`aiController.ts`](../backend/src/controllers/aiController.ts:1)

**Função:** Lista providers e testa conectividade

**Logging Atual:**
- ✅ Tem logs básicos (`logger.info`)
- ❌ Falta contexto (requestId, userId)
- ❌ Falta logging de erros estruturado

**Gaps Identificados:**

1. **`listProviders`** (linha 15-43):
   - ✅ Loga quantidade de providers encontrados
   - ❌ Não loga requestId
   - ❌ Não loga userId
   - ❌ Não loga duração da query

2. **`testProvider`** (linha 49-88):
   - ✅ Loga provider testado
   - ❌ Não loga resultado do teste
   - ❌ Não loga latência
   - ❌ Não loga erros estruturados

**Proposta:**

```typescript
async listProviders(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    logger.info('Listing AI providers', {
      requestId: req.id,
      userId: (req as any).userId
    });
    
    const providers = await prisma.aIProvider.findMany({
      where: { isActive: true },
      include: {
        models: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            apiModelId: true,
            contextWindow: true,
          },
          orderBy: { contextWindow: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    logger.info('AI providers listed successfully', {
      requestId: req.id,
      userId: (req as any).userId,
      duration: Date.now() - startTime,
      metadata: {
        providersCount: providers.length,
        totalModels: providers.reduce((acc, p) => acc + p.models.length, 0)
      }
    });
    
    res.status(200).json(jsend.success({ providers }));
  } catch (error) {
    logger.error('Failed to list AI providers', {
      requestId: req.id,
      userId: (req as any).userId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined
    });
    next(error);
  }
}
```

**Prioridade:** 🟡 MÉDIA (não é endpoint crítico)

---

##### 2.3.2 [`authController.ts`](../backend/src/controllers/authController.ts:1)

**Função:** Autenticação (register, login, getMe, changePassword, socialLogin)

**Logging Atual:**
- ✅ Tem logs básicos em alguns métodos
- ⚠️ Logs de segurança incompletos
- ❌ Falta logging de tentativas falhadas

**Gaps Identificados:**

1. **`register`** (linha 10-26):
   - ✅ Loga registro bem-sucedido
   - ❌ Não loga tentativas falhadas (email duplicado)
   - ❌ Não loga requestId
   - ❌ Não loga IP do cliente (importante para segurança)

2. **`login`** (linha 28-48):
   - ✅ Loga login bem-sucedido
   - ❌ **CRÍTICO:** Não loga tentativas falhadas (brute force)
   - ❌ Não loga IP do cliente
   - ❌ Não loga user-agent

3. **`changePassword`** (linha 67-87):
   - ❌ **CRÍTICO:** Não loga mudanças de senha (auditoria)
   - ❌ Não loga tentativas falhadas

4. **`socialLoginCallback`** (linha 89-133):
   - ✅ Tem logging estruturado
   - ✅ Usa requestId
   - ✅ Loga erros com contexto

**Proposta:**

```typescript
async login(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', {
        requestId: req.id,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent')
      });
      throw new AppError('Email e senha são obrigatórios', 400);
    }

    logger.info('Login attempt', {
      requestId: req.id,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        emailProvided: !!email
      }
    });

    const result = await authService.login(email, password);

    logger.info('Login successful', {
      requestId: req.id,
      userId: result.user.id,
      duration: Date.now() - startTime,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Login failed', {
      requestId: req.id,
      duration: Date.now() - startTime,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        emailProvided: !!email
      }
    });
    return next(error);
  }
}

async handleChangePassword(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    if (!req.userId) {
      throw new AppError('Não autorizado', 401);
    }
    
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('Todos os campos são obrigatórios', 400);
    }

    logger.info('Password change attempt', {
      requestId: req.id,
      userId: req.userId,
      ip: req.ip || req.socket.remoteAddress
    });

    await authService.changePassword(req.userId, oldPassword, newPassword);
    
    logger.info('Password changed successfully', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      ip: req.ip || req.socket.remoteAddress
    });
    
    return res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Password change failed', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      ip: req.ip || req.socket.remoteAddress,
      error: error instanceof Error ? error.message : String(error)
    });
    return next(error);
  }
}
```

**Prioridade:** 🔴 **CRÍTICA** (segurança e auditoria)

---

##### 2.3.3 [`chatController.ts`](../backend/src/controllers/chatController.ts:1)

**Função:** Processamento de mensagens de chat com streaming SSE

**Logging Atual:**
- ✅ Tem logging estruturado em vários pontos
- ✅ Usa requestId e userId
- ✅ Loga métricas de inferência (linha 355-368)

**Gaps Identificados:**

1. **Logging de performance:**
   - ✅ Loga tokens e custo
   - ❌ Não loga duração total da requisição
   - ❌ Não loga duração do stream

2. **Logging de contexto:**
   - ✅ Loga estratégia de contexto (RAG, pinned, recent)
   - ❌ Não loga tamanho do contexto final
   - ❌ Não loga número de mensagens no histórico

3. **Logging de erros:**
   - ✅ Loga erros com contexto
   - ✅ Salva erros no banco para auditoria
   - ✅ Usa requestId para correlação

**Proposta:**

```typescript
async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  logger.info('Chat message received', {
    requestId: req.id,
    userId: req.userId,
    metadata: {
      chatId: req.body.chatId || 'new',
      provider: req.body.provider || 'groq',
      model: req.body.model || 'default',
      hasContext: !!req.body.context,
      strategy: req.body.strategy || 'efficient'
    }
  });
  
  try {
    // ... código existente ...
    
    // Ao final do stream bem-sucedido
    logger.info('Chat message processed successfully', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      metadata: {
        chatId: currentChat.id,
        provider: lockedProvider,
        model: targetModel,
        tokensIn: finalMetrics.tokensIn,
        tokensOut: finalMetrics.tokensOut,
        costInUSD: finalMetrics.costInUSD,
        contextSize: historyMessages.length,
        strategy: strategy || 'efficient',
        streamDuration: Date.now() - startTime
      }
    });
    
  } catch (error) {
    logger.error('Chat message processing failed', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined,
      metadata: {
        chatId: req.body.chatId,
        provider: req.body.provider,
        model: req.body.model
      }
    });
    
    if (!res.headersSent) next(error);
  }
}
```

**Prioridade:** 🟡 MÉDIA (já tem logging bom, apenas melhorias)

---

##### 2.3.4 [`certificationController.ts`](../backend/src/controllers/certificationController.ts:1)

**Função:** Certificação de modelos AWS Bedrock

**Logging Atual:**
- ✅ **EXCELENTE:** Logging estruturado completo
- ✅ Usa requestId e userId
- ✅ Loga todas as operações importantes
- ✅ Loga erros com contexto

**Gaps Identificados:**
- ✅ Nenhum gap crítico
- ⚠️ Poderia logar duração das certificações (já está no service)

**Proposta:**
- ✅ Manter como está (referência de boas práticas)
- ⚠️ Adicionar logging de duração no controller (opcional)

**Prioridade:** 🟢 BAIXA (já está bem implementado)

---

##### 2.3.5 [`userController.ts`](../backend/src/controllers/userController.ts:1)

**Função:** Gerenciamento de perfil de usuário

**Logging Atual:**
- ❌ **SEM LOGGING**

**Gaps Identificados:**

1. **`getProfile`** (linha 12-31):
   - ❌ Não loga acesso ao perfil
   - ❌ Não loga erros

2. **`updateProfile`** (linha 33-55):
   - ❌ **CRÍTICO:** Não loga mudanças de perfil (auditoria)
   - ❌ Não loga erros

**Proposta:**

```typescript
async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    if (!req.userId) {
      throw new AppError('Não autorizado', 401);
    }

    logger.info('Fetching user profile', {
      requestId: req.id,
      userId: req.userId
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    logger.info('User profile fetched successfully', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime
    });

    res.json(jsend.success({ user }));
  } catch (error) {
    logger.error('Failed to fetch user profile', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}

async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    if (!req.userId) {
      throw new AppError('Não autorizado', 401);
    }
    
    const { name } = req.body;

    if (!name) {
      throw new AppError('O nome é obrigatório', 400);
    }

    logger.info('Updating user profile', {
      requestId: req.id,
      userId: req.userId,
      metadata: {
        fieldsUpdated: ['name']
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: { id: true, email: true, name: true }
    });

    logger.info('User profile updated successfully', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      metadata: {
        fieldsUpdated: ['name']
      }
    });

    res.json(jsend.success({ user: updatedUser }));

  } catch (error) {
    logger.error('Failed to update user profile', {
      requestId: req.id,
      userId: req.userId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });
    next(error);
  }
}
```

**Prioridade:** 🟠 ALTA (auditoria de mudanças de perfil)

---

#### Resumo de Controllers

| Controller | Prioridade | Gaps Críticos | Estimativa |
|------------|-----------|---------------|------------|
| [`authController.ts`](../backend/src/controllers/authController.ts:1) | 🔴 CRÍTICA | Login/senha sem auditoria | 3h |
| [`userController.ts`](../backend/src/controllers/userController.ts:1) | 🟠 ALTA | Mudanças de perfil sem auditoria | 2h |
| [`aiController.ts`](../backend/src/controllers/aiController.ts:1) | 🟡 MÉDIA | Falta contexto e métricas | 2h |
| [`chatController.ts`](../backend/src/controllers/chatController.ts:1) | 🟡 MÉDIA | Melhorias incrementais | 1h |
| [`certificationController.ts`](../backend/src/controllers/certificationController.ts:1) | 🟢 BAIXA | Nenhum (referência) | 0h |
| **Outros 7 controllers** | 🟡 MÉDIA | Análise pendente | 8h |

**Total Estimado:** 16 horas

---

### 2.4 Services

#### Análise Detalhada

##### 2.4.1 [`services/ai/index.ts`](../backend/src/services/ai/index.ts:1)

**Função:** Serviço principal de IA (streaming, embeddings)

**Logging Atual:**
- ✅ Tem logs básicos
- ❌ Falta contexto (requestId, userId)
- ❌ Falta métricas de performance

**Gaps Identificados:**

1. **`stream`** (linha 24-72):
   - ✅ Loga início do stream
   - ❌ Não loga duração
   - ❌ Não loga tokens consumidos
   - ❌ Não loga custo
   - ❌ Não loga requestId/userId

2. **`embed`** (linha 75-77):
   - ❌ Sem logging

3. **`embedBatch`** (linha 79-81):
   - ❌ Sem logging

**Proposta:**

```typescript
async *stream(
  messages: any[],
  options: AIStreamOptions
): AsyncGenerator<StreamChunk> {
  const startTime = Date.now();
  
  logger.info('AI stream started', {
    requestId: options.requestId, // Adicionar ao AIStreamOptions
    userId: options.userId,
    provider: options.providerSlug,
    model: options.modelId,
    metadata: {
      messageCount: messages.length,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    }
  });

  try {
    const provider = await AIProviderFactory.getProviderInstance(options.providerSlug);

    const providerRecord = await prisma.aIProvider.findUnique({
      where: { slug: options.providerSlug }
    });

    if (!providerRecord) {
      logger.error('Provider not found', {
        requestId: options.requestId,
        userId: options.userId,
        provider: options.providerSlug
      });
      yield { type: 'error', error: `Provider ${options.providerSlug} não encontrado.` };
      return;
    }

    let apiKey = "";
    try {
      apiKey = await AIProviderFactory.getApiKey(options.userId, providerRecord.id);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao obter API key';
      logger.error('Failed to get API key', {
        requestId: options.requestId,
        userId: options.userId,
        provider: options.providerSlug,
        error: errorMessage
      });
      yield { type: 'error', error: errorMessage };
      return;
    }

    const streamGenerator = provider.streamChat(messages, {
      modelId: options.modelId,
      apiKey: apiKey,
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.7,
      topK: options.topK
    });

    let totalChunks = 0;
    for await (const chunk of streamGenerator) {
      if (chunk.type === 'chunk') totalChunks++;
      yield chunk;
    }

    logger.info('AI stream completed', {
      requestId: options.requestId,
      userId: options.userId,
      provider: options.providerSlug,
      model: options.modelId,
      duration: Date.now() - startTime,
      metadata: {
        chunksGenerated: totalChunks
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no serviço de IA';
    logger.error('AI stream failed', {
      requestId: options.requestId,
      userId: options.userId,
      provider: options.providerSlug,
      model: options.modelId,
      duration: Date.now() - startTime,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined
    });
    yield {
      type: 'error',
      error: errorMessage,
    };
  }
}

async embed(text: string, requestId?: string): Promise<EmbeddingResponse | null> {
  const startTime = Date.now();
  
  logger.info('Embedding generation started', {
    requestId,
    metadata: {
      textLength: text.length
    }
  });
  
  try {
    const result = await getEmbedding(text);
    
    logger.info('Embedding generated successfully', {
      requestId,
      duration: Date.now() - startTime,
      metadata: {
        vectorDimension: result?.vector.length || 0
      }
    });
    
    return result;
  } catch (error) {
    logger.error('Embedding generation failed', {
      requestId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
```

**Prioridade:** 🔴 **CRÍTICA** (integrações externas)

---

##### 2.4.2 [`services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts:1)

**Função:** Provider AWS Bedrock (streaming, validação)

**Logging Atual:**
- ✅ Tem logging estruturado
- ✅ Loga tentativas de retry
- ✅ Loga erros de rate limiting

**Gaps Identificados:**

1. **Logging de performance:**
   - ✅ Loga tentativas e variações de modelId
   - ❌ Não loga duração total
   - ❌ Não loga latência por chunk

2. **Logging de métricas:**
   - ❌ Não loga número de chunks gerados
   - ❌ Não loga tamanho total da resposta

**Proposta:**

```typescript
async *streamChat(
  messages: any[],
  options: AIRequestOptions
): AsyncGenerator<StreamChunk> {
  const startTime = Date.now();
  const [accessKeyId, secretAccessKey] = options.apiKey.split(':');

  if (!accessKeyId || !secretAccessKey) {
    logger.error('Invalid AWS credentials format', {
      metadata: {
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey
      }
    });
    yield {
      type: 'error',
      error: 'AWS credentials must be in format: ACCESS_KEY:SECRET_KEY',
    };
    return;
  }

  logger.info('Bedrock stream started', {
    model: options.modelId,
    region: this.region,
    metadata: {
      messageCount: messages.length,
      temperature: options.temperature,
      maxTokens: options.maxTokens
    }
  });

  const client = new BedrockRuntimeClient({
    region: this.region,
    credentials: { accessKeyId, secretAccessKey },
  });

  // ... código existente ...

  let totalChunks = 0;
  let totalBytes = 0;
  
  for await (const event of response.body) {
    if (event.chunk) {
      totalChunks++;
      totalBytes += event.chunk.bytes?.length || 0;
      
      const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
      const parsed = adapter.parseChunk(chunk);

      if (parsed.type === 'chunk' && parsed.content) {
        yield { type: 'chunk', content: parsed.content };
      } else if (parsed.type === 'done') {
        break;
      } else if (parsed.type === 'error') {
        yield { type: 'error', error: parsed.error || 'Unknown error from adapter' };
        break;
      }
    }
  }
  
  logger.info('Bedrock stream completed', {
    model: options.modelId,
    region: this.region,
    duration: Date.now() - startTime,
    metadata: {
      chunksGenerated: totalChunks,
      totalBytes
    }
  });
}
```

**Prioridade:** 🔴 **CRÍTICA** (integrações AWS)

---

##### 2.4.3 [`services/authService.ts`](../backend/src/services/authService.ts:1)

**Função:** Lógica de autenticação (register, login, changePassword)

**Logging Atual:**
- ❌ **SEM LOGGING**

**Gaps Identificados:**

1. **`register`** (linha 10-35):
   - ❌ Não loga tentativas de registro
   - ❌ Não loga erros (email duplicado)

2. **`login`** (linha 37-74):
   - ❌ **CRÍTICO:** Não loga tentativas de login
   - ❌ Não loga falhas de autenticação

3. **`changePassword`** (linha 91-118):
   - ❌ **CRÍTICO:** Não loga mudanças de senha

**Proposta:**

```typescript
async register(email: string, password: string, name?: string) {
  logger.info('User registration attempt', {
    metadata: {
      hasName: !!name
    }
  });
  
  // Verificar se usuário já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    logger.warn('Registration failed: email already exists', {
      metadata: {
        emailDomain: email.split('@')[1]
      }
    });
    throw new AppError('Email already registered', 400);
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  logger.info('User registered successfully', {
    userId: user.id,
    metadata: {
      hasName: !!name,
      emailDomain: email.split('@')[1]
    }
  });

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

async login(email: string, password: string) {
  logger.info('Login attempt', {
    metadata: {
      emailDomain: email.split('@')[1]
    }
  });
  
  // Buscar usuário
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { providerCredentials: true }
  });

  if (!user) {
    logger.warn('Login failed: user not found', {
      metadata: {
        emailDomain: email.split('@')[1]
      }
    });
    throw new AppError('Credenciais inválidas', 401);
  }

  // Se o usuário não tem senha mas tem credencial de provedor (GitHub)
  if (!user.password && user.providerCredentials.length > 0) {
    logger.warn('Login failed: social account attempted with password', {
      userId: user.id,
      metadata: {
        providers: user.providerCredentials.map(c => c.provider)
      }
    });
    throw new AppError(
      'Esta conta foi criada via GitHub. Por favor, use o botão de Login Social.', 
      401
    );
  }

  // Verificar senha
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn('Login failed: invalid password', {
      userId: user.id
    });
    throw new AppError('Invalid credentials', 401);
  }

  // Gerar token
  const token = generateToken({ userId: user.id, email: user.email });

  logger.info('Login successful', {
    userId: user.id
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

async changePassword(userId: string, oldPassword: string, newPassword: string) {
  logger.info('Password change attempt', {
    userId
  });
  
  // 1. Buscar o usuário completo (incluindo a senha)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    logger.error('Password change failed: user not found', {
      userId
    });
    throw new AppError('Usuário não encontrado', 404);
  }

  // 2. Verificar se a senha antiga está correta
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    logger.warn('Password change failed: invalid old password', {
      userId
    });
    throw new AppError('Senha antiga incorreta', 401);
  }

  // 3. Criptografar a nova senha
  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  // 4. Salvar a nova senha no banco
  await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });

  logger.info('Password changed successfully', {
    userId
  });

  return { message: 'Senha atualizada com sucesso' };
}
```

**Prioridade:** 🔴 **CRÍTICA** (segurança e auditoria)

---

##### 2.4.4 [`services/chat/contextService.ts`](../backend/src/services/chat/contextService.ts:1)

**Função:** Gerenciamento de contexto de chat (RAG, pinned, recent)

**Logging Atual:**
- ❌ **SEM LOGGING** (usa apenas SSE para debug)

**Gaps Identificados:**

1. **`getHybridRagHistory`** (linha 83-208):
   - ❌ Não loga operações de busca
   - ❌ Não loga performance (duração)
   - ❌ Não loga métricas de contexto

**Proposta:**

```typescript
async getHybridRagHistory(
  chatId: string, 
  userMessage: string, 
  writeSSE: (data: StreamChunk) => void,
  userConfig?: ContextPipelineConfig
): Promise<HybridHistoryReport> {
  const startTime = Date.now();
  
  // Merge com configuração padrão
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  
  logger.info('Hybrid RAG history started', {
    metadata: {
      chatId,
      config: {
        pinnedEnabled: config.pinnedEnabled,
        recentEnabled: config.recentEnabled,
        recentCount: config.recentCount,
        ragEnabled: config.ragEnabled,
        ragTopK: config.ragTopK,
        maxContextTokens: config.maxContextTokens
      }
    }
  });
  
  writeSSE({ type: 'debug', log: `⚙️ Config: pinned=${config.pinnedEnabled}, recent=${config.recentCount}, rag=${config.ragEnabled} (top ${config.ragTopK}), budget=${config.maxContextTokens}` });

  let pinnedMessages: Message[] = [];
  let relevantMessages: Message[] = [];
  let recentMessages: Message[] = [];

  // 1. PRIORIDADE MÁXIMA: Mensagens Pinadas (se habilitado)
  if (config.pinnedEnabled) {
    writeSSE({ type: 'debug', log: `📌 Pinned: Buscando mensagens fixadas...` });
    const pinnedStart = Date.now();
    pinnedMessages = await this.getPinnedMessages(chatId);
    logger.debug('Pinned messages fetched', {
      metadata: {
        chatId,
        count: pinnedMessages.length,
        duration: Date.now() - pinnedStart
      }
    });
    writeSSE({ type: 'debug', log: `📌 Pinned: ${pinnedMessages.length} mensagens fixadas encontradas` });
  }

  // 2. RAG: Busca semântica (se habilitado)
  if (config.ragEnabled) {
    writeSSE({ type: 'debug', log: `🧠 RAG: Buscando relevância semântica (top ${config.ragTopK})...` });
    const ragStart = Date.now();
    relevantMessages = await ragService.findSimilarMessages(userMessage, chatId, config.ragTopK);
    logger.debug('RAG search completed', {
      metadata: {
        chatId,
        count: relevantMessages.length,
        topK: config.ragTopK,
        duration: Date.now() - ragStart
      }
    });
    
    // Log detalhado para debug
    if (relevantMessages.length === 0) {
      logger.warn('RAG search returned no results', {
        metadata: {
          chatId,
          queryLength: userMessage.length
        }
      });
      writeSSE({ type: 'debug', log: `🧠 RAG: ⚠️ Nenhuma mensagem encontrada (verifique se há embeddings no banco)` });
    } else {
      const ragMsgIds = relevantMessages.map(m => m.id.substring(0, 8)).join(', ');
      writeSSE({ type: 'debug', log: `🧠 RAG: ${relevantMessages.length} mensagens encontradas [${ragMsgIds}...]` });
    }
  }

  // 3. Fast: Memória recente (se habilitado)
  if (config.recentEnabled) {
    writeSSE({ type: 'debug', log: `🕐 Recent: Buscando últimas ${config.recentCount} mensagens...` });
    const recentStart = Date.now();
    recentMessages = await this.getFastHistory(chatId, config.recentCount);
    logger.debug('Recent messages fetched', {
      metadata: {
        chatId,
        count: recentMessages.length,
        limit: config.recentCount,
        duration: Date.now() - recentStart
      }
    });
    writeSSE({ type: 'debug', log: `🕐 Recent: ${recentMessages.length} mensagens recentes carregadas` });
  }

  // ... resto do código ...

  logger.info('Hybrid RAG history completed', {
    duration: Date.now() - startTime,
    metadata: {
      chatId,
      finalContextSize: finalContextHistory.length,
      pinnedCount: pinnedMessages.length,
      ragCount: relevantMessages.length,
      recentCount: recentMessages.length,
      tokensUsed: config.maxContextTokens - budget
    }
  });

  return {
    finalContext: cleanMessages(finalContextHistory),
    relevantMessages: cleanMessages(relevantMessages),
    recentMessages: cleanMessages(recentMessages),
    pinnedMessages: cleanMessages(pinnedMessages),
    messageOrigins
  };
}
```

**Prioridade:** 🟡 MÉDIA (importante para debugging)

---

#### Resumo de Services

| Service | Prioridade | Gaps Críticos | Estimativa |
|---------|-----------|---------------|------------|
| [`services/ai/index.ts`](../backend/src/services/ai/index.ts:1) | 🔴 CRÍTICA | Integrações sem logging | 4h |
| [`services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts:1) | 🔴 CRÍTICA | Métricas AWS incompletas | 3h |
| [`services/authService.ts`](../backend/src/services/authService.ts:1) | 🔴 CRÍTICA | Segurança sem auditoria | 3h |
| [`services/chat/contextService.ts`](../backend/src/services/chat/contextService.ts:1) | 🟡 MÉDIA | Performance sem métricas | 2h |
| **Outros 11 services** | 🟡 MÉDIA | Análise pendente | 12h |

**Total Estimado:** 24 horas

---

### 2.5 Middlewares

#### Análise Detalhada

| Middleware | Logging Atual | Gaps | Prioridade |
|------------|---------------|------|------------|
| [`errorHandler.ts`](../backend/src/middleware/errorHandler.ts:1) | ⚠️ Parcial | Falta requestId, userId | 🟠 ALTA |
| [`authMiddleware.ts`](../backend/src/middleware/authMiddleware.ts:1) | ✅ Básico | Falta tentativas falhadas | 🟠 ALTA |
| [`rateLimiter.ts`](../backend/src/middleware/rateLimiter.ts:1) | ✅ Básico | Falta métricas estruturadas | 🟡 MÉDIA |
| [`requestId.ts`](../backend/src/middleware/requestId.ts:1) | ✅ OK | Nenhum | 🟢 BAIXA |
| [`validateRequest.ts`](../backend/src/middleware/validateRequest.ts:1) | ❌ Sem logging | Falta logging de validação | 🟡 MÉDIA |

**Total Estimado:** 6 horas

---

### 2.6 Integrações Externas

#### APIs Externas Identificadas

1. **AWS Bedrock** ([`services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts:1))
   - ✅ Tem logging básico
   - ❌ Falta métricas de latência
   - ❌ Falta logging de rate limiting

2. **Azure OpenAI** ([`services/ai/client/azureEmbeddingClient.ts`](../backend/src/services/ai/client/azureEmbeddingClient.ts:1))
   - ❌ **SEM LOGGING**
   - ❌ Falta logging de embeddings
   - ❌ Falta logging de erros

3. **Prisma (Database)**
   - ❌ Falta logging de queries lentas (> 100ms)
   - ❌ Falta logging de erros de conexão

**Prioridade:** 🔴 **CRÍTICA**

**Total Estimado:** 8 horas

---

## 3. Categorias de Logging

### 3.1 HTTP Logging

**Objetivo:** Rastrear todas as requisições HTTP para medir performance e identificar problemas.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;        // ISO 8601
  level: 'info';
  message: 'HTTP Request';
  requestId: string;        // UUID
  userId?: string;          // Se autenticado
  method: string;           // GET, POST, etc
  url: string;              // /api/chat
  statusCode: number;       // 200, 404, 500
  duration: number;         // ms
  contentLength: number;    // bytes
  userAgent: string;
  ip: string;
  metadata?: {
    query?: object;
    bodySize?: number;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/middleware/httpLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Captura o fim da requisição
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const contentLength = res.get('Content-Length') || 0;
    
    logger.info('HTTP Request', {
      requestId: req.id,
      userId: (req as any).userId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: parseInt(contentLength.toString()),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.socket.remoteAddress,
      metadata: {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: req.get('content-length') || 0
      }
    });
  });
  
  next();
}
```

**Queries LogQL (Grafana):**

```logql
# Latência média por endpoint
avg by (url) (
  rate({level="info", message="HTTP Request"} | json | unwrap duration [5m])
)

# Endpoints mais lentos (> 1s)
{level="info", message="HTTP Request"} | json | duration > 1000

# Taxa de erros (5xx)
sum by (url) (
  rate({level="info", message="HTTP Request"} | json | statusCode >= 500 [5m])
)

# Requisições por usuário
count by (userId) (
  {level="info", message="HTTP Request"} | json
)
```

---

### 3.2 Business Logic Logging

**Objetivo:** Auditar operações de negócio críticas.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;          // 'User registered', 'Password changed'
  requestId: string;
  userId: string;
  action: string;           // 'register', 'login', 'update_profile'
  resource: string;         // 'user', 'chat', 'message'
  duration: number;
  metadata?: {
    fieldsUpdated?: string[];
    previousValue?: any;
    newValue?: any;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/services/authService.ts
async changePassword(userId: string, oldPassword: string, newPassword: string) {
  const startTime = Date.now();
  
  logger.info('Password change attempt', {
    userId,
    action: 'change_password',
    resource: 'user'
  });
  
  // ... lógica ...
  
  logger.info('Password changed successfully', {
    userId,
    action: 'change_password',
    resource: 'user',
    duration: Date.now() - startTime
  });
}
```

**Queries LogQL (Grafana):**

```logql
# Mudanças de senha nas últimas 24h
{level="info", action="change_password"} | json

# Operações por usuário
count by (userId, action) (
  {level="info"} | json | action != ""
)

# Operações falhadas
{level="error"} | json | action != ""
```

---

### 3.3 Integration Logging

**Objetivo:** Rastrear chamadas a APIs externas e banco de dados.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;          // 'AI stream started', 'Embedding generated'
  requestId: string;
  userId: string;
  provider: string;         // 'bedrock', 'openai', 'azure'
  model?: string;           // 'claude-3-sonnet'
  duration: number;
  metadata?: {
    tokensIn?: number;
    tokensOut?: number;
    cost?: number;
    retryCount?: number;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/services/ai/providers/bedrock.ts
async *streamChat(messages: any[], options: AIRequestOptions) {
  const startTime = Date.now();
  
  logger.info('Bedrock stream started', {
    requestId: options.requestId,
    userId: options.userId,
    provider: 'bedrock',
    model: options.modelId,
    metadata: {
      messageCount: messages.length,
      temperature: options.temperature
    }
  });
  
  try {
    // ... streaming ...
    
    logger.info('Bedrock stream completed', {
      requestId: options.requestId,
      userId: options.userId,
      provider: 'bedrock',
      model: options.modelId,
      duration: Date.now() - startTime,
      metadata: {
        chunksGenerated: totalChunks,
        totalBytes
      }
    });
  } catch (error) {
    logger.error('Bedrock stream failed', {
      requestId: options.requestId,
      userId: options.userId,
      provider: 'bedrock',
      model: options.modelId,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
```

**Queries LogQL (Grafana):**

```logql
# Latência média por provider
avg by (provider) (
  rate({provider!=""} | json | unwrap duration [5m])
)

# Taxa de erro por provider
sum by (provider) (
  rate({level="error", provider!=""} | json [5m])
)

# Custo total por usuário
sum by (userId) (
  {provider!=""} | json | unwrap metadata_cost
)
```

---

### 3.4 Error Logging

**Objetivo:** Capturar erros com contexto completo para debugging.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'error';
  message: string;
  requestId: string;
  userId?: string;
  error: string;            // error.message
  stack?: string;           // Apenas em desenvolvimento
  duration?: number;
  metadata?: {
    operation?: string;
    input?: any;            // Sanitizado
    statusCode?: number;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/controllers/authController.ts
async login(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  try {
    // ... lógica ...
  } catch (error) {
    logger.error('Login failed', {
      requestId: req.id,
      duration: Date.now() - startTime,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined,
      metadata: {
        emailProvided: !!req.body.email
      }
    });
    return next(error);
  }
}
```

**Queries LogQL (Grafana):**

```logql
# Erros nas últimas 24h
{level="error"} | json

# Erros por endpoint
count by (url) (
  {level="error"} | json | url != ""
)

# Erros por usuário
count by (userId) (
  {level="error"} | json | userId != ""
)

# Stack traces (desenvolvimento)
{level="error"} | json | stack != ""
```

---

### 3.5 Performance Logging

**Objetivo:** Identificar gargalos e otimizar performance.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn';
  message: string;
  requestId: string;
  userId?: string;
  operation: string;        // 'database_query', 'ai_inference'
  duration: number;
  metadata?: {
    queryType?: string;
    recordCount?: number;
    cacheHit?: boolean;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/services/chat/contextService.ts
async getHybridRagHistory(chatId: string, userMessage: string) {
  const startTime = Date.now();
  
  // ... lógica ...
  
  const duration = Date.now() - startTime;
  
  if (duration > 1000) {
    logger.warn('Slow context retrieval', {
      operation: 'hybrid_rag_history',
      duration,
      metadata: {
        chatId,
        finalContextSize: finalContextHistory.length,
        pinnedCount: pinnedMessages.length,
        ragCount: relevantMessages.length
      }
    });
  } else {
    logger.info('Context retrieved successfully', {
      operation: 'hybrid_rag_history',
      duration,
      metadata: {
        chatId,
        finalContextSize: finalContextHistory.length
      }
    });
  }
}
```

**Queries LogQL (Grafana):**

```logql
# Operações lentas (> 1s)
{level="warn", operation!=""} | json | duration > 1000

# Latência média por operação
avg by (operation) (
  rate({operation!=""} | json | unwrap duration [5m])
)

# P95 latência
quantile_over_time(0.95, {operation!=""} | json | unwrap duration [5m])
```

---

### 3.6 Security Logging

**Objetivo:** Auditar ações sensíveis e detectar ameaças.

**Campos Obrigatórios:**
```typescript
{
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  userId?: string;
  action: string;           // 'login_attempt', 'password_change'
  result: 'success' | 'failure';
  ip: string;
  userAgent: string;
  metadata?: {
    reason?: string;
    attemptCount?: number;
  }
}
```

**Exemplo de Implementação:**

```typescript
// backend/src/services/authService.ts
async login(email: string, password: string, ip: string, userAgent: string) {
  logger.info('Login attempt', {
    action: 'login_attempt',
    ip,
    userAgent,
    metadata: {
      emailDomain: email.split('@')[1]
    }
  });
  
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    logger.warn('Login failed: user not found', {
      action: 'login_attempt',
      result: 'failure',
      ip,
      userAgent,
      metadata: {
        reason: 'user_not_found',
        emailDomain: email.split('@')[1]
      }
    });
    throw new AppError('Credenciais inválidas', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    logger.warn('Login failed: invalid password', {
      userId: user.id,
      action: 'login_attempt',
      result: 'failure',
      ip,
      userAgent,
      metadata: {
        reason: 'invalid_password'
      }
    });
    throw new AppError('Invalid credentials', 401);
  }

  logger.info('Login successful', {
    userId: user.id,
    action: 'login_attempt',
    result: 'success',
    ip,
    userAgent
  });

  // ... gerar token ...
}
```

**Queries LogQL (Grafana):**

```logql
# Tentativas de login falhadas
{level="warn", action="login_attempt", result="failure"} | json

# Tentativas de login por IP
count by (ip) (
  {action="login_attempt"} | json
)

# Mudanças de senha nas últimas 24h
{action="password_change"} | json

# Tentativas de acesso não autorizado
{level="error", statusCode="401"} | json
```

---

## 4. Plano de Implementação

### Fase 1: HTTP Logging (Prioridade CRÍTICA)

**Duração:** 1-2 dias  
**Objetivo:** Fazer painéis Grafana funcionarem

**Tarefas:**
- [ ] Criar middleware HTTP logger ([`middleware/httpLogger.ts`](../backend/src/middleware/httpLogger.ts:1))
- [ ] Integrar no [`server.ts`](../backend/src/server.ts:1)
- [ ] Testar com Grafana (dashboard de performance)
- [ ] Validar queries LogQL
- [ ] Documentar uso

**Arquivos Afetados:**
- `backend/src/middleware/httpLogger.ts` (NOVO)
- `backend/src/server.ts` (MODIFICAR)

**Critérios de Sucesso:**
- ✅ Todas as requisições HTTP são logadas
- ✅ Dashboard Grafana mostra latência por endpoint
- ✅ Dashboard Grafana mostra taxa de erros
- ✅ Logs incluem requestId, userId, duration, statusCode

---

### Fase 2: Controllers Logging (Prioridade ALTA)

**Duração:** 3-5 dias  
**Objetivo:** Auditar operações de negócio

**Tarefas:**
- [ ] Implementar logging em [`authController.ts`](../backend/src/controllers/authController.ts:1) (CRÍTICO)
- [ ] Implementar logging em [`userController.ts`](../backend/src/controllers/userController.ts:1) (ALTO)
- [ ] Implementar logging em [`aiController.ts`](../backend/src/controllers/aiController.ts:1) (MÉDIO)
- [ ] Melhorar logging em [`chatController.ts`](../backend/src/controllers/chatController.ts:1) (MÉDIO)
- [ ] Padronizar formato de logs
- [ ] Adicionar testes

**Arquivos Afetados:**
- `backend/src/controllers/authController.ts` (MODIFICAR)
- `backend/src/controllers/userController.ts` (MODIFICAR)
- `backend/src/controllers/aiController.ts` (MODIFICAR)
- `backend/src/controllers/chatController.ts` (MODIFICAR)

**Critérios de Sucesso:**
- ✅ Login/logout auditados com IP e user-agent
- ✅ Mudanças de senha auditadas
- ✅ Mudanças de perfil auditadas
- ✅ Todos os controllers usam logging estruturado

---

### Fase 3: Services Logging (Prioridade ALTA)

**Duração:** 5-7 dias  
**Objetivo:** Rastrear integrações externas

**Tarefas:**
- [ ] Implementar logging em [`services/ai/index.ts`](../backend/src/services/ai/index.ts:1) (CRÍTICO)
- [ ] Implementar logging em [`services/ai/providers/bedrock.ts`](../backend/src/services/ai/providers/bedrock.ts:1) (CRÍTICO)
- [ ] Implementar logging em [`services/authService.ts`](../backend/src/services/authService.ts:1) (CRÍTICO)
- [ ] Implementar logging em [`services/chat/contextService.ts`](../backend/src/services/chat/contextService.ts:1) (MÉDIO)
- [ ] Implementar logging de embeddings (Azure OpenAI)
- [ ] Performance monitoring

**Arquivos Afetados:**
- `backend/src/services/ai/index.ts` (MODIFICAR)
- `backend/src/services/ai/providers/bedrock.ts` (MODIFICAR)
- `backend/src/services/authService.ts` (MODIFICAR)
- `backend/src/services/chat/contextService.ts` (MODIFICAR)
- `backend/src/services/ai/client/azureEmbeddingClient.ts` (MODIFICAR)

**Critérios de Sucesso:**
- ✅ Todas as chamadas a APIs externas são logadas
- ✅ Latência de integrações é medida
- ✅ Erros de API externa são capturados com contexto
- ✅ Custo de inferências é rastreado

---

### Fase 4: Security & Audit Logging (Prioridade ALTA)

**Duração:** 2-3 dias  
**Objetivo:** Compliance e detecção de ameaças

**Tarefas:**
- [ ] Logging de autenticação (tentativas falhadas)
- [ ] Logging de autorização (acesso negado)
- [ ] Audit trail completo (quem fez o quê, quando)
- [ ] Dashboard Grafana de segurança
- [ ] Alertas para atividades suspeitas

**Arquivos Afetados:**
- `backend/src/middleware/authMiddleware.ts` (MODIFICAR)
- `backend/src/middleware/errorHandler.ts` (MODIFICAR)
- `backend/src/services/authService.ts` (MODIFICAR)

**Critérios de Sucesso:**
- ✅ Tentativas de login falhadas são logadas com IP
- ✅ Mudanças de senha são auditadas
- ✅ Acesso a recursos sensíveis é rastreado
- ✅ Dashboard Grafana mostra atividades suspeitas

---

### Fase 5: Middleware & Error Logging (Prioridade MÉDIA)

**Duração:** 2-3 dias  
**Objetivo:** Melhorar tratamento de erros

**Tarefas:**
- [ ] Melhorar logging em [`middleware/errorHandler.ts`](../backend/src/middleware/errorHandler.ts:1)
- [ ] Adicionar logging em [`middleware/validateRequest.ts`](../backend/src/middleware/validateRequest.ts:1)
- [ ] Melhorar logging em [`middleware/rateLimiter.ts`](../backend/src/middleware/rateLimiter.ts:1)
- [ ] Padronizar formato de erros

**Arquivos Afetados:**
- `backend/src/middleware/errorHandler.ts` (MODIFICAR)
- `backend/src/middleware/validateRequest.ts` (MODIFICAR)
- `backend/src/middleware/rateLimiter.ts` (MODIFICAR)

**Critérios de Sucesso:**
- ✅ Todos os erros incluem requestId e userId
- ✅ Stack traces apenas em desenvolvimento
- ✅ Erros de validação são logados
- ✅ Rate limiting é monitorado

---

### Resumo do Plano

| Fase | Duração | Prioridade | Arquivos | Estimativa |
|------|---------|------------|----------|------------|
| 1. HTTP Logging | 1-2 dias | 🔴 CRÍTICA | 2 | 16h |
| 2. Controllers | 3-5 dias | 🟠 ALTA | 12 | 32h |
| 3. Services | 5-7 dias | 🟠 ALTA | 15 | 48h |
| 4. Security & Audit | 2-3 dias | 🟠 ALTA | 3 | 20h |
| 5. Middleware & Errors | 2-3 dias | 🟡 MÉDIA | 3 | 16h |
| **TOTAL** | **13-20 dias** | - | **35** | **132h** |

---

## 5. Exemplos de Código

### 5.1 HTTP Logger Middleware (COMPLETO)

```typescript
// backend/src/middleware/httpLogger.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware de logging HTTP estruturado
 * 
 * Loga todas as requisições HTTP com métricas de performance:
 * - Duração da requisição
 * - Status code da resposta
 * - Tamanho do payload
 * - IP do cliente
 * - User-agent
 * 
 * Referência: docs/STANDARDS.md#13-sistema-de-logging-estruturado
 */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Captura o fim da requisição
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const contentLength = res.get('Content-Length') || '0';
    
    // Determina o nível de log baseado no status code
    const level = res.statusCode >= 500 ? 'error' 
                : res.statusCode >= 400 ? 'warn' 
                : 'info';
    
    logger[level]('HTTP Request', {
      requestId: req.id,
      userId: (req as any).userId, // Se autenticado
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: parseInt(contentLength),
      userAgent: req.get('user-agent') || 'unknown',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: {
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        bodySize: parseInt(req.get('content-length') || '0')
      }
    });
  });
  
  next();
}
```

**Integração no [`server.ts`](../backend/src/server.ts:1):**

```typescript
// backend/src/server.ts
import { httpLogger } from './middleware/httpLogger';

// Após requestIdMiddleware
app.use(requestIdMiddleware);
app.use(httpLogger); // ← ADICIONAR AQUI

// REMOVER logging manual antigo (linhas 87-94)
// app.use((req, _res, next) => {
//   logger.info(`${req.method} ${req.path}`);
//   ...
// });
```

---

### 5.2 Controller Logging Pattern (COMPLETO)

```typescript
// backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { email, password } = req.body;
    
    try {
      // Log de tentativa (sem dados sensíveis)
      logger.info('Login attempt', {
        requestId: req.id,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        metadata: {
          emailProvided: !!email,
          passwordProvided: !!password
        }
      });

      if (!email || !password) {
        throw new AppError('Email e senha são obrigatórios', 400);
      }

      const result = await authService.login(email, password);

      // Log de sucesso
      logger.info('Login successful', {
        requestId: req.id,
        userId: result.user.id,
        duration: Date.now() - startTime,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent')
      });

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      // Log de erro
      logger.error('Login failed', {
        requestId: req.id,
        duration: Date.now() - startTime,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        error: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
        metadata: {
          emailProvided: !!email
        }
      });
      return next(error);
    }
  }
};
```

---

### 5.3 Service Logging Pattern (COMPLETO)

```typescript
// backend/src/services/ai/index.ts
import { logger } from '../../utils/logger';

export const aiService = {
  async *stream(
    messages: any[],
    options: AIStreamOptions
  ): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    
    // Log de início
    logger.info('AI stream started', {
      requestId: options.requestId,
      userId: options.userId,
      provider: options.providerSlug,
      model: options.modelId,
      metadata: {
        messageCount: messages.length,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      }
    });

    try {
      const provider = await AIProviderFactory.getProviderInstance(options.providerSlug);

      // ... código de streaming ...

      let totalChunks = 0;
      for await (const chunk of streamGenerator) {
        if (chunk.type === 'chunk') totalChunks++;
        yield chunk;
      }

      // Log de sucesso
      logger.info('AI stream completed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: options.providerSlug,
        model: options.modelId,
        duration: Date.now() - startTime,
        metadata: {
          chunksGenerated: totalChunks
        }
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno no serviço de IA';
      
      // Log de erro
      logger.error('AI stream failed', {
        requestId: options.requestId,
        userId: options.userId,
        provider: options.providerSlug,
        model: options.modelId,
        duration: Date.now() - startTime,
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined
      });
      
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }
};
```

---

### 5.4 Error Logging Pattern (COMPLETO)

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/api-response';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response
) => {
  // Log estruturado do erro
  logger.error('Request error', {
    requestId: req.id,
    userId: (req as any).userId,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    metadata: {
      errorName: err.name,
      isOperational: err.isOperational || false
    }
  });

  // 1. Erro de autenticação JWT
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ApiResponse.fail({ message: 'Token inválido ou ausente' }));
  }

  // 2. Erro de sintaxe no JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(ApiResponse.fail({ message: 'JSON malformado' }));
  }

  // 3. Erros de credenciais
  if (err.message === 'Invalid credentials' || err.name === 'AppError' || err instanceof AppError) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json(ApiResponse.fail({ message: err.message }));
  }

  // 4. Determinar se é erro de cliente (4xx) ou servidor (5xx)
  const statusCode = err.statusCode || 500;
  const status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';

  // 5. Resposta para erros de CLIENTE (4xx)
  if (status === 'fail') {
    return res.status(statusCode).json(ApiResponse.fail({ message: err.message }));
  }

  // 6. Resposta para erros de SERVIDOR (5xx)
  return res.status(statusCode).json(
    ApiResponse.error(
      process.env.NODE_ENV === 'production' 
        ? 'Erro interno no servidor' 
        : err.message || 'Erro interno no servidor'
    )
  );
};
```

---

## 6. Dashboards Grafana

### 6.1 Novos Dashboards Necessários

#### Dashboard 1: Performance HTTP

**Objetivo:** Monitorar latência e throughput de endpoints

**Painéis:**

1. **Latência Média por Endpoint (Últimas 24h)**
```logql
avg by (url) (
  rate({level="info", message="HTTP Request"} | json | unwrap duration [5m])
)
```

2. **P95 Latência por Endpoint**
```logql
quantile_over_time(0.95, 
  {level="info", message="HTTP Request"} | json | unwrap duration [5m]
) by (url)
```

3. **Endpoints Mais Lentos (> 1s)**
```logql
topk(10,
  count_over_time({level="info", message="HTTP Request"} | json | duration > 1000 [1h])
) by (url)
```

4. **Taxa de Requisições por Segundo**
```logql
sum(rate({level="info", message="HTTP Request"} | json [1m]))
```

5. **Taxa de Erros (4xx e 5xx)**
```logql
sum by (statusCode) (
  rate({level="info", message="HTTP Request"} | json | statusCode >= 400 [5m])
)
```

6. **Requisições por Usuário (Top 10)**
```logql
topk(10,
  count_over_time({level="info", message="HTTP Request"} | json | userId != "" [1h])
) by (userId)
```

---

#### Dashboard 2: Integrações Externas

**Objetivo:** Monitorar chamadas a APIs externas (AWS Bedrock, OpenAI, etc.)

**Painéis:**

1. **Latência Média por Provider**
```logql
avg by (provider) (
  rate({provider!=""} | json | unwrap duration [5m])
)
```

2. **Taxa de Erro por Provider**
```logql
sum by (provider) (
  rate({level="error", provider!=""} | json [5m])
)
```

3. **Custo Total por Usuário (Últimas 24h)**
```logql
sum by (userId) (
  {provider!=""} | json | unwrap metadata_cost
)
```

4. **Tokens Consumidos por Modelo**
```logql
sum by (model) (
  {provider!=""} | json | unwrap metadata_tokensIn + unwrap metadata_tokensOut
)
```

5. **Inferências por Provider**
```logql
count by (provider) (
  {message=~"AI stream (started|completed)"} | json
)
```

6. **Retry Rate (Bedrock)**
```logql
sum(rate({provider="bedrock", message=~".*retry.*"} | json [5m]))
```

---

#### Dashboard 3: Segurança e Auditoria

**Objetivo:** Detectar atividades suspeitas e auditar ações sensíveis

**Painéis:**

1. **Tentativas de Login Falhadas (Últimas 24h)**
```logql
count_over_time({level="warn", action="login_attempt", result="failure"} | json [24h])
```

2. **Tentativas de Login por IP (Top 10)**
```logql
topk(10,
  count_over_time({action="login_attempt"} | json [1h])
) by (ip)
```

3. **Mudanças de Senha (Últimas 7 dias)**
```logql
count_over_time({action="password_change"} | json [7d])
```

4. **Acessos Não Autorizados (401)**
```logql
count_over_time({level="error", statusCode="401"} | json [1h])
```

5. **Operações por Usuário (Últimas 24h)**
```logql
count by (userId, action) (
  {level="info", action!=""} | json
)
```

6. **IPs Suspeitos (> 10 falhas de login)**
```logql
topk(10,
  count_over_time({level="warn", action="login_attempt", result="failure"} | json [1h])
) by (ip) > 10
```

---

### 6.2 Alertas Recomendados

#### Alerta 1: Endpoint Lento

```yaml
alert: EndpointSlow
expr: |
  avg_over_time({level="info", message="HTTP Request"} | json | unwrap duration [5m]) > 2000
for: 5m
labels:
  severity: warning
annotations:
  summary: "Endpoint {{ $labels.url }} está lento (> 2s)"
  description: "Latência média: {{ $value }}ms"
```

#### Alerta 2: Taxa de Erro Alta

```yaml
alert: HighErrorRate
expr: |
  sum(rate({level="error"} | json [5m])) > 10
for: 5m
labels:
  severity: critical
annotations:
  summary: "Taxa de erro alta (> 10/min)"
  description: "{{ $value }} erros por minuto"
```

#### Alerta 3: Tentativas de Login Suspeitas

```yaml
alert: SuspiciousLoginAttempts
expr: |
  count_over_time({level="warn", action="login_attempt", result="failure"} | json [5m]) by (ip) > 5
for: 5m
labels:
  severity: warning
annotations:
  summary: "IP {{ $labels.ip }} com múltiplas tentativas de login falhadas"
  description: "{{ $value }} tentativas nos últimos 5 minutos"
```

---

## 7. Métricas de Sucesso

### 7.1 Cobertura de Logging

**Objetivo:** 100% dos arquivos críticos com logging estruturado

| Categoria | Meta | Atual | Gap |
|-----------|------|-------|-----|
| Controllers | 100% | 30% | 70% |
| Services | 100% | 25% | 75% |
| Middlewares | 100% | 60% | 40% |
| Integrações | 100% | 20% | 80% |
| **TOTAL** | **100%** | **30%** | **70%** |

**Métrica:**
```
Cobertura = (Arquivos com logging estruturado / Total de arquivos) × 100
```

---

### 7.2 Performance

**Objetivo:** Impacto < 5ms por requisição

**Métricas:**
- Latência adicional do middleware HTTP logger: < 1ms
- Latência adicional de logs em controllers: < 2ms
- Latência adicional de logs em services: < 2ms
- **Total:** < 5ms

**Validação:**
```bash
# Antes da implementação
ab -n 1000 -c 10 http://localhost:3001/api/health

# Depois da implementação
ab -n 1000 -c 10 http://localhost:3001/api/health

# Comparar: Requests per second (deve ser > 95% do valor anterior)
```

---

### 7.3 Observabilidade

**Objetivo:** Reduzir tempo para identificar problemas de 30min para < 5min

**Métricas:**
- Tempo médio para identificar endpoint lento: < 2min
- Tempo médio para identificar causa de erro: < 5min
- Tempo médio para rastrear requisição completa: < 1min

**Validação:**
- ✅ Dado um requestId, consigo ver todos os logs relacionados
- ✅ Dado um erro, consigo ver o contexto completo (requestId, userId, stack)
- ✅ Dado um endpoint lento, consigo identificar o gargalo

---

### 7.4 Segurança

**Objetivo:** 100% das ações sensíveis auditadas

**Métricas:**
- Login/logout: 100% auditado
- Mudanças de senha: 100% auditado
- Mudanças de perfil: 100% auditado
- Acesso a recursos sensíveis: 100% auditado

**Validação:**
- ✅ Toda tentativa de login (sucesso/falha) é logada com IP
- ✅ Toda mudança de senha é logada
- ✅ Todo acesso não autorizado é logado
- ✅ Dashboard Grafana mostra atividades suspeitas

---

## 8. Riscos e Mitigações

### 8.1 Risco: Performance

**Descrição:** Logging excessivo pode impactar performance da aplicação

**Probabilidade:** 🟡 MÉDIA  
**Impacto:** 🟠 ALTO

**Mitigação:**
1. **Logs Assíncronos:** Winston já usa transports assíncronos
2. **Sampling:** Logar apenas 10% das requisições em endpoints de alta frequência
3. **Buffering:** Agrupar logs antes de enviar ao PostgreSQL
4. **Monitoramento:** Medir latência antes/depois da implementação

**Validação:**
```typescript
// Sampling para endpoints de alta frequência
if (req.path === '/api/health' && Math.random() > 0.1) {
  return next(); // Não loga 90% das requisições
}
```

---

### 8.2 Risco: Volume de Logs

**Descrição:** Logs podem crescer rapidamente e consumir espaço em disco

**Probabilidade:** 🔴 ALTA  
**Impacto:** 🟠 ALTO

**Mitigação:**
1. **Retenção:** Manter logs por 30 dias (já implementado)
2. **Compressão:** Comprimir logs antigos (> 7 dias)
3. **Agregação:** Agregar logs de baixa prioridade
4. **Monitoramento:** Alertar quando disco > 80%

**Validação:**
```sql
-- Verificar tamanho da tabela de logs
SELECT pg_size_pretty(pg_total_relation_size('logs'));

-- Limpar logs antigos (já implementado)
DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '30 days';
```

---

### 8.3 Risco: Dados Sensíveis em Logs

**Descrição:** Logs podem conter dados sensíveis (senhas, tokens, PII)

**Probabilidade:** 🟡 MÉDIA  
**Impacto:** 🔴 CRÍTICO

**Mitigação:**
1. **Sanitização:** NUNCA logar senhas, tokens, chaves de API
2. **Apenas IDs:** Logar apenas IDs de usuários (não nomes/emails)
3. **Code Review:** Revisar todos os logs antes de commitar
4. **Testes:** Adicionar testes para detectar dados sensíveis em logs

**Validação:**
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

### 8.4 Risco: Complexidade de Implementação

**Descrição:** Implementar logging em 75 arquivos pode ser complexo e demorado

**Probabilidade:** 🔴 ALTA  
**Impacto:** 🟡 MÉDIO

**Mitigação:**
1. **Priorização:** Implementar em fases (HTTP → Controllers → Services)
2. **Padrões:** Usar templates de código para padronizar
3. **Automação:** Criar scripts para migrar `console.log` para `logger`
4. **Testes:** Adicionar testes para validar logging

**Validação:**
```bash
# Script para detectar console.log
grep -r "console.log" backend/src/

# Script para migrar para logger
./backend/migrate-console-logs.sh
```

---

## 9. Conclusão

### 9.1 Resumo dos Gaps

**Total de Arquivos Analisados:** 75  
**Arquivos com Logging Estruturado:** 23 (30%)  
**Arquivos com `console.log`:** 11 (15%)  
**Arquivos sem Logging:** 41 (55%)

**Gaps Críticos:**
1. 🔴 **Falta middleware HTTP logger** → Painéis Grafana não funcionam
2. 🔴 **Falta logging de segurança** → Login/senha sem auditoria
3. 🔴 **Falta logging de integrações** → APIs externas sem rastreamento
4. 🟠 **Falta logging de negócio** → Operações críticas não auditadas
5. 🟡 **Inconsistência** → Alguns arquivos usam `console.log`

---

### 9.2 Estimativa Total

**Duração:** 13-20 dias úteis  
**Esforço:** 132 horas  
**Arquivos Afetados:** 35 arquivos

**Distribuição:**
- Fase 1 (HTTP Logging): 16h (12%)
- Fase 2 (Controllers): 32h (24%)
- Fase 3 (Services): 48h (36%)
- Fase 4 (Security): 20h (15%)
- Fase 5 (Middleware): 16h (12%)

---

### 9.3 Próximos Passos

1. **Aprovação da Proposta:** Revisar e aprovar este documento
2. **Criar Issues no GitHub:** Criar issues para cada fase
3. **Implementar Fase 1:** Começar com HTTP logging (CRÍTICO)
4. **Testar com Grafana:** Validar que painéis funcionam
5. **Implementar Fases 2-5:** Continuar com controllers, services, etc.
6. **Documentar:** Atualizar [`STANDARDS.md`](../docs/STANDARDS.md:1) com exemplos

---

### 9.4 Benefícios Esperados

✅ **Observabilidade:**
- Painéis Grafana funcionais
- Rastreamento completo de requisições
- Identificação rápida de problemas (< 5min)

✅ **Segurança:**
- Auditoria completa de ações sensíveis
- Detecção de atividades suspeitas
- Compliance com LGPD/GDPR

✅ **Performance:**
- Identificação de endpoints lentos
- Otimização baseada em dados reais
- Monitoramento de uso de recursos

✅ **Debugging:**
- Contexto rico para troubleshooting
- Stack traces completos em desenvolvimento
- Correlação entre logs de diferentes camadas

---

## 📚 Referências

- [STANDARDS.md §13 - Sistema de Logging Estruturado](../docs/STANDARDS.md#13-sistema-de-logging-estruturado)
- [types/logging.ts - Interface LogEntry](../backend/src/types/logging.ts:1)
- [utils/logger.ts - Implementação Winston](../backend/src/utils/logger.ts:1)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)

---

**Documento criado em:** 2026-01-27  
**Autor:** Kilo Code (Architect Mode)  
**Status:** 🟡 Aguardando Aprovação