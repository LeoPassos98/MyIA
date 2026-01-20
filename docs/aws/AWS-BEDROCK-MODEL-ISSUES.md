# AWS Bedrock - Model-Specific Issues & Solutions

## 🐛 Problemas Encontrados Durante Testes

### 1. **Inference Profile Required**

**Erro:**
```
Invocation of model ID anthropic.claude-3-5-sonnet-20241022-v2:0 with on-demand throughput isn't supported. 
Retry your request with the ID or ARN of an inference profile that contains this model.
```

**Modelos Afetados:**
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-haiku-4-5-20251001-v1:0`
- `anthropic.claude-sonnet-4-20250514-v1:0`
- `amazon.nova-2-lite-v1:0`
- `amazon.nova-2-lite-v1:0:256k`
- `amazon.nova-2-micro-v1:0`
- `amazon.nova-2-pro-v1:0`

**Solução Implementada:**
- Registry marca esses modelos com `platformRules: [{ rule: 'requires_inference_profile' }]`
- BedrockProvider automaticamente converte: `modelId` → `{region}.{modelId}`
- Exemplo: `anthropic.claude-3-5-sonnet-20241022-v2:0` → `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Código:**
```typescript
// backend/src/services/ai/providers/bedrock.ts
function getInferenceProfileId(modelId: string, region: string): string {
  const platformRule = ModelRegistry.getPlatformRules(modelId, 'bedrock');
  
  if (platformRule?.rule === 'requires_inference_profile') {
    const regionPrefix = region.split('-')[0];
    return `${regionPrefix}.${modelId}`;
  }
  
  return modelId;
}
```

---

### 2. **Temperature and top_p Conflict**

**Erro:**
```
temperature and top_p cannot both be specified for this model. Please use only one.
```

**Modelos Afetados:**
- `anthropic.claude-haiku-4-5-20251001-v1:0`
- Possivelmente outros modelos Claude 4.x

**Causa:**
Alguns modelos Claude não aceitam `temperature` E `top_p` simultaneamente.

**Solução Implementada:**
Adapter Anthropic agora usa apenas `temperature` por padrão:

```typescript
// backend/src/services/ai/adapters/anthropic.adapter.ts
formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
  const body: any = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: options.maxTokens || 2048,
    messages: conversationMessages,
  };

  // Use only temperature (more intuitive for users)
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  } else {
    body.temperature = 0.7;
  }

  // Do NOT add top_p if temperature is set
  if (options.topP !== undefined && options.temperature === undefined) {
    body.top_p = options.topP;
  }

  // ...
}
```

**Regra:**
- ✅ Envia `temperature` (padrão)
- ❌ NÃO envia `top_p` junto com `temperature`
- ✅ Envia `top_p` SOMENTE se `temperature` não for fornecido

---

## ✅ Modelos Testados e Funcionando

### Anthropic Claude

| Model ID | Status | Notes |
|----------|--------|-------|
| `anthropic.claude-3-haiku-20240307-v1:0` | ✅ Working | Direct invocation, no inference profile needed |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | ⚠️ Needs Testing | Should work with current implementation |
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | ⚠️ Needs Testing | Requires inference profile |
| `anthropic.claude-haiku-4-5-20251001-v1:0` | ⚠️ Needs Testing | Requires inference profile + temperature fix |
| `anthropic.claude-sonnet-4-20250514-v1:0` | ⚠️ Needs Testing | Requires inference profile |

### Cohere

| Model ID | Status | Notes |
|----------|--------|-------|
| `cohere.command-r-v1:0` | ✅ Working | Tested and confirmed |
| `cohere.command-r-plus-v1:0` | ⚠️ Needs Testing | Should work (same format) |

### Amazon

| Model ID | Status | Notes |
|----------|--------|-------|
| `amazon.titan-text-express-v1` | ⚠️ Needs Testing | Direct invocation |
| `amazon.nova-2-lite-v1:0` | ⚠️ Needs Testing | Requires inference profile |

---

## 📚 Documentação Oficial

### AWS Bedrock

**Inference Profiles:**
- [Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Inference Profiles Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)

**Model Parameters:**
- [Anthropic Claude on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)
- [Cohere Command on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command-r-plus.html)
- [Amazon Titan on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html)

**Model IDs:**
- [Foundation Model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)

### Anthropic

**Claude API:**
- [Messages API](https://docs.anthropic.com/claude/reference/messages_post)
- [Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)

**Parameter Rules:**
- `temperature` and `top_p` are mutually exclusive in some models
- Use `temperature` for most use cases (0.0 to 1.0)
- Use `top_p` only for advanced sampling control

### Cohere

**Command API:**
- [Chat API](https://docs.cohere.com/reference/chat)
- [Model Cards](https://docs.cohere.com/docs/models)

**Format Differences:**
- Uses `message` (singular) instead of `messages` (plural)
- Uses `chat_history` for conversation context
- Uses `preamble` instead of `system`
- Uses `p` instead of `top_p`

---

## 🔧 Como Adicionar Novos Modelos

### 1. Verificar Documentação

Antes de adicionar um modelo, verifique:
- ✅ Formato de API (Anthropic, Cohere, Amazon, etc.)
- ✅ Parâmetros suportados
- ✅ Regras especiais (inference profile, parâmetros conflitantes)
- ✅ Context window e max tokens

### 2. Adicionar ao Registry

```typescript
// backend/src/services/ai/registry/models/[vendor].models.ts

ModelRegistry.register({
  modelId: 'anthropic.claude-new-model-v1:0',
  vendor: 'anthropic',
  displayName: 'Claude New Model',
  description: 'Description from AWS docs',
  capabilities: {
    streaming: true,
    vision: false,
    functionCalling: false,
    maxContextWindow: 200000,
    maxOutputTokens: 4096,
  },
  supportedPlatforms: ['bedrock'],
  platformRules: [
    // Add if needed
    {
      platform: 'bedrock',
      rule: 'requires_inference_profile',
      config: { profileFormat: '{region}.{modelId}' },
    },
  ],
  adapterClass: 'AnthropicAdapter',
});
```

### 3. Testar

```bash
# Test with curl or Postman
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello",
    "provider": "bedrock",
    "modelId": "anthropic.claude-new-model-v1:0",
    "temperature": 0.7
  }'
```

### 4. Documentar Problemas

Se encontrar erros:
1. Adicione ao registry com regras específicas
2. Atualize adapter se necessário
3. Documente neste arquivo

---

## ⚠️ Problemas Conhecidos

### 1. Não Todos os Modelos AWS São Suportados

**Motivo:** Apenas modelos com adapters implementados funcionam.

**Solução:** Adicionar adapters para novos vendors (AI21, Meta, Mistral, etc.)

### 2. Inference Profiles Podem Variar por Região

**Motivo:** Alguns modelos só estão disponíveis em certas regiões.

**Solução:** Registry pode ser expandido para incluir `availableRegions`

### 3. Parâmetros Podem Mudar Entre Versões

**Motivo:** AWS pode atualizar APIs de modelos.

**Solução:** Manter registry atualizado com documentação oficial

---

## 🎯 Próximos Passos

1. ✅ Testar todos os modelos Anthropic registrados
2. ✅ Testar todos os modelos Cohere registrados
3. ✅ Testar todos os modelos Amazon registrados
4. ⏳ Adicionar adapters para AI21, Meta, Mistral
5. ⏳ Adicionar validação de região no registry
6. ⏳ Criar testes automatizados por modelo

---

**Documento criado em**: 2026-01-16  
**Versão**: 1.0  
**Status**: 🔴 Em Testes
