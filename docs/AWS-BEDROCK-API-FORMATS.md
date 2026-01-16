# AWS Bedrock - Formatos de API por Provedor

## 🎯 Problema Resolvido

Diferentes modelos no AWS Bedrock usam formatos de API distintos. Enviar parâmetros no formato errado resulta em erro:

```
[ERRO] Malformed input request: 
#: extraneous key [top_p] is not permitted
#: extraneous key [system] is not permitted
#: extraneous key [top_k] is not permitted
#: extraneous key [messages] is not permitted
#: extraneous key [anthropic_version] is not permitted
```

---

## 📋 Provedores Suportados

### 1. **Anthropic Claude** (`anthropic.*`)

**Modelos:**
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-3-5-haiku-20241022-v1:0`
- `anthropic.claude-haiku-4-5-20251001-v1:0`
- `anthropic.claude-sonnet-4-20250514-v1:0`

**Formato do Payload:**
```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 2048,
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi!" }
  ],
  "temperature": 0.7,
  "top_k": 250,
  "top_p": 0.999,
  "system": "You are a helpful assistant"
}
```

**Parâmetros:**
- ✅ `anthropic_version` - Versão da API (obrigatório)
- ✅ `messages` - Array de mensagens (obrigatório)
- ✅ `system` - System prompt (opcional)
- ✅ `max_tokens` - Máximo de tokens
- ✅ `temperature` - Temperatura (0-1)
- ✅ `top_k` - Top K sampling
- ✅ `top_p` - Top P sampling

**Formato de Resposta (Stream):**
```json
{
  "type": "content_block_delta",
  "delta": { "text": "Hello" }
}
{
  "type": "message_stop"
}
```

---

### 2. **Cohere Command** (`cohere.*`)

**Modelos:**
- `cohere.command-r-v1:0`
- `cohere.command-r-plus-v1:0`
- `cohere.command-light-v14`
- `cohere.command-text-v14`

**Formato do Payload:**
```json
{
  "message": "What is the capital of France?",
  "chat_history": [
    { "role": "USER", "message": "Hello" },
    { "role": "CHATBOT", "message": "Hi there!" }
  ],
  "preamble": "You are a helpful assistant",
  "temperature": 0.7,
  "max_tokens": 2048,
  "p": 0.9
}
```

**Parâmetros:**
- ✅ `message` - Mensagem atual do usuário (obrigatório)
- ✅ `chat_history` - Histórico de conversação (opcional)
- ✅ `preamble` - System prompt (opcional)
- ✅ `max_tokens` - Máximo de tokens
- ✅ `temperature` - Temperatura (0-1)
- ✅ `p` - Top P sampling (equivalente a `top_p`)
- ❌ `stream` - **NÃO suportado** (streaming é controlado pelo AWS Bedrock, não pelo payload)
- ❌ `top_k` - Não suportado
- ❌ `anthropic_version` - Não suportado
- ❌ `messages` - Não suportado (usa `message` + `chat_history`)
- ❌ `system` - Não suportado (usa `preamble`)

**IMPORTANTE:** O streaming é controlado pelo comando `InvokeModelWithResponseStreamCommand` do AWS SDK, não pelo payload. Não adicione `stream: true` ao payload do Cohere.

**Formato de Resposta (Stream):**
```json
{
  "text": "Paris",
  "is_finished": false
}
{
  "text": " is the capital",
  "is_finished": false
}
{
  "is_finished": true
}
```

---

### 3. **Amazon Titan/Nova** (`amazon.*`)

**Modelos:**
- `amazon.titan-text-express-v1`
- `amazon.titan-text-lite-v1`
- `amazon.nova-2-lite-v1:0`
- `amazon.nova-2-micro-v1:0`
- `amazon.nova-2-pro-v1:0`

**Formato do Payload:**
```json
{
  "inputText": "System: You are helpful\n\nUser: Hello\n\nAssistant: Hi!",
  "textGenerationConfig": {
    "maxTokenCount": 2048,
    "temperature": 0.7,
    "topP": 0.9
  }
}
```

**Parâmetros:**
- ✅ `inputText` - Texto formatado com roles (obrigatório)
- ✅ `textGenerationConfig.maxTokenCount` - Máximo de tokens
- ✅ `textGenerationConfig.temperature` - Temperatura (0-1)
- ✅ `textGenerationConfig.topP` - Top P sampling
- ❌ `messages` - Não suportado (usa `inputText`)
- ❌ `anthropic_version` - Não suportado
- ❌ `top_k` - Não suportado

**Formato de Resposta (Stream):**
```json
{
  "outputText": "Hello",
  "completionReason": null
}
{
  "outputText": " there",
  "completionReason": "FINISH"
}
```

---

## 🔧 Implementação

### Detecção Automática de Provedor

O sistema detecta automaticamente o provedor baseado no prefixo do `modelId`:

```typescript
function detectModelProvider(modelId: string): ModelProvider {
  const prefix = modelId.split('.')[0].toLowerCase();
  
  switch (prefix) {
    case 'anthropic': return ModelProvider.ANTHROPIC;
    case 'cohere': return ModelProvider.COHERE;
    case 'amazon': return ModelProvider.AMAZON;
    case 'ai21': return ModelProvider.AI21;
    case 'meta': return ModelProvider.META;
    case 'mistral': return ModelProvider.MISTRAL;
    default: return ModelProvider.ANTHROPIC; // Fallback
  }
}
```

### Criação de Payload Específico

```typescript
function createPayloadForProvider(
  provider: ModelProvider,
  messages: any[],
  options: AIRequestOptions
): any {
  switch (provider) {
    case ModelProvider.ANTHROPIC:
      return createAnthropicPayload(messages, options);
    
    case ModelProvider.COHERE:
      return createCoherePayload(messages, options);
    
    case ModelProvider.AMAZON:
      return createAmazonPayload(messages, options);
    
    default:
      return createAnthropicPayload(messages, options);
  }
}
```

### Processamento de Chunks

Cada provedor retorna chunks em formato diferente:

```typescript
function* processChunkForProvider(
  provider: ModelProvider,
  chunk: any
): Generator<StreamChunk> {
  switch (provider) {
    case ModelProvider.ANTHROPIC:
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        yield { type: 'chunk', content: chunk.delta.text };
      }
      break;
    
    case ModelProvider.COHERE:
      if (chunk.text) {
        yield { type: 'chunk', content: chunk.text };
      }
      break;
    
    case ModelProvider.AMAZON:
      if (chunk.outputText) {
        yield { type: 'chunk', content: chunk.outputText };
      }
      break;
  }
}
```

---

## ❓ Perguntas Frequentes

### 1. **Preciso sempre enviar todos os parâmetros?**

**Não.** Cada provedor tem seus parâmetros obrigatórios e opcionais:

- **Anthropic**: Obrigatório apenas `messages` e `max_tokens`
- **Cohere**: Obrigatório apenas `message` e `stream`
- **Amazon**: Obrigatório apenas `inputText`

Parâmetros como `temperature`, `top_p`, `system` são sempre opcionais.

### 2. **Posso não enviar nenhum parâmetro opcional?**

**Sim.** O sistema usa valores padrão:
- `temperature`: 0.7
- `max_tokens`: 2048
- `top_p`: 0.9 ou 0.999 (dependendo do provedor)

### 3. **Como saber qual formato usar para cada modelo?**

O sistema **detecta automaticamente** baseado no prefixo do `modelId`:

| Prefixo | Provedor | Formato |
|---------|----------|---------|
| `anthropic.*` | Anthropic | Claude API |
| `cohere.*` | Cohere | Cohere API |
| `amazon.*` | Amazon | Titan/Nova API |
| `ai21.*` | AI21 | AI21 API (TODO) |
| `meta.*` | Meta | Llama API (TODO) |
| `mistral.*` | Mistral | Mistral API (TODO) |

### 4. **O que acontece se eu enviar parâmetros errados?**

O AWS Bedrock retorna erro `400 Bad Request` com mensagem:
```
Malformed input request: extraneous key [parameter_name] is not permitted
```

Com a implementação atual, isso **não acontece mais** porque o sistema envia apenas os parâmetros corretos para cada provedor.

### 5. **Todos os modelos Cohere têm o mesmo problema?**

**Sim.** Todos os modelos Cohere (`cohere.*`) usam a API Cohere, que é diferente da API Anthropic. O mesmo vale para outros provedores.

---

## 🧪 Testando

### Teste com Cohere Command R

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "bedrock",
    "modelId": "cohere.command-r-v1:0",
    "apiKey": "ACCESS_KEY:SECRET_KEY"
  }'
```

### Teste com Anthropic Claude

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "bedrock",
    "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "apiKey": "ACCESS_KEY:SECRET_KEY"
  }'
```

### Teste com Amazon Nova

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "bedrock",
    "modelId": "amazon.nova-2-lite-v1:0",
    "apiKey": "ACCESS_KEY:SECRET_KEY"
  }'
```

---

## 📚 Referências

- [AWS Bedrock API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/welcome.html)
- [Anthropic Claude on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
- [Cohere Command on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command-r-plus.html)
- [Amazon Titan on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html)

---

## ✅ Status

- ✅ **Anthropic Claude** - Implementado e testado
- ✅ **Cohere Command** - Implementado (aguardando teste)
- ✅ **Amazon Titan/Nova** - Implementado (aguardando teste)
- ⏳ **AI21 Jurassic** - Pendente
- ⏳ **Meta Llama** - Pendente
- ⏳ **Mistral** - Pendente
- ⏳ **Stability AI** - Pendente

---

**Documento criado em**: 2026-01-16  
**Versão**: 1.0  
**Autor**: Sistema MyIA
