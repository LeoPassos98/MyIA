# Plano de Modularização: useChatLogic.ts

## 📋 Objetivo da Modularização

Decompor [`useChatLogic.ts`](frontend/src/features/chat/hooks/useChatLogic.ts:1) (322 linhas) em hooks especializados e testáveis, eliminando o método gigante `handleSendMessage` (180+ linhas) e reduzindo complexidade ciclomática de 25 para <10 por módulo.

**Ganhos Esperados:**
- ✅ Testabilidade: Hooks isolados com responsabilidades únicas
- ✅ Manutenibilidade: Lógica de negócio separada de UI state
- ✅ Reutilização: Hooks podem ser usados em outros contextos
- ✅ Legibilidade: Redução de 60% no tamanho do hook principal

---

## 🔍 Análise de Responsabilidades Atuais

### **Problema Central: handleSendMessage (linhas 109-299)**
Método monolítico com 6 responsabilidades distintas:

1. **Validação** (linhas 111-119)
   - Validação de input vazio
   - Validação de modo manual (contexto obrigatório)
   - Validação de estado de envio

2. **Preparação de Payload** (linhas 180-214)
   - Montagem de payload base
   - Configuração de modo manual/auto
   - Configuração de pipeline de contexto
   - Lógica condicional complexa (isAutoMode)

3. **Gestão de Estado UI** (linhas 132-163)
   - Criação de mensagens otimistas
   - Gerenciamento de IDs temporários
   - Atualização de loading states

4. **Streaming** (linhas 217-265)
   - Processamento de 5 tipos de chunks
   - Buffer de chunks com flush timeout
   - Swap de IDs temporários → reais
   - Tratamento de erros inline

5. **Cleanup de Recursos** (linhas 122-129, 266-292)
   - Limpeza de timeouts
   - Abort de requisições
   - Reset de refs e buffers

6. **Navegação** (linhas 271-274)
   - Navegação para novo chat criado
   - Lógica condicional de replace

### **Outros Problemas Identificados:**
- **Código Duplicado:** Lógica de cleanup repetida em 3 lugares (linhas 32-53, 89-107, 122-129)
- **Gestão de Estado Complexa:** 6 refs + 4 states interdependentes
- **Baixa Coesão:** Lógica de negócio misturada com controle de UI

---

## 🏗️ Estrutura de Módulos Proposta

```
frontend/src/features/chat/hooks/
├── useChatLogic.ts (120 linhas)           # Orquestrador principal
├── useChatMessages.ts (80 linhas)         # Gestão de mensagens e histórico
├── useChatStreaming.ts (100 linhas)       # Lógica de streaming e chunks
├── useChatValidation.ts (60 linhas)       # Validações de envio
├── useChatNavigation.ts (50 linhas)       # Navegação e redirects
└── useChatCleanup.ts (40 linhas)          # Cleanup centralizado de recursos
```

---

## 📐 Interfaces e Contratos entre Módulos

### **1. useChatValidation.ts**
```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ChatValidationHook {
  validateSendMessage: (input: string, isLoading: boolean) => ValidationResult;
  validateManualContext: (context: ManualContext) => ValidationResult;
}
```

**Responsabilidades:**
- Validação de input vazio/whitespace
- Validação de modo manual (contexto obrigatório)
- Validação de estado de envio (loading, isSending)

---

### **2. useChatMessages.ts**
```typescript
interface ChatMessagesHook {
  messages: Message[];
  loadMessages: (chatId: string) => Promise<void>;
  addOptimisticMessages: (user: Message, ai: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  swapMessageId: (tempId: string, realId: string) => void;
  togglePin: (messageId: string) => Promise<void>;
}
```

**Responsabilidades:**
- Carregamento de mensagens do histórico
- Criação de mensagens otimistas (IDs temporários)
- Atualização de mensagens (conteúdo, métricas)
- Swap de IDs temporários → reais
- Toggle de pin

---

### **3. useChatStreaming.ts**
```typescript
interface StreamingState {
  isStreaming: boolean;
  buffer: string;
  abortController: AbortController | null;
}

interface ChatStreamingHook {
  streamingState: StreamingState;
  startStream: (payload: ChatPayload, callbacks: StreamCallbacks) => Promise<void>;
  stopStream: () => void;
  processChunk: (chunk: StreamChunk) => void;
}

interface StreamCallbacks {
  onChunk: (content: string) => void;
  onUserMessageSaved: (messageId: string) => void;
  onTelemetry: (metrics: TelemetryMetrics) => void;
  onDebug: (log: string) => void;
  onError: (error: string) => void;
  onComplete: (chatId?: string) => void;
}
```

**Responsabilidades:**
- Gerenciamento de AbortController
- Buffer de chunks com flush automático (50ms)
- Processamento de 5 tipos de chunks (chunk, user_message_saved, telemetry, debug, error)
- Callbacks estruturados para cada tipo de evento

---

### **4. useChatNavigation.ts**
```typescript
interface ChatNavigationHook {
  navigateToNewChat: (chatId: string) => void;
  redirectIfUnauthenticated: () => void;
}
```

**Responsabilidades:**
- Navegação para novo chat criado (replace: true)
- Redirect para login se não autenticado
- Gerenciamento de newChatIdRef

---

### **5. useChatCleanup.ts**
```typescript
interface CleanupResources {
  flushTimeout: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
  chunkBuffer: string;
  isSending: boolean;
  newChatId: string | null;
}

interface ChatCleanupHook {
  cleanup: () => void;
  cleanupBeforeSend: () => void;
}
```

**Responsabilidades:**
- Cleanup de timeouts pendentes
- Abort de requisições em andamento
- Reset de buffers e flags
- Cleanup no unmount do componente

---

### **6. useChatLogic.ts (Orquestrador)**
```typescript
// Hook principal - apenas orquestração
export function useChatLogic(chatId?: string) {
  const validation = useChatValidation();
  const messages = useChatMessages(chatId);
  const streaming = useChatStreaming();
  const navigation = useChatNavigation();
  const cleanup = useChatCleanup();

  const handleSendMessage = async () => {
    // 1. Validação (10 linhas)
    const validationResult = validation.validateSendMessage(inputMessage, isLoading);
    if (!validationResult.isValid) return;

    // 2. Preparação (15 linhas)
    cleanup.cleanupBeforeSend();
    const payload = buildPayload(); // Helper function
    messages.addOptimisticMessages(userMsg, aiMsg);

    // 3. Streaming (20 linhas)
    await streaming.startStream(payload, {
      onChunk: (content) => messages.updateMessage(tempAiMsgId, { content }),
      onUserMessageSaved: (id) => messages.swapMessageId(userMsgId, id),
      onTelemetry: (metrics) => messages.updateMessage(tempAiMsgId, metrics),
      onComplete: (chatId) => navigation.navigateToNewChat(chatId),
      // ... outros callbacks
    });
  };

  return { messages: messages.messages, handleSendMessage, ... };
}
```

---

## 🔄 Fluxo de Dados e Orquestração

### **Fluxo de Envio de Mensagem:**

```
1. useChatLogic.handleSendMessage()
   ↓
2. useChatValidation.validateSendMessage()
   ↓ (se válido)
3. useChatCleanup.cleanupBeforeSend()
   ↓
4. useChatMessages.addOptimisticMessages()
   ↓
5. useChatStreaming.startStream()
   ├─→ onChunk → useChatMessages.updateMessage()
   ├─→ onUserMessageSaved → useChatMessages.swapMessageId()
   ├─→ onTelemetry → useChatMessages.updateMessage()
   └─→ onComplete → useChatNavigation.navigateToNewChat()
```

### **Fluxo de Cleanup:**

```
1. Componente desmonta / Nova mensagem / Stop
   ↓
2. useChatCleanup.cleanup()
   ├─→ clearTimeout(flushTimeout)
   ├─→ abortController.abort()
   ├─→ reset buffers
   └─→ reset flags
```

---

## 🚀 Estratégia de Migração

### **Fase 1: Extração de Validação (1h)**
1. Criar `useChatValidation.ts`
2. Mover validações das linhas 111-119
3. Adicionar testes unitários
4. Integrar em `useChatLogic`

### **Fase 2: Extração de Cleanup (1h)**
1. Criar `useChatCleanup.ts`
2. Consolidar lógica duplicada (linhas 32-53, 89-107, 122-129)
3. Adicionar testes
4. Substituir chamadas diretas por `cleanup.cleanup()`

### **Fase 3: Extração de Navegação (45min)**
1. Criar `useChatNavigation.ts`
2. Mover lógica de redirect (linhas 55-58)
3. Mover navegação de novo chat (linhas 271-274)
4. Integrar em `useChatLogic`

### **Fase 4: Extração de Mensagens (2h)**
1. Criar `useChatMessages.ts`
2. Mover gestão de estado de mensagens
3. Mover `loadChatMessages`, `handleTogglePin`
4. Implementar `swapMessageId` e `updateMessage`
5. Adicionar testes

### **Fase 5: Extração de Streaming (3h)**
1. Criar `useChatStreaming.ts`
2. Mover lógica de buffer e flush (linhas 166-176, 224-225)
3. Mover processamento de chunks (linhas 219-265)
4. Implementar callbacks estruturados
5. Adicionar testes de streaming

### **Fase 6: Refatoração do Orquestrador (2h)**
1. Simplificar `handleSendMessage` para 40-50 linhas
2. Extrair `buildPayload` como helper function
3. Conectar todos os hooks
4. Testes de integração

### **Fase 7: Validação e Limpeza (1h)**
1. Executar checklist de validação
2. Testes E2E
3. Remover código comentado
4. Atualizar documentação

---

## ✅ Checklist de Validação

### **Funcionalidade:**
- [ ] Envio de mensagem funciona (novo chat)
- [ ] Envio de mensagem funciona (chat existente)
- [ ] Modo manual funciona (validação de contexto)
- [ ] Modo auto funciona (parâmetros recomendados)
- [ ] Streaming funciona (chunks, telemetry, debug)
- [ ] Stop funciona (abort + cleanup)
- [ ] Toggle pin funciona
- [ ] Navegação para novo chat funciona
- [ ] Redirect para login funciona

### **Qualidade:**
- [ ] Complexidade ciclomática <10 por hook
- [ ] Cobertura de testes >80%
- [ ] Sem código duplicado
- [ ] Sem memory leaks (cleanup validado)
- [ ] Hooks reutilizáveis em outros contextos

### **Performance:**
- [ ] Flush de chunks mantém 50ms
- [ ] Sem re-renders desnecessários
- [ ] AbortController funciona corretamente

---

## 📊 Estimativa de Esforço

| Fase | Esforço | Risco |
|------|---------|-------|
| Fase 1: Validação | Baixo | Baixo |
| Fase 2: Cleanup | Baixo | Baixo |
| Fase 3: Navegação | Baixo | Baixo |
| Fase 4: Mensagens | Médio | Médio |
| Fase 5: Streaming | Alto | Alto |
| Fase 6: Orquestrador | Médio | Médio |
| Fase 7: Validação | Baixo | Baixo |

**Riscos Principais:**
- **Streaming:** Lógica complexa de buffer e swap de IDs
- **Mensagens:** Estado compartilhado entre múltiplos hooks
- **Integração:** Garantir que callbacks funcionam corretamente

**Mitigação:**
- Testes unitários em cada fase
- Testes de integração na Fase 6
- Validação incremental com checklist

---

## 🎯 Resultado Final Esperado

**Antes:**
- 1 arquivo de 322 linhas
- Método de 180+ linhas
- Complexidade ciclomática: 25
- Testabilidade: Baixa

**Depois:**
- 6 arquivos especializados
- Maior método: ~50 linhas
- Complexidade ciclomática: <10 por módulo
- Testabilidade: Alta
- Reutilização: Hooks independentes

---

## 📚 Referências

- Arquivo original: [`useChatLogic.ts`](frontend/src/features/chat/hooks/useChatLogic.ts:1)
- Standards: [`docs/STANDARDS.md`](docs/STANDARDS.md:1)
- Hook de otimização: [`useMemoryOptimization.ts`](frontend/src/hooks/useMemoryOptimization.ts:1)
