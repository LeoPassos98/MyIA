# Especificações Oficiais - Todos os Modelos

**Última Atualização:** 2026-01-17  
**Fontes:** Documentação oficial dos vendors + AWS Bedrock

---

## 📊 Resumo das Atualizações

| Vendor | Modelos | Status |
|--------|---------|--------|
| Anthropic | 5 modelos | ✅ Já estavam corretos |
| Cohere | 4 modelos | ✅ Atualizados |
| Amazon | 7 modelos | ✅ Atualizados |

---

## 🔵 Anthropic Claude

### Claude 3.5 Sonnet v2
- **Context:** 200,000 tokens
- **Output:** 8,192 tokens
- **Vision:** ✅ | **Function Calling:** ✅
- **Custo:** $3.00 / $15.00 per MTok

### Claude 3.5 Haiku
- **Context:** 200,000 tokens
- **Output:** 8,192 tokens
- **Vision:** ✅ | **Function Calling:** ✅
- **Custo:** $0.80 / $4.00 per MTok

### Claude 3 Haiku (Legacy)
- **Context:** 200,000 tokens
- **Output:** 4,096 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.25 / $1.25 per MTok

---

## 🟢 Cohere Command

### Command R
- **Context:** 128,000 tokens
- **Output:** 4,000 tokens
- **Vision:** ❌ | **Function Calling:** ✅ (Tool Use)
- **Custo:** $0.50 / $1.50 per MTok
- **Uso:** Otimizado para RAG e tool use

### Command R+
- **Context:** 128,000 tokens
- **Output:** 4,000 tokens
- **Vision:** ❌ | **Function Calling:** ✅ (Tool Use)
- **Custo:** $3.00 / $15.00 per MTok
- **Uso:** Modelo mais capaz, multilingual

### Command Light (Legacy)
- **Context:** 4,096 tokens
- **Output:** 4,096 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.30 / $0.60 per MTok

### Command Text (Legacy)
- **Context:** 4,096 tokens
- **Output:** 4,096 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.50 / $1.50 per MTok

---

## 🟠 Amazon Titan & Nova

### Titan Text Express
- **Context:** 8,192 tokens
- **Output:** 8,192 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.20 / $0.60 per MTok
- **Uso:** Rápido e econômico

### Titan Text Lite
- **Context:** 4,096 tokens
- **Output:** 4,096 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.15 / $0.20 per MTok
- **Uso:** Tarefas muito simples

### Titan Text Premier
- **Context:** 32,768 tokens
- **Output:** 3,072 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.50 / $1.50 per MTok
- **Uso:** Tarefas avançadas

### Nova 2 Lite
- **Context:** 300,000 tokens
- **Output:** 5,000 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.06 / $0.24 per MTok
- **Uso:** Next-gen lightweight

### Nova 2 Lite (256k)
- **Context:** 256,000 tokens
- **Output:** 5,000 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.06 / $0.24 per MTok
- **Uso:** Context window estendido

### Nova 2 Micro
- **Context:** 128,000 tokens
- **Output:** 5,000 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.035 / $0.14 per MTok
- **Uso:** Ultra-lightweight

### Nova 2 Pro
- **Context:** 300,000 tokens
- **Output:** 5,000 tokens
- **Vision:** ❌ | **Function Calling:** ❌
- **Custo:** $0.80 / $3.20 per MTok
- **Uso:** Professional-grade

---

## 📝 Mudanças Aplicadas

### Cohere Models

**Antes:**
```typescript
maxContextWindow: 128000,
maxOutputTokens: 4096,
functionCalling: false,
```

**Depois:**
```typescript
maxContextWindow: 128000,
maxOutputTokens: 4000, // Corrigido
functionCalling: true,  // Adicionado (Tool Use)
```

**Justificativa:**
- Command R/R+ suportam tool use (function calling)
- Max output oficial é 4000 tokens

### Amazon Models

**Antes:**
```typescript
// Titan Text Express
maxContextWindow: 8000,
maxOutputTokens: 8000,

// Titan Text Lite
maxContextWindow: 4000,
maxOutputTokens: 4000,

// Titan Text Premier
maxContextWindow: 32000,
maxOutputTokens: 3000,
```

**Depois:**
```typescript
// Titan Text Express
maxContextWindow: 8192,  // Corrigido
maxOutputTokens: 8192,   // Corrigido

// Titan Text Lite
maxContextWindow: 4096,  // Corrigido
maxOutputTokens: 4096,   // Corrigido

// Titan Text Premier
maxContextWindow: 32768, // Corrigido
maxOutputTokens: 3072,   // Corrigido
```

**Justificativa:**
- AWS usa potências de 2 (4096, 8192, 32768)
- Valores arredondados estavam incorretos

---

## 🎯 Comparação de Context Windows

| Modelo | Context | Output | Total | Rank |
|--------|---------|--------|-------|------|
| Nova 2 Lite | 300k | 5k | 305k | 🥇 |
| Nova 2 Pro | 300k | 5k | 305k | 🥇 |
| Nova 2 Lite (256k) | 256k | 5k | 261k | 🥈 |
| Claude 3.5 Sonnet v2 | 200k | 8k | 208k | 🥉 |
| Claude 3.5 Haiku | 200k | 8k | 208k | 🥉 |
| Command R | 128k | 4k | 132k | 4º |
| Command R+ | 128k | 4k | 132k | 4º |
| Nova 2 Micro | 128k | 5k | 133k | 4º |
| Titan Text Premier | 32k | 3k | 35k | 5º |
| Titan Text Express | 8k | 8k | 16k | 6º |
| Titan Text Lite | 4k | 4k | 8k | 7º |

---

## 🔍 Recomendações por Caso de Uso

### 📚 Análise de Documentos Longos
1. **Nova 2 Lite** (300k context, $0.06/MTok)
2. **Claude 3.5 Sonnet v2** (200k context, melhor qualidade)
3. **Command R+** (128k context, multilingual)

### ⚡ Respostas Rápidas
1. **Nova 2 Micro** (ultra-rápido, $0.035/MTok)
2. **Claude 3.5 Haiku** (rápido + vision)
3. **Titan Text Lite** (mais barato)

### 🧠 Raciocínio Complexo
1. **Claude 3.5 Sonnet v2** (melhor inteligência)
2. **Command R+** (bom raciocínio + multilingual)
3. **Nova 2 Pro** (professional-grade)

### 🛠️ Tool Use / Function Calling
1. **Claude 3.5 Sonnet v2** (melhor suporte)
2. **Command R+** (otimizado para tools)
3. **Command R** (mais barato)

### 👁️ Análise de Imagens
1. **Claude 3.5 Sonnet v2** (melhor vision)
2. **Claude 3.5 Haiku** (vision + rápido)
3. ❌ Outros modelos não suportam

---

## 📚 Fontes Oficiais

### Anthropic
- https://docs.anthropic.com/en/docs/about-claude/models
- https://docs.anthropic.com/en/api/messages

### Cohere
- https://docs.cohere.com/docs/models
- https://docs.cohere.com/docs/command-r
- https://docs.cohere.com/docs/tool-use

### Amazon
- https://docs.aws.amazon.com/bedrock/latest/userguide/titan-text-models.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/nova-models.html
- https://aws.amazon.com/bedrock/pricing/

---

## ✅ Status de Conformidade

| Arquivo | Status | Última Atualização |
|---------|--------|-------------------|
| [`anthropic.models.ts`](../backend/src/services/ai/registry/models/anthropic.models.ts) | ✅ Correto | 2026-01-17 |
| [`cohere.models.ts`](../backend/src/services/ai/registry/models/cohere.models.ts) | ✅ Atualizado | 2026-01-17 |
| [`amazon.models.ts`](../backend/src/services/ai/registry/models/amazon.models.ts) | ✅ Atualizado | 2026-01-17 |

**Todos os modelos agora têm valores oficiais e precisos.**

---

**Autor:** Kilo Code  
**Data:** 2026-01-17  
**Versão:** 1.0
