# Análise de Inference Profiles - AWS Bedrock

**Data da Análise:** 2026-01-30T12:39:00.806Z

## 📊 Resumo Executivo

- **Total de modelos analisados:** 108
- **Modelos que REQUEREM Inference Profile:** 6
- **Modelos que SUPORTAM Inference Profile:** 41
- **Modelos que NÃO precisam:** 67

---

## 🔴 Modelos que REQUEREM Inference Profile


### anthropic.claude-sonnet-4-20250514-v1:0

- **Provider:** Anthropic
- **Nome:** Claude Sonnet 4
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


### anthropic.claude-haiku-4-5-20251001-v1:0

- **Provider:** Anthropic
- **Nome:** Claude Haiku 4.5
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


### anthropic.claude-sonnet-4-5-20250929-v1:0

- **Provider:** Anthropic
- **Nome:** Claude Sonnet 4.5
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


### anthropic.claude-opus-4-1-20250805-v1:0

- **Provider:** Anthropic
- **Nome:** Claude Opus 4.1
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


### anthropic.claude-opus-4-5-20251101-v1:0

- **Provider:** Anthropic
- **Nome:** Claude Opus 4.5
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


### anthropic.claude-3-5-haiku-20241022-v1:0

- **Provider:** Anthropic
- **Nome:** Claude 3.5 Haiku
- **Inference Types:** INFERENCE_PROFILE
- **Resultado do Teste:** REQUIRES_PROFILE


---

## 🟡 Modelos que SUPORTAM Inference Profile (mas não requerem)

- stability.stable-creative-upscale-v1:0 (Stability AI)
- stability.stable-image-remove-background-v1:0 (Stability AI)
- stability.stable-image-control-sketch-v1:0 (Stability AI)
- stability.stable-conservative-upscale-v1:0 (Stability AI)
- stability.stable-image-search-recolor-v1:0 (Stability AI)
- stability.stable-fast-upscale-v1:0 (Stability AI)
- stability.stable-image-erase-object-v1:0 (Stability AI)
- stability.stable-image-control-structure-v1:0 (Stability AI)
- stability.stable-outpaint-v1:0 (Stability AI)
- stability.stable-image-inpaint-v1:0 (Stability AI)
- stability.stable-image-style-guide-v1:0 (Stability AI)
- stability.stable-style-transfer-v1:0 (Stability AI)
- stability.stable-image-search-replace-v1:0 (Stability AI)
- amazon.nova-pro-v1:0 (Amazon)
- amazon.nova-2-lite-v1:0 (Amazon)
- amazon.nova-premier-v1:0 (Amazon)
- amazon.nova-lite-v1:0 (Amazon)
- amazon.nova-micro-v1:0 (Amazon)
- mistral.pixtral-large-2502-v1:0 (Mistral AI)
- twelvelabs.pegasus-1-2-v1:0 (TwelveLabs)
- twelvelabs.marengo-embed-3-0-v1:0 (TwelveLabs)
- twelvelabs.marengo-embed-2-7-v1:0 (TwelveLabs)
- writer.palmyra-x5-v1:0 (Writer)
- writer.palmyra-x4-v1:0 (Writer)
- cohere.embed-v4:0 (Cohere)
- deepseek.r1-v1:0 (DeepSeek)
- meta.llama3-1-8b-instruct-v1:0 (Meta)
- meta.llama3-1-70b-instruct-v1:0 (Meta)
- meta.llama3-2-11b-instruct-v1:0 (Meta)
- meta.llama3-2-90b-instruct-v1:0 (Meta)
- meta.llama3-2-1b-instruct-v1:0 (Meta)
- meta.llama3-2-3b-instruct-v1:0 (Meta)
- meta.llama3-3-70b-instruct-v1:0 (Meta)
- meta.llama4-scout-17b-instruct-v1:0 (Meta)
- meta.llama4-maverick-17b-instruct-v1:0 (Meta)

---

## 📋 Análise por Provider


### NVIDIA

- **Total de modelos:** 3
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `nvidia.nemotron-nano-12b-v2` - NVIDIA Nemotron Nano 12B v2 VL BF16
- ✅ `nvidia.nemotron-nano-3-30b` - Nemotron Nano 3 30B
- ✅ `nvidia.nemotron-nano-9b-v2` - NVIDIA Nemotron Nano 9B v2


### Anthropic

- **Total de modelos:** 9
- **Requerem Profile:** 6
- **Suportam Profile:** 6

**Modelos:**
- 🔴 `anthropic.claude-sonnet-4-20250514-v1:0` - Claude Sonnet 4
- 🔴 `anthropic.claude-haiku-4-5-20251001-v1:0` - Claude Haiku 4.5
- 🔴 `anthropic.claude-sonnet-4-5-20250929-v1:0` - Claude Sonnet 4.5
- 🔴 `anthropic.claude-opus-4-1-20250805-v1:0` - Claude Opus 4.1
- 🔴 `anthropic.claude-opus-4-5-20251101-v1:0` - Claude Opus 4.5
- ✅ `anthropic.claude-3-haiku-20240307-v1:0:48k` - Claude 3 Haiku
- ✅ `anthropic.claude-3-haiku-20240307-v1:0:200k` - Claude 3 Haiku
- ✅ `anthropic.claude-3-haiku-20240307-v1:0` - Claude 3 Haiku
- 🔴 `anthropic.claude-3-5-haiku-20241022-v1:0` - Claude 3.5 Haiku


### OpenAI

- **Total de modelos:** 4
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `openai.gpt-oss-120b-1:0` - gpt-oss-120b
- ✅ `openai.gpt-oss-20b-1:0` - gpt-oss-20b
- ✅ `openai.gpt-oss-safeguard-120b` - GPT OSS Safeguard 120B
- ✅ `openai.gpt-oss-safeguard-20b` - GPT OSS Safeguard 20B


### Stability AI

- **Total de modelos:** 13
- **Requerem Profile:** 0
- **Suportam Profile:** 13

**Modelos:**
- 🟡 `stability.stable-creative-upscale-v1:0` - Stable Image Creative Upscale
- 🟡 `stability.stable-image-remove-background-v1:0` - Stable Image Remove Background
- 🟡 `stability.stable-image-control-sketch-v1:0` - Stable Image Control Sketch
- 🟡 `stability.stable-conservative-upscale-v1:0` - Stable Image Conservative Upscale
- 🟡 `stability.stable-image-search-recolor-v1:0` - Stable Image Search and Recolor
- 🟡 `stability.stable-fast-upscale-v1:0` - Stable Image Fast Upscale
- 🟡 `stability.stable-image-erase-object-v1:0` - Stable Image Erase Object
- 🟡 `stability.stable-image-control-structure-v1:0` - Stable Image Control Structure
- 🟡 `stability.stable-outpaint-v1:0` - Stable Image Outpaint
- 🟡 `stability.stable-image-inpaint-v1:0` - Stable Image Inpaint
- 🟡 `stability.stable-image-style-guide-v1:0` - Stable Image Style Guide
- 🟡 `stability.stable-style-transfer-v1:0` - Stable Image Style Transfer
- 🟡 `stability.stable-image-search-replace-v1:0` - Stable Image Search and Replace


### Qwen

- **Total de modelos:** 4
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `qwen.qwen3-next-80b-a3b` - Qwen3 Next 80B A3B
- ✅ `qwen.qwen3-32b-v1:0` - Qwen3 32B (dense)
- ✅ `qwen.qwen3-vl-235b-a22b` - Qwen3 VL 235B A22B
- ✅ `qwen.qwen3-coder-30b-a3b-v1:0` - Qwen3-Coder-30B-A3B-Instruct


### Amazon

- **Total de modelos:** 31
- **Requerem Profile:** 0
- **Suportam Profile:** 5

**Modelos:**
- ✅ `amazon.nova-2-multimodal-embeddings-v1:0` - Amazon Nova Multimodal Embeddings
- 🟡 `amazon.nova-pro-v1:0` - Nova Pro
- 🟡 `amazon.nova-2-lite-v1:0` - Nova 2 Lite
- ✅ `amazon.nova-2-lite-v1:0:256k` - Nova 2 Lite
- ✅ `amazon.nova-2-sonic-v1:0` - Nova 2 Sonic
- ✅ `amazon.titan-tg1-large` - Titan Text Large
- ✅ `amazon.titan-image-generator-v2:0` - Titan Image Generator G1 v2
- ✅ `amazon.nova-premier-v1:0:8k` - Nova Premier
- ✅ `amazon.nova-premier-v1:0:20k` - Nova Premier
- ✅ `amazon.nova-premier-v1:0:1000k` - Nova Premier
- ✅ `amazon.nova-premier-v1:0:mm` - Nova Premier
- 🟡 `amazon.nova-premier-v1:0` - Nova Premier
- ✅ `amazon.nova-pro-v1:0:24k` - Nova Pro
- ✅ `amazon.nova-pro-v1:0:300k` - Nova Pro
- ✅ `amazon.nova-lite-v1:0:24k` - Nova Lite
- ✅ `amazon.nova-lite-v1:0:300k` - Nova Lite
- 🟡 `amazon.nova-lite-v1:0` - Nova Lite
- ✅ `amazon.nova-canvas-v1:0` - Nova Canvas
- ✅ `amazon.nova-reel-v1:0` - Nova Reel
- ✅ `amazon.nova-reel-v1:1` - Nova Reel
- ✅ `amazon.nova-micro-v1:0:24k` - Nova Micro
- ✅ `amazon.nova-micro-v1:0:128k` - Nova Micro
- 🟡 `amazon.nova-micro-v1:0` - Nova Micro
- ✅ `amazon.nova-sonic-v1:0` - Nova Sonic
- ✅ `amazon.titan-embed-g1-text-02` - Titan Text Embeddings v2
- ✅ `amazon.titan-embed-text-v1:2:8k` - Titan Embeddings G1 - Text
- ✅ `amazon.titan-embed-text-v1` - Titan Embeddings G1 - Text
- ✅ `amazon.titan-embed-text-v2:0:8k` - Titan Text Embeddings V2
- ✅ `amazon.titan-embed-text-v2:0` - Titan Text Embeddings V2
- ✅ `amazon.titan-embed-image-v1:0` - Titan Multimodal Embeddings G1
- ✅ `amazon.titan-embed-image-v1` - Titan Multimodal Embeddings G1


### MiniMax

- **Total de modelos:** 1
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `minimax.minimax-m2` - MiniMax M2


### Mistral AI

- **Total de modelos:** 12
- **Requerem Profile:** 0
- **Suportam Profile:** 1

**Modelos:**
- ✅ `mistral.voxtral-mini-3b-2507` - Voxtral Mini 3B 2507
- ✅ `mistral.mistral-large-3-675b-instruct` - Mistral Large 3
- ✅ `mistral.ministral-3-14b-instruct` - Ministral 14B 3.0
- ✅ `mistral.ministral-3-8b-instruct` - Ministral 3 8B
- ✅ `mistral.voxtral-small-24b-2507` - Voxtral Small 24B 2507
- ✅ `mistral.magistral-small-2509` - Magistral Small 2509
- ✅ `mistral.ministral-3-3b-instruct` - Ministral 3B
- ✅ `mistral.mistral-7b-instruct-v0:2` - Mistral 7B Instruct
- ✅ `mistral.mixtral-8x7b-instruct-v0:1` - Mixtral 8x7B Instruct
- ✅ `mistral.mistral-large-2402-v1:0` - Mistral Large (24.02)
- ✅ `mistral.mistral-small-2402-v1:0` - Mistral Small (24.02)
- 🟡 `mistral.pixtral-large-2502-v1:0` - Pixtral Large (25.02)


### Google

- **Total de modelos:** 3
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `google.gemma-3-12b-it` - Gemma 3 12B IT
- ✅ `google.gemma-3-4b-it` - Gemma 3 4B IT
- ✅ `google.gemma-3-27b-it` - Gemma 3 27B PT


### Moonshot AI

- **Total de modelos:** 1
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `moonshot.kimi-k2-thinking` - Kimi K2 Thinking


### TwelveLabs

- **Total de modelos:** 3
- **Requerem Profile:** 0
- **Suportam Profile:** 3

**Modelos:**
- 🟡 `twelvelabs.pegasus-1-2-v1:0` - Pegasus v1.2
- 🟡 `twelvelabs.marengo-embed-3-0-v1:0` - Marengo Embed 3.0
- 🟡 `twelvelabs.marengo-embed-2-7-v1:0` - Marengo Embed v2.7


### Writer

- **Total de modelos:** 2
- **Requerem Profile:** 0
- **Suportam Profile:** 2

**Modelos:**
- 🟡 `writer.palmyra-x5-v1:0` - Palmyra X5
- 🟡 `writer.palmyra-x4-v1:0` - Palmyra X4


### Cohere

- **Total de modelos:** 8
- **Requerem Profile:** 0
- **Suportam Profile:** 1

**Modelos:**
- 🟡 `cohere.embed-v4:0` - Embed v4
- ✅ `cohere.command-r-v1:0` - Command R
- ✅ `cohere.command-r-plus-v1:0` - Command R+
- ✅ `cohere.embed-english-v3:0:512` - Embed English
- ✅ `cohere.embed-english-v3` - Embed English
- ✅ `cohere.embed-multilingual-v3:0:512` - Embed Multilingual
- ✅ `cohere.embed-multilingual-v3` - Embed Multilingual
- ✅ `cohere.rerank-v3-5:0` - Rerank 3.5


### AI21 Labs

- **Total de modelos:** 2
- **Requerem Profile:** 0
- **Suportam Profile:** 0

**Modelos:**
- ✅ `ai21.jamba-1-5-large-v1:0` - Jamba 1.5 Large
- ✅ `ai21.jamba-1-5-mini-v1:0` - Jamba 1.5 Mini


### DeepSeek

- **Total de modelos:** 1
- **Requerem Profile:** 0
- **Suportam Profile:** 1

**Modelos:**
- 🟡 `deepseek.r1-v1:0` - DeepSeek-R1


### Meta

- **Total de modelos:** 11
- **Requerem Profile:** 0
- **Suportam Profile:** 9

**Modelos:**
- ✅ `meta.llama3-8b-instruct-v1:0` - Llama 3 8B Instruct
- ✅ `meta.llama3-70b-instruct-v1:0` - Llama 3 70B Instruct
- 🟡 `meta.llama3-1-8b-instruct-v1:0` - Llama 3.1 8B Instruct
- 🟡 `meta.llama3-1-70b-instruct-v1:0` - Llama 3.1 70B Instruct
- 🟡 `meta.llama3-2-11b-instruct-v1:0` - Llama 3.2 11B Instruct
- 🟡 `meta.llama3-2-90b-instruct-v1:0` - Llama 3.2 90B Instruct
- 🟡 `meta.llama3-2-1b-instruct-v1:0` - Llama 3.2 1B Instruct
- 🟡 `meta.llama3-2-3b-instruct-v1:0` - Llama 3.2 3B Instruct
- 🟡 `meta.llama3-3-70b-instruct-v1:0` - Llama 3.3 70B Instruct
- 🟡 `meta.llama4-scout-17b-instruct-v1:0` - Llama 4 Scout 17B Instruct
- 🟡 `meta.llama4-maverick-17b-instruct-v1:0` - Llama 4 Maverick 17B Instruct


---

## 📋 Recomendações

### 1. Atualizar Registry Models

Adicionar `requires_inference_profile: true` para:

- `anthropic.claude-sonnet-4-20250514-v1:0`
- `anthropic.claude-haiku-4-5-20251001-v1:0`
- `anthropic.claude-sonnet-4-5-20250929-v1:0`
- `anthropic.claude-opus-4-1-20250805-v1:0`
- `anthropic.claude-opus-4-5-20251101-v1:0`
- `anthropic.claude-3-5-haiku-20241022-v1:0`


### 2. Atualizar bedrock.ts

- Usar inference profile APENAS quando modelo requer
- Manter modelId direto para modelos que não requerem
- Adicionar fallback inteligente

### 3. Próximos Passos

1. ✅ Revisar configuração atual do registry
2. ✅ Atualizar modelos que requerem profile
3. ✅ Testar modelos após correções
4. ✅ Validar funcionamento em produção

---

## 📊 Dados Completos

```json
[
  {
    "provider": "NVIDIA",
    "modelId": "nvidia.nemotron-nano-12b-v2",
    "modelName": "NVIDIA Nemotron Nano 12B v2 VL BF16",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "NVIDIA",
    "modelId": "nvidia.nemotron-nano-3-30b",
    "modelName": "Nemotron Nano 3 30B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "NVIDIA",
    "modelId": "nvidia.nemotron-nano-9b-v2",
    "modelName": "NVIDIA Nemotron Nano 9B v2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-sonnet-4-20250514-v1:0",
    "modelName": "Claude Sonnet 4",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-haiku-4-5-20251001-v1:0",
    "modelName": "Claude Haiku 4.5",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-sonnet-4-5-20250929-v1:0",
    "modelName": "Claude Sonnet 4.5",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-opus-4-1-20250805-v1:0",
    "modelName": "Claude Opus 4.1",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-opus-4-5-20251101-v1:0",
    "modelName": "Claude Opus 4.5",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-3-haiku-20240307-v1:0:48k",
    "modelName": "Claude 3 Haiku",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "ERROR: Model not found.",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-3-haiku-20240307-v1:0:200k",
    "modelName": "Claude 3 Haiku",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "ERROR: Model not found.",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-3-haiku-20240307-v1:0",
    "modelName": "Claude 3 Haiku",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "WORKS_WITHOUT_PROFILE",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Anthropic",
    "modelId": "anthropic.claude-3-5-haiku-20241022-v1:0",
    "modelName": "Claude 3.5 Haiku",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": true,
    "testResult": "REQUIRES_PROFILE",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "OpenAI",
    "modelId": "openai.gpt-oss-120b-1:0",
    "modelName": "gpt-oss-120b",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "OpenAI",
    "modelId": "openai.gpt-oss-20b-1:0",
    "modelName": "gpt-oss-20b",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "OpenAI",
    "modelId": "openai.gpt-oss-safeguard-120b",
    "modelName": "GPT OSS Safeguard 120B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "OpenAI",
    "modelId": "openai.gpt-oss-safeguard-20b",
    "modelName": "GPT OSS Safeguard 20B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-creative-upscale-v1:0",
    "modelName": "Stable Image Creative Upscale",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-remove-background-v1:0",
    "modelName": "Stable Image Remove Background",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-control-sketch-v1:0",
    "modelName": "Stable Image Control Sketch",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-conservative-upscale-v1:0",
    "modelName": "Stable Image Conservative Upscale",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-search-recolor-v1:0",
    "modelName": "Stable Image Search and Recolor",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-fast-upscale-v1:0",
    "modelName": "Stable Image Fast Upscale",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-erase-object-v1:0",
    "modelName": "Stable Image Erase Object",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-control-structure-v1:0",
    "modelName": "Stable Image Control Structure",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-outpaint-v1:0",
    "modelName": "Stable Image Outpaint",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-inpaint-v1:0",
    "modelName": "Stable Image Inpaint",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-style-guide-v1:0",
    "modelName": "Stable Image Style Guide",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-style-transfer-v1:0",
    "modelName": "Stable Image Style Transfer",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Stability AI",
    "modelId": "stability.stable-image-search-replace-v1:0",
    "modelName": "Stable Image Search and Replace",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Qwen",
    "modelId": "qwen.qwen3-next-80b-a3b",
    "modelName": "Qwen3 Next 80B A3B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Qwen",
    "modelId": "qwen.qwen3-32b-v1:0",
    "modelName": "Qwen3 32B (dense)",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Qwen",
    "modelId": "qwen.qwen3-vl-235b-a22b",
    "modelName": "Qwen3 VL 235B A22B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Qwen",
    "modelId": "qwen.qwen3-coder-30b-a3b-v1:0",
    "modelName": "Qwen3-Coder-30B-A3B-Instruct",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-2-multimodal-embeddings-v1:0",
    "modelName": "Amazon Nova Multimodal Embeddings",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-pro-v1:0",
    "modelName": "Nova Pro",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND",
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-2-lite-v1:0",
    "modelName": "Nova 2 Lite",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-2-lite-v1:0:256k",
    "modelName": "Nova 2 Lite",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-2-sonic-v1:0",
    "modelName": "Nova 2 Sonic",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-tg1-large",
    "modelName": "Titan Text Large",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-image-generator-v2:0",
    "modelName": "Titan Image Generator G1 v2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED",
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-premier-v1:0:8k",
    "modelName": "Nova Premier",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": []
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-premier-v1:0:20k",
    "modelName": "Nova Premier",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": []
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-premier-v1:0:1000k",
    "modelName": "Nova Premier",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": []
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-premier-v1:0:mm",
    "modelName": "Nova Premier",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": []
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-premier-v1:0",
    "modelName": "Nova Premier",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-pro-v1:0:24k",
    "modelName": "Nova Pro",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-pro-v1:0:300k",
    "modelName": "Nova Pro",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-lite-v1:0:24k",
    "modelName": "Nova Lite",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-lite-v1:0:300k",
    "modelName": "Nova Lite",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-lite-v1:0",
    "modelName": "Nova Lite",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND",
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-canvas-v1:0",
    "modelName": "Nova Canvas",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND",
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-reel-v1:0",
    "modelName": "Nova Reel",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-reel-v1:1",
    "modelName": "Nova Reel",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-micro-v1:0:24k",
    "modelName": "Nova Micro",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-micro-v1:0:128k",
    "modelName": "Nova Micro",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-micro-v1:0",
    "modelName": "Nova Micro",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND",
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.nova-sonic-v1:0",
    "modelName": "Nova Sonic",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-g1-text-02",
    "modelName": "Titan Text Embeddings v2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-text-v1:2:8k",
    "modelName": "Titan Embeddings G1 - Text",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-text-v1",
    "modelName": "Titan Embeddings G1 - Text",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-text-v2:0:8k",
    "modelName": "Titan Text Embeddings V2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": []
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-text-v2:0",
    "modelName": "Titan Text Embeddings V2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-image-v1:0",
    "modelName": "Titan Multimodal Embeddings G1",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Amazon",
    "modelId": "amazon.titan-embed-image-v1",
    "modelName": "Titan Multimodal Embeddings G1",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "MiniMax",
    "modelId": "minimax.minimax-m2",
    "modelName": "MiniMax M2",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.voxtral-mini-3b-2507",
    "modelName": "Voxtral Mini 3B 2507",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.mistral-large-3-675b-instruct",
    "modelName": "Mistral Large 3",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.ministral-3-14b-instruct",
    "modelName": "Ministral 14B 3.0",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.ministral-3-8b-instruct",
    "modelName": "Ministral 3 8B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.voxtral-small-24b-2507",
    "modelName": "Voxtral Small 24B 2507",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.magistral-small-2509",
    "modelName": "Magistral Small 2509",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.ministral-3-3b-instruct",
    "modelName": "Ministral 3B",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.mistral-7b-instruct-v0:2",
    "modelName": "Mistral 7B Instruct",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.mixtral-8x7b-instruct-v0:1",
    "modelName": "Mixtral 8x7B Instruct",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.mistral-large-2402-v1:0",
    "modelName": "Mistral Large (24.02)",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.mistral-small-2402-v1:0",
    "modelName": "Mistral Small (24.02)",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Mistral AI",
    "modelId": "mistral.pixtral-large-2502-v1:0",
    "modelName": "Pixtral Large (25.02)",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Google",
    "modelId": "google.gemma-3-12b-it",
    "modelName": "Gemma 3 12B IT",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Google",
    "modelId": "google.gemma-3-4b-it",
    "modelName": "Gemma 3 4B IT",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Google",
    "modelId": "google.gemma-3-27b-it",
    "modelName": "Gemma 3 27B PT",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Moonshot AI",
    "modelId": "moonshot.kimi-k2-thinking",
    "modelName": "Kimi K2 Thinking",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "TwelveLabs",
    "modelId": "twelvelabs.pegasus-1-2-v1:0",
    "modelName": "Pegasus v1.2",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE",
      "ON_DEMAND"
    ]
  },
  {
    "provider": "TwelveLabs",
    "modelId": "twelvelabs.marengo-embed-3-0-v1:0",
    "modelName": "Marengo Embed 3.0",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE",
      "ON_DEMAND"
    ]
  },
  {
    "provider": "TwelveLabs",
    "modelId": "twelvelabs.marengo-embed-2-7-v1:0",
    "modelName": "Marengo Embed v2.7",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Writer",
    "modelId": "writer.palmyra-x5-v1:0",
    "modelName": "Palmyra X5",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Writer",
    "modelId": "writer.palmyra-x4-v1:0",
    "modelName": "Palmyra X4",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.embed-v4:0",
    "modelName": "Embed v4",
    "supportsInferenceProfile": true,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND",
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.command-r-v1:0",
    "modelName": "Command R",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.command-r-plus-v1:0",
    "modelName": "Command R+",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.embed-english-v3:0:512",
    "modelName": "Embed English",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.embed-english-v3",
    "modelName": "Embed English",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.embed-multilingual-v3:0:512",
    "modelName": "Embed Multilingual",
    "supportsInferenceProfile": false,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "PROVISIONED"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.embed-multilingual-v3",
    "modelName": "Embed Multilingual",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Cohere",
    "modelId": "cohere.rerank-v3-5:0",
    "modelName": "Rerank 3.5",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "AI21 Labs",
    "modelId": "ai21.jamba-1-5-large-v1:0",
    "modelName": "Jamba 1.5 Large",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "AI21 Labs",
    "modelId": "ai21.jamba-1-5-mini-v1:0",
    "modelName": "Jamba 1.5 Mini",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "DeepSeek",
    "modelId": "deepseek.r1-v1:0",
    "modelName": "DeepSeek-R1",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-8b-instruct-v1:0",
    "modelName": "Llama 3 8B Instruct",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-70b-instruct-v1:0",
    "modelName": "Llama 3 70B Instruct",
    "supportsInferenceProfile": false,
    "supportsOnDemand": true,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "ON_DEMAND"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-1-8b-instruct-v1:0",
    "modelName": "Llama 3.1 8B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-1-70b-instruct-v1:0",
    "modelName": "Llama 3.1 70B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-2-11b-instruct-v1:0",
    "modelName": "Llama 3.2 11B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-2-90b-instruct-v1:0",
    "modelName": "Llama 3.2 90B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-2-1b-instruct-v1:0",
    "modelName": "Llama 3.2 1B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-2-3b-instruct-v1:0",
    "modelName": "Llama 3.2 3B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama3-3-70b-instruct-v1:0",
    "modelName": "Llama 3.3 70B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama4-scout-17b-instruct-v1:0",
    "modelName": "Llama 4 Scout 17B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  },
  {
    "provider": "Meta",
    "modelId": "meta.llama4-maverick-17b-instruct-v1:0",
    "modelName": "Llama 4 Maverick 17B Instruct",
    "supportsInferenceProfile": true,
    "supportsOnDemand": false,
    "requiresProfile": false,
    "testResult": "NOT_TESTED",
    "inferenceTypes": [
      "INFERENCE_PROFILE"
    ]
  }
]
```

---

**Gerado por:** analyze-inference-profiles.ts
**Timestamp:** 2026-01-30T12:39:00.807Z
