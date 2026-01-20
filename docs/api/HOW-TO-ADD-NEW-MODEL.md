# Como Adicionar um Novo Modelo

**Guia passo-a-passo para adicionar modelos ao sistema**

---

## 🎯 Cenários

### Cenário 1: Modelo de Vendor Existente
**Exemplo:** Novo Claude 4 da Anthropic

**Tempo:** ~2 minutos  
**Arquivos:** 1

### Cenário 2: Modelo de Novo Vendor
**Exemplo:** Primeiro modelo da Meta (Llama)

**Tempo:** ~15 minutos  
**Arquivos:** 2-3

---

## 📋 Cenário 1: Modelo de Vendor Existente

### Passo 1: Identificar o Vendor

Verifique o prefixo do `modelId`:
- `anthropic.*` → Anthropic (usa [`AnthropicAdapter`](../backend/src/services/ai/adapters/anthropic.adapter.ts))
- `cohere.*` → Cohere (usa [`CohereAdapter`](../backend/src/services/ai/adapters/cohere.adapter.ts))
- `amazon.*` → Amazon (usa [`AmazonAdapter`](../backend/src/services/ai/adapters/amazon.adapter.ts))

### Passo 2: Adicionar no Registry

Edite o arquivo do vendor correspondente:

**Para Anthropic:** [`backend/src/services/ai/registry/models/anthropic.models.ts`](../backend/src/services/ai/registry/models/anthropic.models.ts)

```typescript
// Adicione no array anthropicModels
{
  modelId: 'anthropic.claude-4-opus-20260101-v1:0',
  vendor: 'anthropic',
  displayName: 'Claude 4 Opus',
  description: 'Most powerful Claude model with enhanced reasoning',
  capabilities: {
    streaming: true,
    vision: true,
    functionCalling: true,
    maxContextWindow: 200000,
    maxOutputTokens: 8192,
  },
  supportedPlatforms: ['bedrock'],
  platformRules: [
    {
      platform: 'bedrock',
      rule: 'requires_inference_profile',
    },
  ],
  adapterClass: 'AnthropicAdapter',
},
```

### Passo 3: Reiniciar o Backend

```bash
cd backend
npm run dev
```

### Passo 4: Testar

```bash
# Buscar modelos disponíveis
curl -X GET http://localhost:3000/api/providers/bedrock/available-models \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verificar se o novo modelo aparece na lista
```

### ✅ Pronto!

O modelo já está disponível para uso.

---

## 📋 Cenário 2: Modelo de Novo Vendor

### Exemplo: Adicionar Meta Llama

### Passo 1: Criar o Adapter

**Arquivo:** [`backend/src/services/ai/adapters/meta.adapter.ts`](../backend/src/services/ai/adapters/meta.adapter.ts)

```typescript
// backend/src/services/ai/adapters/meta.adapter.ts
// Standards: docs/STANDARDS.md

import { BaseAdapter, Message, UniversalOptions, AdapterPayload } from './base.adapter';

/**
 * Adapter for Meta Llama models on AWS Bedrock
 * 
 * API Format:
 * {
 *   "prompt": "<s>[INST] {message} [/INST]",
 *   "max_gen_len": 512,
 *   "temperature": 0.7,
 *   "top_p": 0.9
 * }
 * 
 * Response Format:
 * {
 *   "generation": "text",
 *   "prompt_token_count": 10,
 *   "generation_token_count": 20,
 *   "stop_reason": "stop"
 * }
 */
export class MetaAdapter extends BaseAdapter {
  readonly vendor = 'meta';
  readonly displayName = 'Meta Llama Adapter';

  /**
   * Format messages to Meta Llama format
   */
  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    // Meta Llama usa formato de prompt especial
    const prompt = this.formatPrompt(messages);

    const body = {
      prompt,
      max_gen_len: options.maxTokens || 512,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
    };

    return {
      body,
      contentType: 'application/json',
      accept: 'application/json',
    };
  }

  /**
   * Format messages to Llama prompt format
   * <s>[INST] {user_message} [/INST] {assistant_response} </s>
   */
  private formatPrompt(messages: Message[]): string {
    let prompt = '<s>';
    
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `[INST] ${msg.content} [/INST]`;
      } else if (msg.role === 'assistant') {
        prompt += ` ${msg.content} </s><s>`;
      }
    }
    
    return prompt;
  }

  /**
   * Parse streaming chunk from Meta Llama
   */
  parseChunk(chunk: any): { type: 'chunk' | 'done' | 'error'; content?: string; error?: string } {
    // Meta Llama retorna texto diretamente
    if (chunk.generation) {
      return { type: 'chunk', content: chunk.generation };
    }

    if (chunk.stop_reason === 'stop' || chunk.stop_reason === 'length') {
      return { type: 'done' };
    }

    if (chunk.error) {
      return { type: 'error', error: chunk.error };
    }

    return { type: 'chunk', content: '' };
  }
}
```

### Passo 2: Registrar o Adapter na Factory

**Arquivo:** [`backend/src/services/ai/adapters/adapter-factory.ts`](../backend/src/services/ai/adapters/adapter-factory.ts)

```typescript
// Adicione o import
import { MetaAdapter } from './meta.adapter';

// Adicione no método getAdapter()
static getAdapter(vendor: string): BaseAdapter {
  // ... código existente ...
  
  case 'meta':
    return this.getCachedAdapter('meta', () => new MetaAdapter());
  
  // ... resto do código ...
}
```

### Passo 3: Exportar o Adapter

**Arquivo:** [`backend/src/services/ai/adapters/index.ts`](../backend/src/services/ai/adapters/index.ts)

```typescript
export * from './meta.adapter';
```

### Passo 4: Criar Arquivo de Registry

**Arquivo:** [`backend/src/services/ai/registry/models/meta.models.ts`](../backend/src/services/ai/registry/models/meta.models.ts)

```typescript
// backend/src/services/ai/registry/models/meta.models.ts
// Standards: docs/STANDARDS.md

import { ModelRegistry, ModelMetadata } from '../model-registry';

/**
 * Meta Llama models on AWS Bedrock
 */
const metaModels: ModelMetadata[] = [
  {
    modelId: 'meta.llama3-70b-instruct-v1:0',
    vendor: 'meta',
    displayName: 'Llama 3 70B Instruct',
    description: 'Meta\'s most capable open-source model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8192,
      maxOutputTokens: 2048,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'MetaAdapter',
  },
  {
    modelId: 'meta.llama3-8b-instruct-v1:0',
    vendor: 'meta',
    displayName: 'Llama 3 8B Instruct',
    description: 'Smaller, faster Llama model',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 8192,
      maxOutputTokens: 2048,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'MetaAdapter',
  },
];

// Auto-register on import
ModelRegistry.registerMany(metaModels);

export { metaModels };
```

### Passo 5: Registrar no Index

**Arquivo:** [`backend/src/services/ai/registry/models/index.ts`](../backend/src/services/ai/registry/models/index.ts)

```typescript
import './meta.models';

export * from './meta.models';
```

### Passo 6: Adicionar no Banco (Opcional)

Se quiser custos e controle de admin:

```sql
-- Adicionar provider (se não existir)
INSERT INTO ai_providers (id, name, slug, is_active)
VALUES (gen_random_uuid(), 'Meta', 'meta', true);

-- Adicionar modelos
INSERT INTO ai_models (id, name, api_model_id, context_window, cost_per_1k_input, cost_per_1k_output, is_active, provider_id)
VALUES 
  (gen_random_uuid(), 'Llama 3 70B Instruct', 'meta.llama3-70b-instruct-v1:0', 8192, 0.00265, 0.0035, true, 
   (SELECT id FROM ai_providers WHERE slug = 'meta')),
  (gen_random_uuid(), 'Llama 3 8B Instruct', 'meta.llama3-8b-instruct-v1:0', 8192, 0.0003, 0.0006, true, 
   (SELECT id FROM ai_providers WHERE slug = 'meta'));
```

### Passo 7: Testar

```bash
# Reiniciar backend
cd backend
npm run dev

# Testar
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test-chat-id",
    "message": "Hello, Llama!",
    "provider": "bedrock",
    "model": "meta.llama3-70b-instruct-v1:0"
  }'
```

---

## 🔍 Descobrindo Formato de API

Se você não sabe o formato de API do novo vendor:

### 1. Consultar Documentação AWS

```bash
# Listar modelos disponíveis
aws bedrock list-foundation-models --region us-east-1

# Ver detalhes de um modelo
aws bedrock get-foundation-model \
  --model-identifier meta.llama3-70b-instruct-v1:0 \
  --region us-east-1
```

### 2. Consultar Documentação do Vendor

- **Anthropic:** https://docs.anthropic.com/claude/reference/messages-streaming
- **Cohere:** https://docs.cohere.com/reference/chat
- **Meta:** https://llama.meta.com/docs/model-cards-and-prompt-formats/

### 3. Testar Manualmente

```bash
# Teste direto com AWS CLI
aws bedrock-runtime invoke-model \
  --model-id meta.llama3-70b-instruct-v1:0 \
  --body '{"prompt": "Hello", "max_gen_len": 100}' \
  --region us-east-1 \
  output.json

cat output.json
```

### 4. Analisar Resposta

Observe:
- Estrutura do request body
- Nomes dos parâmetros (temperature, max_tokens, etc)
- Formato da resposta
- Como o streaming funciona

---

## 📊 Checklist de Validação

Antes de considerar o modelo pronto:

### Adapter
- [ ] Implementa [`BaseAdapter`](../backend/src/services/ai/adapters/base.adapter.ts)
- [ ] `formatRequest()` retorna formato correto
- [ ] `parseChunk()` processa streaming corretamente
- [ ] Trata erros adequadamente

### Registry
- [ ] Modelo registrado com todas as capabilities
- [ ] `modelId` correto (igual ao AWS)
- [ ] `vendor` correto (lowercase)
- [ ] `adapterClass` aponta para adapter correto
- [ ] `platformRules` definidas (se necessário)

### Testes
- [ ] Modelo aparece em `/api/providers/bedrock/available-models`
- [ ] Chat funciona com o modelo
- [ ] Streaming funciona corretamente
- [ ] Erros são tratados adequadamente

---

## 🚨 Problemas Comuns

### Problema 1: "Model not supported"

**Causa:** Modelo não está no registry

**Solução:**
```typescript
// Adicione no arquivo do vendor
ModelRegistry.registerMany([
  { modelId: 'seu-modelo-id', ... }
]);
```

### Problema 2: "Malformed input request"

**Causa:** Formato de API incorreto no adapter

**Solução:**
1. Consulte documentação do vendor
2. Teste manualmente com AWS CLI
3. Ajuste `formatRequest()` no adapter

### Problema 3: Streaming não funciona

**Causa:** `parseChunk()` não está processando corretamente

**Solução:**
```typescript
parseChunk(chunk: any) {
  console.log('Raw chunk:', JSON.stringify(chunk)); // Debug
  
  // Ajuste a lógica baseado no formato real
}
```

### Problema 4: Inference Profile Required

**Causa:** Modelo novo da Anthropic precisa de inference profile

**Solução:**
```typescript
platformRules: [
  {
    platform: 'bedrock',
    rule: 'requires_inference_profile',
  },
],
```

---

## 📚 Referências

- [Documentação AWS Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Arquitetura de Adapters](./ARCHITECTURE-MODEL-ADAPTERS.md)
- [Formatos de API](./AWS-BEDROCK-API-FORMATS.md)
- [Guia de Migração](./MIGRATION-GUIDE-ADAPTERS.md)

---

## 🎯 Resumo Rápido

### Modelo de Vendor Existente (2 min)
1. Edite [`backend/src/services/ai/registry/models/{vendor}.models.ts`](../backend/src/services/ai/registry/models/)
2. Adicione objeto no array
3. Reinicie backend

### Modelo de Novo Vendor (15 min)
1. Crie [`backend/src/services/ai/adapters/{vendor}.adapter.ts`](../backend/src/services/ai/adapters/)
2. Registre em [`adapter-factory.ts`](../backend/src/services/ai/adapters/adapter-factory.ts)
3. Crie [`backend/src/services/ai/registry/models/{vendor}.models.ts`](../backend/src/services/ai/registry/models/)
4. Registre em [`models/index.ts`](../backend/src/services/ai/registry/models/index.ts)
5. Reinicie backend

---

**Autor:** Kilo Code  
**Data:** 2026-01-16  
**Versão:** 1.0
