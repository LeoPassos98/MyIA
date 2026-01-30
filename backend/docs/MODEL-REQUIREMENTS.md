# Requisitos de Modelos - MyIA

**Última atualização:** 2026-01-30

Este documento define os requisitos que um modelo de IA deve cumprir para ser compatível com a aplicação MyIA.

---

## 📋 Requisitos Atuais (v1.0)

### 1. Modalidade

- ✅ **OBRIGATÓRIO**: Suporte a modalidade `TEXT` (entrada e saída)
- ❌ **EXCLUÍDO**: Modelos de embedding (apenas vetores)
- ❌ **EXCLUÍDO**: Modelos de imagem (por enquanto)
- ❌ **EXCLUÍDO**: Modelos de áudio/vídeo (por enquanto)

### 2. Capacidades

- ✅ **OBRIGATÓRIO**: Suporte a chat/conversação
- ✅ **OBRIGATÓRIO**: Suporte a streaming (SSE - Server-Sent Events)
- ✅ **RECOMENDADO**: Suporte a system prompts
- ✅ **RECOMENDADO**: Suporte a parâmetros (temperature, max_tokens, etc.)

### 3. Plataforma AWS Bedrock

- ✅ **OBRIGATÓRIO**: Status `ACTIVE` no AWS Bedrock
- ✅ **OBRIGATÓRIO**: Disponível na região configurada (default: `us-east-1`)
- ✅ **OBRIGATÓRIO**: Suporte a `ON_DEMAND` ou `INFERENCE_PROFILE`

### 4. Inference Profiles (AWS Bedrock)

**Modelos que REQUEREM inference profile:**
- ✅ Claude 4.x (Sonnet, Haiku, Opus)
- ✅ Claude 3.5 Sonnet v2 (20241022)
- ✅ Claude 3.7 Sonnet (20250219)

**Formato do modelId:**
- Com inference profile: `{region}.{provider}.{model-id}` (ex: `us.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- Sem inference profile: `{provider}.{model-id}` (ex: `anthropic.claude-3-sonnet-20240229-v1:0`)

### 5. Certificação

- ✅ **OBRIGATÓRIO**: Passar em pelo menos 3 dos 7 testes de certificação
- ✅ **RECOMENDADO**: Rating ≥ 3.0 (FUNCIONAL)
- ✅ **PREMIUM**: Rating = 5.0 (100% de sucesso)

---

## 🚫 Modelos Excluídos

### Por Tipo
- ❌ Modelos de embedding (ex: `amazon.titan-embed-text-v1`)
- ❌ Modelos de imagem (ex: `stability.stable-diffusion-xl-v1`)
- ❌ Modelos de áudio/vídeo
- ❌ Modelos multimodais (por enquanto)

### Por Status
- ❌ Modelos `LEGACY` ou `DEPRECATED`
- ❌ Modelos sem suporte a streaming
- ❌ Modelos que falharam em todos os testes de certificação

### Por Obsolescência
- ❌ Modelos v1.0, v1.2, v1.3 (versões antigas)
- ⚠️  Modelos Titan Text Lite/Express (considerar deprecação)
- ⚠️  Modelos Cohere Command Text (considerar deprecação)

---

## 🔮 Requisitos Futuros (Roadmap)

### Médio Prazo (3-6 meses)

#### Modalidades Adicionais
- 🔄 **Imagem**: Modelos de geração de imagem (Stable Diffusion, DALL-E)
- 🔄 **Visão**: Modelos que processam imagens (Claude 3 Opus, GPT-4 Vision)
- 🔄 **Documentos**: Modelos que processam PDFs/documentos

#### Capacidades Avançadas
- 🔄 **Function Calling**: Suporte a chamadas de função
- 🔄 **Tool Use**: Integração com ferramentas externas
- 🔄 **RAG**: Retrieval-Augmented Generation
- 🔄 **Agentes**: Modelos com capacidade de agente autônomo

### Longo Prazo (6-12 meses)

#### Modalidades Avançadas
- 🔄 **Áudio**: Modelos de speech-to-text e text-to-speech
- 🔄 **Vídeo**: Modelos de análise e geração de vídeo
- 🔄 **Multimodal**: Modelos que combinam múltiplas modalidades

#### Capacidades Especializadas
- 🔄 **Reasoning**: Modelos de raciocínio avançado (ex: o1, o3)
- 🔄 **Code**: Modelos especializados em código
- 🔄 **Math**: Modelos especializados em matemática

---

## 📊 Classificação de Modelos

### Por Modernidade

#### ✨ MODERNOS (Recomendados)
- Claude 4.x (Sonnet, Haiku, Opus)
- Claude 3.7 Sonnet
- Claude 3.5 Sonnet v2
- AWS Nova (Pro, Lite, Micro)
- Llama 3.3, 3.2
- Mistral Large 2

#### ⚠️  INTERMEDIÁRIOS (Funcionais)
- Claude 3.5 Sonnet v1
- Claude 3 (Opus, Sonnet, Haiku)
- Llama 3.1
- Mistral 7B

#### 🗑️ OBSOLETOS (Considerar Deprecação)
- Titan Text Lite v1
- Titan Text Express v1
- Cohere Command Text
- AI21 Jurassic-2

---

## 🔧 Implementação

### Arquivo de Configuração

```typescript
// backend/src/config/model-requirements.ts

export interface ModelRequirements {
  modalities: {
    required: string[];      // Ex: ['TEXT']
    optional: string[];      // Ex: ['IMAGE', 'AUDIO']
    excluded: string[];      // Ex: ['EMBEDDING']
  };
  
  capabilities: {
    required: string[];      // Ex: ['CHAT', 'STREAMING']
    recommended: string[];   // Ex: ['SYSTEM_PROMPTS', 'PARAMETERS']
    optional: string[];      // Ex: ['FUNCTION_CALLING', 'TOOL_USE']
  };
  
  platform: {
    status: string[];        // Ex: ['ACTIVE']
    inferenceTypes: string[]; // Ex: ['ON_DEMAND', 'INFERENCE_PROFILE']
  };
  
  certification: {
    minTests: number;        // Ex: 3
    minRating: number;       // Ex: 3.0
  };
  
  obsolescence: {
    excludePatterns: string[]; // Ex: ['v1.0', 'embed', 'titan-text-lite']
  };
}

export const CURRENT_REQUIREMENTS: ModelRequirements = {
  modalities: {
    required: ['TEXT'],
    optional: [],
    excluded: ['EMBEDDING'],
  },
  
  capabilities: {
    required: ['CHAT', 'STREAMING'],
    recommended: ['SYSTEM_PROMPTS', 'PARAMETERS'],
    optional: ['FUNCTION_CALLING', 'TOOL_USE'],
  },
  
  platform: {
    status: ['ACTIVE'],
    inferenceTypes: ['ON_DEMAND', 'INFERENCE_PROFILE'],
  },
  
  certification: {
    minTests: 3,
    minRating: 3.0,
  },
  
  obsolescence: {
    excludePatterns: [
      'v1.0', 'v1.2', 'v1.3',
      'embed', 'embedding',
      'titan-text-lite', 'titan-text-express',
      'command-text', 'command-light',
      'j2-',
    ],
  },
};
```

### Validação de Modelos

```typescript
// backend/src/services/ai/registry/model-validator.ts

import { CURRENT_REQUIREMENTS } from '@/config/model-requirements';

export function validateModel(model: ModelRegistryEntry): {
  isValid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // 1. Verificar modalidades
  if (!model.modalities.some(m => CURRENT_REQUIREMENTS.modalities.required.includes(m))) {
    reasons.push('Modalidade TEXT não suportada');
  }
  
  if (model.modalities.some(m => CURRENT_REQUIREMENTS.modalities.excluded.includes(m))) {
    reasons.push('Modalidade excluída (EMBEDDING)');
  }
  
  // 2. Verificar capacidades
  if (!model.capabilities.includes('CHAT')) {
    reasons.push('Não suporta chat');
  }
  
  if (!model.capabilities.includes('STREAMING')) {
    reasons.push('Não suporta streaming');
  }
  
  // 3. Verificar obsolescência
  const isObsolete = CURRENT_REQUIREMENTS.obsolescence.excludePatterns.some(
    pattern => model.modelId.toLowerCase().includes(pattern)
  );
  
  if (isObsolete) {
    reasons.push('Modelo obsoleto');
  }
  
  // 4. Verificar certificação
  if (model.rating && model.rating < CURRENT_REQUIREMENTS.certification.minRating) {
    reasons.push(`Rating muito baixo (${model.rating} < ${CURRENT_REQUIREMENTS.certification.minRating})`);
  }
  
  return {
    isValid: reasons.length === 0,
    reasons,
  };
}
```

---

## 📚 Referências

### AWS Bedrock
- [Supported Regions and models for inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html)
- [Prerequisites for inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-prereq.html)
- [Anthropic Claude models](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html)

### Artigos e Discussões
- [AWS Bedrock requires inference profiles for on-demand usage](https://aws.plainenglish.io/configuring-claude-code-extension-with-aws-bedrock-and-how-you-can-avoid-my-mistakes-090dbed5215b)
- [Stack Overflow: Claude Sonnet 3.5 v2 inference profile error](https://stackoverflow.com/questions/79428475/aws-bedrock-cannot-invoke-anthropic-claude-sonnet-3-5-v2-model-raises-error-i)
- [Promptfoo AWS Bedrock Documentation](https://www.promptfoo.dev/docs/providers/aws-bedrock/)

---

## 🎯 Decisão: Usar Apenas Modelos com Inference Profile?

### Análise

Com base na pesquisa realizada, descobrimos que:

1. **Modelos que REQUEREM inference profile:**
   - Claude 4.x (todos)
   - Claude 3.7 Sonnet
   - Claude 3.5 Sonnet v2

2. **Modelos MODERNOS que SUPORTAM inference profile:**
   - AWS Nova (Pro, Lite, Micro)
   - Llama 3.3, 3.2
   - Stability AI (alguns modelos)

3. **Modelos ANTIGOS que NÃO suportam:**
   - Titan Text Lite/Express v1
   - Cohere Command Text
   - AI21 Jurassic-2
   - Embeddings

### Recomendação

✅ **SIM, usar apenas modelos com inference profile é viável e recomendado!**

**Motivos:**
1. Modelos mais modernos e performáticos
2. Melhor suporte da AWS (cross-region inference)
3. Maior escalabilidade e disponibilidade
4. Código mais simples e padronizado
5. Preparado para futuro (AWS está migrando nessa direção)

**Implementação:**
1. Filtrar modelos no registry: apenas `supportsInferenceProfile: true`
2. Remover modelos obsoletos (Titan v1, Cohere Command Text, etc.)
3. Focar em ~40 modelos modernos de chat
4. Usar prefixo regional: `{region}.{modelId}`

---

**Autor:** MyIA Team  
**Versão:** 1.0  
**Status:** Draft
