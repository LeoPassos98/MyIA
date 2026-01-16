# AWS Bedrock - Inference Profiles

## 🐛 Problema Identificado

Alguns modelos AWS Bedrock não podem ser invocados diretamente pelo `modelId`. Eles requerem o uso de **Inference Profiles** (perfis de inferência).

### Erro Recebido

```json
{
  "error": "Invocation of model ID anthropic.claude-haiku-4-5-20251001-v1:0 with on-demand throughput isn't supported. Retry your request with the ID or ARN of an inference profile that contains this model."
}
```

### Modelos Afetados

- `anthropic.claude-haiku-4-5-20251001-v1:0`
- `anthropic.claude-sonnet-4-20250514-v1:0`
- Outros modelos cross-region

---

## 📚 O Que São Inference Profiles?

Inference Profiles são endpoints da AWS que permitem:
- **Cross-region inference**: Usar modelos de outras regiões
- **Failover automático**: Se uma região falha, usa outra
- **Load balancing**: Distribui carga entre regiões

### Tipos de Inference Profiles

1. **Application Inference Profile**: Específico para sua aplicação
2. **System-defined Inference Profile**: Pré-definido pela AWS

---

## 🔧 Solução

### Opção 1: Usar System-defined Inference Profiles

A AWS fornece perfis pré-definidos que podem ser usados:

```
us.anthropic.claude-haiku-4-5-20251001-v1:0
us.anthropic.claude-sonnet-4-20250514-v1:0
eu.anthropic.claude-haiku-4-5-20251001-v1:0
```

**Formato**: `{region-prefix}.{model-id}`

### Opção 2: Criar Application Inference Profile

Via AWS Console ou CLI:

```bash
aws bedrock create-inference-profile \
  --inference-profile-name my-claude-haiku \
  --model-source modelArn=arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0
```

---

## ✅ Implementação no Código

### 1. Detectar Modelos que Precisam de Inference Profile

```typescript
// backend/src/services/ai/providers/bedrock.ts

const REQUIRES_INFERENCE_PROFILE = [
  'anthropic.claude-haiku-4-5-20251001-v1:0',
  'anthropic.claude-sonnet-4-20250514-v1:0',
  'amazon.nova-2-lite-v1:0',
  'amazon.nova-2-lite-v1:0:256k'
];

function getInferenceProfileId(modelId: string, region: string): string {
  if (REQUIRES_INFERENCE_PROFILE.includes(modelId)) {
    // Usar system-defined inference profile
    const regionPrefix = region.split('-')[0]; // 'us' de 'us-east-1'
    return `${regionPrefix}.${modelId}`;
  }
  return modelId;
}
```

### 2. Usar no BedrockProvider

```typescript
async *streamChat(messages: any[], options: AIRequestOptions) {
  const modelId = getInferenceProfileId(options.modelId, this.region);
  
  const command = new InvokeModelWithResponseStreamCommand({
    modelId, // Usa inference profile se necessário
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });
  
  // ...
}
```

---

## 🎯 Solução Recomendada

### Para Modelos Novos (Cross-region)

1. **Filtrar na seleção**: Mostrar apenas modelos que funcionam na região do usuário
2. **Usar inference profiles**: Automaticamente usar o perfil correto
3. **Feedback ao usuário**: Avisar se o modelo não está disponível na região

### Código de Filtragem

```typescript
// backend/src/controllers/providersController.ts

async getAvailableModels(req: AuthRequest, res: Response) {
  // ... buscar modelos da AWS ...
  
  // Filtrar apenas modelos compatíveis com a região
  const compatibleModels = chatModels.filter(model => {
    // Modelos que precisam de inference profile
    if (REQUIRES_INFERENCE_PROFILE.includes(model.apiModelId)) {
      // Verificar se há inference profile disponível
      return hasInferenceProfile(model.apiModelId, region);
    }
    return true;
  });
  
  return res.json(jsend.success({
    models: compatibleModels,
    totalCount: compatibleModels.length,
    region
  }));
}
```

---

## 📝 Próximos Passos

1. ✅ Identificar modelos que precisam de inference profile
2. ⏳ Implementar lógica de detecção automática
3. ⏳ Usar inference profiles no BedrockProvider
4. ⏳ Adicionar validação na seleção de modelos
5. ⏳ Documentar modelos disponíveis por região

---

## 🔗 Referências

- [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html)
- [Cross-region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [Model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)

---

**Documento criado em**: 2026-01-16  
**Versão**: 1.0  
**Status**: 🔴 Problema Identificado - Solução Pendente
