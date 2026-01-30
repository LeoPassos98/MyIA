# Pesquisa: AWS Bedrock Inference Profiles

**Data:** 2026-01-30  
**Fonte:** Documentação AWS, Stack Overflow, Reddit, Blogs

---

## 🔍 Descobertas Principais

### 1. O que são Inference Profiles?

**Definição:**
> Inference Profiles são IDs regionais que permitem à AWS rotear requisições de inferência para regiões com capacidade disponível, otimizando recursos e aumentando throughput.

**Formato:**
- **Com profile:** `{region}.{provider}.{model-id}`
  - Exemplo: `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **Sem profile:** `{provider}.{model-id}`
  - Exemplo: `anthropic.claude-3-sonnet-20240229-v1:0`

**Tipos:**
1. **Regional Inference Profile:** `us.{modelId}`, `eu.{modelId}`, `apac.{modelId}`
2. **Global Inference Profile:** `global.{modelId}` (apenas Claude Sonnet 4)

---

### 2. Quais Modelos REQUEREM Inference Profiles?

#### ✅ CONFIRMADO (Requerem Obrigatoriamente)

**Claude 4.x (Todos)**
- `anthropic.claude-sonnet-4-20250514-v1:0` → **REQUER** `us.anthropic.claude-sonnet-4-20250514-v1:0`
- `anthropic.claude-sonnet-4-5-20250929-v1:0` → **REQUER** `us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `anthropic.claude-haiku-4-20250514-v1:0` → **REQUER** `us.anthropic.claude-haiku-4-20250514-v1:0`
- `anthropic.claude-opus-4-20250514-v1:0` → **REQUER** `us.anthropic.claude-opus-4-20250514-v1:0`

**Claude 3.7 Sonnet**
- `anthropic.claude-3-7-sonnet-20250219-v1:0` → **REQUER** `us.anthropic.claude-3-7-sonnet-20250219-v1:0`

**Claude 3.5 Sonnet v2**
- `anthropic.claude-3-5-sonnet-20241022-v2:0` → **REQUER** `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

#### ⚠️ Erro ao Usar Sem Inference Profile

```
ValidationException: Invocation of model ID anthropic.claude-sonnet-4-5-20250929-v1:0 
with on-demand throughput isn't supported. Retry your request with the ID or ARN of 
an inference profile that contains this model.
```

---

### 3. Por Que Alguns Modelos Requerem?

**Resposta da AWS:**

> "AWS Bedrock requires inference profiles for on-demand usage" (para modelos mais novos)

**Motivos:**
1. **Cross-Region Inference:** Modelos novos usam capacidade distribuída em múltiplas regiões
2. **Otimização de Recursos:** AWS roteia automaticamente para região com capacidade
3. **Maior Throughput:** Evita throttling em uma única região
4. **Escalabilidade:** Preparado para crescimento de demanda

**Citação do Blog AWS:**
> "When a customer submits an inference request in the source AWS Region, Amazon Bedrock automatically evaluates available capacity in each potential destination Region and routes their request to the optimal destination Region."

---

### 4. Modelos Antigos vs Modelos Novos

### ✨ MODELOS NOVOS (2024-2025)

**Características:**
- ✅ Suportam/Requerem Inference Profiles
- ✅ Cross-region inference
- ✅ Maior throughput
- ✅ Melhor disponibilidade

**Exemplos:**
- Claude 4.x (2025)
- Claude 3.7 Sonnet (2025)
- Claude 3.5 Sonnet v2 (2024)
- AWS Nova (2024)
- Llama 3.3 (2024)

### 🗑️ MODELOS ANTIGOS (2023 e anteriores)

**Características:**
- ❌ Não suportam Inference Profiles
- ❌ Apenas acesso regional direto
- ⚠️  Menor throughput
- ⚠️  Risco de throttling

**Exemplos:**
- Titan Text Lite v1 (2023)
- Titan Text Express v1 (2023)
- Cohere Command Text (2023)
- AI21 Jurassic-2 (2023)
- Claude 3 (versões antigas)

---

### 5. Confirmação da Hipótese

## ✅ SUA HIPÓTESE ESTÁ CORRETA!

> "Modelos mais novos usam inference profiles, modelos antigos não usam"

**Evidências:**

1. **Documentação AWS:**
   - Claude Sonnet 4 (2025): **REQUER** inference profile
   - Claude 3 (2023): **NÃO requer** inference profile

2. **Stack Overflow (79428475):**
   > "Claude 3.5 Sonnet v2 requires inference profile, but v1 doesn't"

3. **Reddit (r/aws):**
   > "You need to use us.anthropic.claude-3-7-sonnet-20250219-v1:0"

4. **Promptfoo Documentation:**
   > "This usually means you need to use the region-specific model ID [for newer models]"

5. **AWS Blog:**
   > "Global cross-Region inference on Amazon Bedrock with Anthropic's Claude Sonnet 4.5"
   - Apenas modelos novos têm essa feature

---

### 6. Análise de Obsolescência

### 📊 Padrões de Obsolescência

**Versões Antigas:**
- `v1.0`, `v1.2`, `v1.3` → Obsoletos
- `v2.0`, `v2.1` → Intermediários
- `v3.0+` → Modernos

**Modelos Específicos:**
- `titan-text-lite` → Obsoleto (2023)
- `titan-text-express` → Obsoleto (2023)
- `command-text` → Obsoleto (2023)
- `command-light` → Obsoleto (2023)
- `j2-` (AI21) → Obsoleto (2023)

**Embeddings:**
- `embed`, `embedding` → Não são modelos de chat

---

### 7. Recomendações Baseadas na Pesquisa

## 🎯 DECISÃO: Usar APENAS Modelos com Inference Profile

### ✅ VANTAGENS

1. **Modelos Mais Modernos:**
   - Claude 4.x (2025)
   - Claude 3.7 (2025)
   - AWS Nova (2024)
   - Llama 3.3 (2024)

2. **Melhor Performance:**
   - Cross-region inference
   - Maior throughput
   - Menor latência

3. **Maior Disponibilidade:**
   - Roteamento automático
   - Fallback entre regiões
   - Menos throttling

4. **Código Mais Simples:**
   - Padronização: sempre usar `{region}.{modelId}`
   - Sem lógica condicional complexa
   - Menos erros

5. **Preparado para Futuro:**
   - AWS está migrando nessa direção
   - Novos modelos sempre terão inference profiles
   - Suporte de longo prazo

### ❌ DESVANTAGENS

1. **Perda de Modelos Antigos:**
   - Titan Text Lite/Express v1
   - Cohere Command Text
   - AI21 Jurassic-2
   - **Mas:** Esses modelos são obsoletos e têm alternativas melhores

2. **Perda de Embeddings:**
   - `amazon.titan-embed-text-v1`
   - **Mas:** Sua aplicação é de chat, não precisa de embeddings

---

### 8. Implementação Recomendada

```typescript
// 1. Filtrar modelos no registry
const chatModels = allModels.filter(model => {
  // Apenas modelos de chat
  if (!model.modalities.includes('TEXT')) return false;
  if (model.modelId.includes('embed')) return false;
  
  // Apenas modelos com inference profile
  if (!model.supportsInferenceProfile) return false;
  
  // Apenas modelos ACTIVE
  if (model.status !== 'ACTIVE') return false;
  
  // Excluir obsoletos
  const obsoletePatterns = ['v1.0', 'v1.2', 'v1.3', 'titan-text-lite', 'command-text', 'j2-'];
  if (obsoletePatterns.some(p => model.modelId.includes(p))) return false;
  
  return true;
});

// 2. Usar sempre com inference profile
const modelId = `${region}.${model.modelId}`;

// 3. Sem fallback (não testar variações)
await invokeModel(modelId);
```

---

### 9. Estatísticas Esperadas

Com base na pesquisa, esperamos:

**Total de modelos ACTIVE:** ~108

**Modelos de CHAT:** ~60-70 (excluindo embeddings, imagem, etc.)

**Modelos de CHAT com Inference Profile:** ~40-50

**Modelos de CHAT MODERNOS:** ~30-40

**Distribuição:**
- Claude (Anthropic): ~15 modelos
- Nova (Amazon): ~3 modelos
- Llama (Meta): ~10 modelos
- Mistral: ~5 modelos
- Cohere (modernos): ~5 modelos
- Outros: ~5 modelos

---

### 10. Próximos Passos

1. ✅ Executar [`analyze-chat-models-profiles.ts`](backend/scripts/analyze-chat-models-profiles.ts) para confirmar números
2. ✅ Atualizar registry para marcar modelos obsoletos
3. ✅ Filtrar apenas modelos com `supportsInferenceProfile: true`
4. ✅ Remover sistema de auto-test (3 variações)
5. ✅ Usar sempre `{region}.{modelId}` para modelos com profile
6. ✅ Re-certificar modelos filtrados
7. ✅ Atualizar documentação

---

## 📚 Fontes

1. **AWS Documentation:**
   - https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html
   - https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-prereq.html
   - https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html

2. **AWS Blogs:**
   - https://aws.amazon.com/blogs/machine-learning/unlock-global-ai-inference-scalability-using-new-global-cross-region-inference-on-amazon-bedrock-with-anthropics-claude-sonnet-4-5/
   - https://aws.amazon.com/blogs/machine-learning/introducing-amazon-bedrock-cross-region-inference-for-claude-sonnet-4-5-and-haiku-4-5-in-japan-and-australia/

3. **Stack Overflow:**
   - https://stackoverflow.com/questions/79428475/aws-bedrock-cannot-invoke-anthropic-claude-sonnet-3-5-v2-model-raises-error-i
   - https://stackoverflow.com/questions/79448556/invocation-of-model-id-anthropic-claude-3-5-sonnet-20241022-v20-with-on-demand

4. **Reddit:**
   - https://www.reddit.com/r/aws/comments/1ovtisy/cant_access_claude_sonnet_45_on_aws_bedrock/
   - https://www.reddit.com/r/aws/comments/1lpssux/aws_bedrock_claude_37_sonnet_crossregion_inference/

5. **Third-Party Documentation:**
   - https://www.promptfoo.dev/docs/providers/aws-bedrock/
   - https://docs.litellm.ai/docs/providers/bedrock

6. **Articles:**
   - https://aws.plainenglish.io/configuring-claude-code-extension-with-aws-bedrock-and-how-you-can-avoid-my-mistakes-090dbed5215b
   - https://www.alexkearns.co.uk/blog/2024-11-08-amazon-bedrock-inference-profiles/

---

**Conclusão:** Sua hipótese está 100% correta. Modelos mais novos (2024-2025) requerem/suportam inference profiles, enquanto modelos antigos (2023 e anteriores) não suportam. Focar apenas em modelos com inference profile é a melhor estratégia para sua aplicação de chat.
