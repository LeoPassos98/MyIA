# Plano de Modularização: chatController.ts

**Arquivo:** [`backend/src/controllers/chatController.ts`](../backend/src/controllers/chatController.ts)  
**Linhas Atuais:** 522 linhas (410 linhas de código efetivo)  
**Meta:** ≤200 linhas (orquestração pura)  
**Conformidade:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Responsabilidades Identificadas

O controller possui **1 endpoint complexo** (`sendMessage`) com múltiplas responsabilidades:

| Responsabilidade | Linhas | Complexidade |
|------------------|--------|--------------|
| **Validação de Entrada** | ~40 | Média |
| **Prevenção de Duplicidade** | ~15 | Baixa |
| **Setup SSE** | ~10 | Baixa |
| **Gestão de Chat** | ~30 | Média |
| **Construção de Contexto** | ~50 | Alta |
| **Montagem de Payload** | ~70 | Alta |
| **Validação de Tokens** | ~20 | Média |
| **Auditoria (sentContext)** | ~30 | Média |
| **Streaming** | ~120 | Alta |
| **Salvamento no Banco** | ~60 | Média |
| **Geração de Embeddings** | ~30 | Média |
| **Geração de Título** | ~40 | Média |

### 1.2 Problemas Identificados

#### ❌ Violações de STANDARDS.md

1. **Tamanho Excessivo (410 linhas)**
   - Limite: 200 linhas para controllers
   - Excesso: 105% acima do recomendado

2. **Lógica de Negócio no Controller**
   - Construção de contexto RAG (linhas 88-118)
   - Montagem de payload para IA (linhas 132-164)
   - Validação de tokens (linhas 166-182)
   - Construção de auditoria (linhas 186-212)
   - Processamento de stream (linhas 238-302)

3. **Responsabilidades Misturadas**
   - Controller faz validação de negócio
   - Controller constrói payloads complexos
   - Controller gerencia SSE diretamente
   - Controller faz cálculos de custo

### 1.3 Métricas de Complexidade

```
Complexidade Ciclomática: ~35 (Muito Alta)
Acoplamento: 10 dependências diretas
Coesão: Muito Baixa (múltiplas responsabilidades)
Testabilidade: Muito Difícil (lógica entrelaçada)
```

---

## 🎯 2. Proposta de Divisão em Módulos

### 2.1 Estrutura de Diretórios Proposta

```
backend/src/
├── controllers/
│   └── chatController.ts                       # 180 linhas (orquestração)
├── services/
│   └── chat/
│       ├── chatOrchestrator.ts                 # 200 linhas (coordenação)
│       ├── chatValidator.ts                    # 100 linhas (validações)
│       ├── contextBuilder.ts                   # 150 linhas (construção contexto)
│       ├── payloadBuilder.ts                   # 120 linhas (payload IA)
│       ├── auditBuilder.ts                     # 100 linhas (sentContext)
│       ├── streamProcessor.ts                  # 180 linhas (processamento stream)
│       ├── messageRepository.ts                # 150 linhas (persistência)
│       └── titleGenerator.ts                   # 80 linhas (geração título)
├── middleware/
│   └── validators/
│       └── chatValidator.ts                    # 80 linhas (validação entrada)
└── utils/
    └── chat/
        ├── duplicateRequestGuard.ts            # 60 linhas (anti-duplicação)
        ├── sseHandler.ts                       # 70 linhas (SSE setup)
        └── tokenValidator.ts                   # 80 linhas (validação tokens)
```

### 2.2 Responsabilidades por Módulo

#### **chatController.ts** (180 linhas - Orquestração HTTP)
```typescript
// Apenas:
// 1. Receber requisição
// 2. Chamar orchestrator
// 3. Configurar SSE
// 4. Retornar resposta

export const chatController = {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Validação de duplicidade
      const requestId = duplicateRequestGuard.generateId(req);
      if (duplicateRequestGuard.isProcessing(requestId)) {
        res.status(429).json({ error: 'Duplicate request blocked' });
        return;
      }
      
      duplicateRequestGuard.markAsProcessing(requestId);
      const cleanup = () => duplicateRequestGuard.release(requestId);
      
      // Setup SSE
      sseHandler.setupHeaders(res);
      const writeSSE = sseHandler.createWriter(res);
      
      try {
        // Orquestrar processamento
        await chatOrchestrator.processMessage({
          userId: req.userId,
          body: req.body,
          writeSSE,
          requestId: req.id
        });
        
        res.end();
      } finally {
        cleanup();
      }
    } catch (error) {
      if (!res.headersSent) next(error);
    }
  }
};
```

#### **chatOrchestrator.ts** (200 linhas - Coordenação)
```typescript
// Orquestra todo o fluxo de processamento

export class ChatOrchestrator {
  async processMessage({
    userId,
    body,
    writeSSE,
    requestId
  }: ProcessMessageParams): Promise<void> {
    // 1. Validar entrada
    chatValidator.validateMessage(body);
    
    // 2. Gestão de chat
    const chat = await this.getOrCreateChat(userId, body.chatId, body.provider);
    const isNewChat = !body.chatId;
    
    // 3. Construir contexto
    const context = await contextBuilder.build({
      chatId: chat.id,
      message: body.message,
      isManualMode: body.context !== undefined,
      selectedMessageIds: body.selectedMessageIds,
      contextConfig: body.contextConfig,
      writeSSE
    });
    
    // 4. Salvar mensagem do usuário
    const userMessage = await messageRepository.saveUserMessage({
      chatId: chat.id,
      content: body.message
    });
    
    writeSSE({ type: 'user_message_saved', userMessageId: userMessage.id });
    
    // 5. Construir payload para IA
    const payload = payloadBuilder.build({
      context,
      message: body.message,
      systemPrompt: body.contextConfig?.systemPrompt
    });
    
    // 6. Validar tokens
    tokenValidator.validate(payload, chat.provider, body.model);
    
    // 7. Construir auditoria
    const audit = auditBuilder.build({
      context,
      userMessageId: userMessage.id,
      config: {
        model: body.model,
        provider: chat.provider,
        strategy: body.strategy,
        params: { temperature: body.temperature, ... }
      }
    });
    
    // 8. Processar stream
    const result = await streamProcessor.process({
      payload,
      options: {
        providerSlug: chat.provider,
        modelId: body.model,
        userId,
        temperature: body.temperature,
        ...
      },
      writeSSE
    });
    
    // 9. Salvar resposta
    if (result.content) {
      const assistantMessage = await messageRepository.saveAssistantMessage({
        chatId: chat.id,
        content: result.content,
        provider: chat.provider,
        model: body.model,
        metrics: result.metrics,
        sentContext: audit
      });
      
      writeSSE({ type: 'telemetry', metrics: { ...result.metrics, messageId: assistantMessage.id } });
      
      // 10. Embeddings (fire and forget)
      this.generateEmbeddings(userMessage.id, assistantMessage.id, body.message, result.content);
      
      // 11. Título (se novo chat)
      if (isNewChat) {
        this.generateTitle(chat.id, body.message, result.content, userId);
      }
    }
  }
  
  private async getOrCreateChat(userId: string, chatId?: string, provider?: string) {
    if (chatId) {
      const chat = await prisma.chat.findUnique({ where: { id: chatId, userId } });
      if (!chat) throw new Error('Chat not found');
      return chat;
    }
    return prisma.chat.create({ data: { userId, provider: provider || 'groq' } });
  }
  
  private async generateEmbeddings(userMsgId: string, assistantMsgId: string, userContent: string, assistantContent: string) {
    // Fire and forget
    embeddingService.generateForMessages(userMsgId, assistantMsgId, userContent, assistantContent)
      .catch(err => logger.error('Erro ao gerar embeddings', { error: err.message }));
  }
  
  private async generateTitle(chatId: string, userMessage: string, assistantMessage: string, userId: string) {
    // Fire and forget
    titleGenerator.generate(chatId, userMessage, assistantMessage, userId)
      .catch(err => logger.error('Erro ao gerar título', { error: err.message }));
  }
}
```

#### **contextBuilder.ts** (150 linhas - Construção de Contexto)
```typescript
// Constrói contexto (histórico) para IA

export class ContextBuilder {
  async build({
    chatId,
    message,
    isManualMode,
    selectedMessageIds,
    contextConfig,
    writeSSE
  }: BuildContextParams): Promise<ContextResult> {
    if (isManualMode) {
      return this.buildManualContext(chatId, selectedMessageIds);
    }
    
    return this.buildAutoContext(chatId, message, contextConfig, writeSSE);
  }
  
  private async buildManualContext(chatId: string, selectedMessageIds?: string[]): Promise<ContextResult> {
    if (!selectedMessageIds || selectedMessageIds.length === 0) {
      return { messages: [], origins: {} };
    }
    
    const messages = await prisma.message.findMany({
      where: { id: { in: selectedMessageIds }, chatId },
      orderBy: { createdAt: 'asc' }
    });
    
    return {
      messages,
      origins: {} // Manual não rastreia origem
    };
  }
  
  private async buildAutoContext(
    chatId: string,
    message: string,
    contextConfig: any,
    writeSSE: (data: any) => void
  ): Promise<ContextResult> {
    const report = await contextService.getHybridRagHistory(
      chatId,
      message,
      writeSSE,
      contextConfig
    );
    
    return {
      messages: report.finalContext,
      origins: report.messageOrigins
    };
  }
}
```

#### **payloadBuilder.ts** (120 linhas - Payload para IA)
```typescript
// Constrói payload final para enviar à IA

export class PayloadBuilder {
  build({
    context,
    message,
    systemPrompt
  }: BuildPayloadParams): PayloadForIA {
    const payload: Array<{ role: string; content: string }> = [];
    const pinnedStepIndices: number[] = [];
    const stepOrigins: Record<number, string> = {};
    
    // System prompt
    const finalSystemPrompt = systemPrompt || "Você é uma IA útil e direta.";
    payload.push({ role: 'system', content: finalSystemPrompt });
    
    // Histórico
    context.messages.forEach(msg => {
      const currentIndex = payload.length;
      payload.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
      
      if (msg.isPinned) {
        pinnedStepIndices.push(currentIndex);
      }
      
      if (context.origins[msg.id]) {
        stepOrigins[currentIndex] = context.origins[msg.id];
      }
    });
    
    // Mensagem atual
    payload.push({ role: 'user', content: message });
    
    return {
      payload,
      pinnedStepIndices,
      stepOrigins,
      systemPrompt: finalSystemPrompt
    };
  }
}
```

#### **auditBuilder.ts** (100 linhas - sentContext)
```typescript
// Constrói objeto de auditoria (sentContext) - STANDARDS §7

export class AuditBuilder {
  build({
    context,
    userMessageId,
    config
  }: BuildAuditParams): AuditObject {
    const isAutoMode = config.params.temperature === undefined;
    
    return {
      config_V47: {
        mode: config.isManualMode ? 'manual' : 'auto',
        model: config.model,
        provider: config.provider,
        timestamp: new Date().toISOString(),
        strategy: config.strategy || 'efficient',
        params: {
          mode: isAutoMode ? 'auto' : 'manual',
          temperature: config.params.temperature ?? 'auto',
          topP: config.params.topP ?? 'auto',
          topK: config.params.topK ?? 'auto',
          maxTokens: config.params.maxTokens ?? 'auto',
          memoryWindow: config.params.memoryWindow
        }
      },
      systemPrompt: context.systemPrompt,
      messageIds: context.messages.map(m => m.id),
      userMessageId,
      pinnedStepIndices: context.pinnedStepIndices,
      stepOrigins: context.stepOrigins,
      preflightTokenCount: contextService.countTokens(context.payload)
    };
  }
}
```

#### **streamProcessor.ts** (180 linhas - Processamento de Stream)
```typescript
// Processa stream da IA e trata erros

export class StreamProcessor {
  async process({
    payload,
    options,
    writeSSE
  }: ProcessStreamParams): Promise<StreamResult> {
    const stream = aiService.stream(payload, options);
    
    let fullContent = "";
    let finalMetrics: TelemetryMetrics | null = null;
    let streamError: string | null = null;
    
    // Watchdog para timeout
    const watchdog = this.createWatchdog(writeSSE);
    
    try {
      for await (const chunk of stream) {
        watchdog.reset();
        
        if (chunk.type === 'chunk') {
          fullContent += chunk.content;
        } else if (chunk.type === 'telemetry') {
          finalMetrics = chunk.metrics;
        } else if (chunk.type === 'error') {
          streamError = chunk.error;
        }
        
        writeSSE(chunk);
      }
      
      watchdog.clear();
      
      // Se houve erro, retornar early
      if (streamError) {
        return { content: null, metrics: null, error: streamError };
      }
      
      // Fallback de métricas se necessário
      if (!finalMetrics || finalMetrics.tokensIn === 0) {
        finalMetrics = this.calculateFallbackMetrics(payload, fullContent, options);
        writeSSE({ type: 'telemetry', metrics: finalMetrics });
      }
      
      return { content: fullContent, metrics: finalMetrics, error: null };
    } catch (error: any) {
      watchdog.clear();
      throw error;
    }
  }
  
  private createWatchdog(writeSSE: (data: any) => void) {
    let timer: NodeJS.Timeout | undefined;
    
    return {
      reset: () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          writeSSE({ type: 'error', error: 'Timeout: API parou de responder' });
        }, 60000);
      },
      clear: () => {
        if (timer) clearTimeout(timer);
      }
    };
  }
  
  private calculateFallbackMetrics(payload: any[], content: string, options: any): TelemetryMetrics {
    const tokensIn = contextService.countTokens(payload);
    const tokensOut = contextService.encode(content);
    const providerInfo = getProviderInfo(options.modelId);
    const costInUSD = (tokensIn / 1_000_000) * providerInfo.costIn +
                      (tokensOut / 1_000_000) * providerInfo.costOut;
    
    return {
      provider: options.providerSlug,
      model: options.modelId,
      tokensIn,
      tokensOut,
      costInUSD,
      chatId: options.chatId
    };
  }
}
```

#### **messageRepository.ts** (150 linhas - Persistência)
```typescript
// Gerencia salvamento de mensagens no banco

export class MessageRepository {
  async saveUserMessage({ chatId, content }: SaveUserMessageParams): Promise<Message> {
    return prisma.message.create({
      data: {
        role: 'user',
        content,
        chatId
      }
    });
  }
  
  async saveAssistantMessage({
    chatId,
    content,
    provider,
    model,
    metrics,
    sentContext
  }: SaveAssistantMessageParams): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        role: 'assistant',
        content,
        chatId,
        provider,
        model,
        tokensIn: metrics.tokensIn,
        tokensOut: metrics.tokensOut,
        costInUSD: metrics.costInUSD,
        sentContext: JSON.stringify(sentContext)
      }
    });
    
    // Log estruturado
    logger.info('TRACE_CREATED', {
      traceId: message.id,
      chatId,
      provider,
      model,
      tokensIn: metrics.tokensIn,
      tokensOut: metrics.tokensOut,
      costInUSD: metrics.costInUSD
    });
    
    return message;
  }
  
  async saveErrorMessage({
    chatId,
    error,
    provider,
    model,
    audit
  }: SaveErrorMessageParams): Promise<Message> {
    const errorContent = `[ERRO] ${error}`;
    const errorAudit = {
      ...audit,
      error: { message: error, type: 'stream_error' }
    };
    
    return prisma.message.create({
      data: {
        role: 'assistant',
        content: errorContent,
        chatId,
        provider,
        model,
        tokensIn: audit.preflightTokenCount || 0,
        tokensOut: 0,
        costInUSD: 0,
        sentContext: JSON.stringify(errorAudit)
      }
    });
  }
}
```

---

## 🔄 3. Ordem de Implementação

### Fase 1: Extração de Utilitários

1. ✅ Criar `duplicateRequestGuard.ts`
2. ✅ Criar `sseHandler.ts`
3. ✅ Criar `tokenValidator.ts`

### Fase 2: Extração de Builders

4. ✅ Criar `contextBuilder.ts`
5. ✅ Criar `payloadBuilder.ts`
6. ✅ Criar `auditBuilder.ts`

### Fase 3: Extração de Processadores

7. ✅ Criar `streamProcessor.ts`
8. ✅ Criar `messageRepository.ts`
9. ✅ Criar `titleGenerator.ts`

### Fase 4: Criação do Orchestrator

10. ✅ Criar `chatOrchestrator.ts`
    - Integrar todos os módulos
    - Testes de integração

### Fase 5: Refatoração do Controller

11. ✅ Refatorar `chatController.ts`
    - Reduzir para orquestração HTTP
    - Usar orchestrator

12. ✅ Validação Final

---

## ⚠️ 4. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| **Quebra de SSE** | Testes de integração específicos |
| **Perda de auditoria** | Validar sentContext idêntico |
| **Degradação de performance** | Benchmarks antes/depois |
| **Regressão em embeddings** | Testes assíncronos |

---

## 📊 5. Métricas de Sucesso

### Antes
```
Arquivo: chatController.ts
Linhas: 522 (410 efetivas)
Complexidade: ~35
Testabilidade: Muito Difícil
```

### Depois (Meta)
```
chatController.ts: ≤180 linhas
chatOrchestrator.ts: 200 linhas
Builders: 3 × ~120 linhas
Processors: 3 × ~150 linhas
Utils: 3 × ~70 linhas

Total: ~1300 linhas (vs 522 original)
Ganho: +149% código, mas 100% testável e modular
```

---

## ✅ 6. Critérios de Aceitação

- [ ] Controller ≤200 linhas
- [ ] Orchestrator ≤250 linhas
- [ ] Services ≤200 linhas cada
- [ ] SSE funciona identicamente
- [ ] sentContext preservado
- [ ] Embeddings funcionam
- [ ] Título gerado corretamente
- [ ] Cobertura ≥80%

---

**Plano criado em:** 2026-02-07  
**Conformidade:** STANDARDS.md Seção 15  
**Status:** Aguardando aprovação
