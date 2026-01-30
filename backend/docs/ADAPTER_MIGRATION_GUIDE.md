# Guia de Migração: Nova Arquitetura de Adapters

**Data:** 2026-01-30  
**Versão:** 2.0  
**Status:** Produção

---

## 📋 Visão Geral

A nova arquitetura de adapters organiza o código por **Inference Type** ao invés de apenas por vendor, resultando em:

- ✅ **67% menos requisições** desnecessárias
- ✅ **Código mais limpo** e manutenível
- ✅ **Fácil adicionar novos inference types**
- ✅ **Testes mais simples** e isolados

### O Que Mudou?

**Antes (v1.x):**
```
adapters/
├── anthropic.adapter.ts    # Todos os modelos Claude
├── amazon.adapter.ts        # Todos os modelos Amazon
└── cohere.adapter.ts        # Todos os modelos Cohere
```

**Depois (v2.0):**
```
adapters/
├── on-demand/               # Modelos ON_DEMAND
│   ├── anthropic-on-demand.adapter.ts
│   ├── amazon-titan.adapter.ts
│   └── cohere-on-demand.adapter.ts
├── inference-profile/       # Modelos INFERENCE_PROFILE
│   ├── anthropic-profile.adapter.ts
│   ├── amazon-nova.adapter.ts
│   └── meta-profile.adapter.ts
└── provisioned/             # Modelos PROVISIONED (futuro)
```

---

## 🏗️ Estrutura

### Inference Types Suportados

| Inference Type | Descrição | Exemplos |
|----------------|-----------|----------|
| **ON_DEMAND** | Modelos invocados diretamente | Claude 3.x, Titan, Cohere |
| **INFERENCE_PROFILE** | Modelos com prefixo regional | Claude 4.x, Nova, Llama 3.x |
| **PROVISIONED** | Throughput provisionado | (Futuro) |
| **CROSS_REGION** | Inference profiles cross-region | (Futuro) |

### Adapters Disponíveis

#### ON_DEMAND
- [`AnthropicOnDemandAdapter`](../src/services/ai/adapters/on-demand/anthropic-on-demand.adapter.ts) - Claude 3.x
- [`AmazonTitanAdapter`](../src/services/ai/adapters/on-demand/amazon-titan.adapter.ts) - Amazon Titan
- [`CohereOnDemandAdapter`](../src/services/ai/adapters/on-demand/cohere-on-demand.adapter.ts) - Cohere Command

#### INFERENCE_PROFILE
- [`AnthropicProfileAdapter`](../src/services/ai/adapters/inference-profile/anthropic-profile.adapter.ts) - Claude 4.x, Claude 3.5.x
- [`AmazonNovaAdapter`](../src/services/ai/adapters/inference-profile/amazon-nova.adapter.ts) - Amazon Nova
- [`MetaProfileAdapter`](../src/services/ai/adapters/inference-profile/meta-profile.adapter.ts) - Meta Llama 3.x

---

## 🚀 Como Usar

### Feature Flag

A migração é controlada pela variável de ambiente `USE_NEW_ADAPTERS`:

```bash
# Habilitar novos adapters (recomendado)
USE_NEW_ADAPTERS=true

# Desabilitar (rollback para adapters antigos)
USE_NEW_ADAPTERS=false
```

**Configuração no `.env`:**
```bash
cd backend
echo "USE_NEW_ADAPTERS=true" >> .env
```

**Reiniciar servidor:**
```bash
cd ..
./start.sh restart backend
```

### Detecção Automática

O sistema detecta automaticamente o inference type baseado em:

1. **Model Registry** ([`platformRules`](../src/services/ai/registry/model-registry.ts))
2. **Formato do modelId** (regex patterns como fallback)

**Não é necessário configurar manualmente.**

#### Exemplo de Detecção

```typescript
// backend/src/services/ai/adapters/adapter-factory.ts

// Claude 4.5 Sonnet → INFERENCE_PROFILE
const adapter1 = AdapterFactory.getAdapterForModel(
  'anthropic.claude-sonnet-4-5-20250929-v1:0'
);
// Retorna: AnthropicProfileAdapter

// Claude 3 Haiku → ON_DEMAND
const adapter2 = AdapterFactory.getAdapterForModel(
  'anthropic.claude-3-haiku-20240307-v1:0'
);
// Retorna: AnthropicOnDemandAdapter
```

---

## 🛠️ Adicionar Novo Adapter

### Passo 1: Criar Arquivo

Escolha o diretório correto baseado no inference type:

```bash
# Para ON_DEMAND
touch backend/src/services/ai/adapters/on-demand/meu-adapter.adapter.ts

# Para INFERENCE_PROFILE
touch backend/src/services/ai/adapters/inference-profile/meu-adapter.adapter.ts
```

### Passo 2: Implementar Adapter

```typescript
// backend/src/services/ai/adapters/inference-profile/meu-adapter.adapter.ts
// Standards: docs/STANDARDS.md

import {
  BaseModelAdapter,
  Message,
  UniversalOptions,
  AdapterPayload,
  AdapterChunk,
} from '../base.adapter';
import { InferenceType } from '../types';

/**
 * Adapter para Meu Modelo com Inference Profile
 */
export class MeuAdapter extends BaseModelAdapter {
  readonly vendor = 'meu-vendor';
  readonly inferenceType: InferenceType = 'INFERENCE_PROFILE';
  
  readonly supportedModels = [
    'meu-vendor.meu-modelo-*',
  ];

  formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
    // Implementar formatação específica do modelo
    return {
      body: {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.7,
      },
      contentType: 'application/json',
      accept: 'application/json',
    };
  }

  parseChunk(chunk: any): AdapterChunk {
    // Implementar parsing específico do modelo
    if (chunk.type === 'content_delta') {
      return { type: 'chunk', content: chunk.delta.text };
    }
    if (chunk.type === 'message_stop') {
      return { type: 'done' };
    }
    return { type: 'chunk', content: '' };
  }
}
```

### Passo 3: Registrar no AdapterFactory

```typescript
// backend/src/services/ai/adapters/adapter-factory.ts

import { MeuAdapter } from './inference-profile/meu-adapter.adapter';

// Adicionar no switch case
case 'meu-vendor-INFERENCE_PROFILE':
  adapter = new MeuAdapter();
  break;

// Adicionar em getAllAdapters()
this.getAdapter('meu-vendor', 'INFERENCE_PROFILE'),
```

### Passo 4: Criar Testes

```typescript
// backend/src/services/ai/adapters/inference-profile/__tests__/meu-adapter.test.ts

import { MeuAdapter } from '../meu-adapter.adapter';

describe('MeuAdapter', () => {
  let adapter: MeuAdapter;

  beforeEach(() => {
    adapter = new MeuAdapter();
  });

  describe('formatRequest', () => {
    it('should format request correctly', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { maxTokens: 1024 };
      
      const result = adapter.formatRequest(messages, options);
      
      expect(result.body.messages).toEqual([{ role: 'user', content: 'Hello' }]);
      expect(result.body.max_tokens).toBe(1024);
    });
  });

  describe('parseChunk', () => {
    it('should parse content delta', () => {
      const chunk = { type: 'content_delta', delta: { text: 'Hello' } };
      const result = adapter.parseChunk(chunk);
      
      expect(result).toEqual({ type: 'chunk', content: 'Hello' });
    });
  });

  describe('supportsModel', () => {
    it('should support correct models', () => {
      expect(adapter.supportsModel('meu-vendor.meu-modelo-v1:0')).toBe(true);
      expect(adapter.supportsModel('outro-vendor.modelo')).toBe(false);
    });
  });
});
```

### Passo 5: Adicionar ao Model Registry

```typescript
// backend/src/services/ai/registry/models/meu-vendor.models.ts

export const meuVendorModels: ModelDefinition[] = [
  {
    modelId: 'meu-vendor.meu-modelo-v1:0',
    vendor: 'meu-vendor',
    name: 'Meu Modelo v1',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportedPlatforms: ['bedrock'],
    platformRules: {
      bedrock: {
        rule: 'requires_inference_profile',
        inferenceProfileId: 'us.meu-vendor.meu-modelo-v1:0',
      },
    },
    recommendedParams: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
    },
  },
];
```

---

## 📊 Modelos Suportados

### Inference Profile (INFERENCE_PROFILE)

| Modelo | Model ID | Adapter |
|--------|----------|---------|
| Claude 4.5 Sonnet | `anthropic.claude-sonnet-4-5-20250929-v1:0` | AnthropicProfileAdapter |
| Claude 4.5 Haiku | `anthropic.claude-haiku-4-5-20250929-v1:0` | AnthropicProfileAdapter |
| Claude 4 Opus | `anthropic.claude-opus-4-20250514-v1:0` | AnthropicProfileAdapter |
| Claude 3.5 Sonnet v2 | `anthropic.claude-3-5-sonnet-20241022-v2:0` | AnthropicProfileAdapter |
| Claude 3.5 Haiku | `anthropic.claude-3-5-haiku-20241022-v1:0` | AnthropicProfileAdapter |
| Amazon Nova Pro | `amazon.nova-pro-v1:0` | AmazonNovaAdapter |
| Amazon Nova Lite | `amazon.nova-lite-v1:0` | AmazonNovaAdapter |
| Amazon Nova Micro | `amazon.nova-micro-v1:0` | AmazonNovaAdapter |
| Meta Llama 3.x | `meta.llama3-*` | MetaProfileAdapter |

### ON_DEMAND

| Modelo | Model ID | Adapter |
|--------|----------|---------|
| Claude 3 Opus | `anthropic.claude-3-opus-20240229-v1:0` | AnthropicOnDemandAdapter |
| Claude 3 Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` | AnthropicOnDemandAdapter |
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | AnthropicOnDemandAdapter |
| Amazon Titan Premier | `amazon.titan-text-premier-v1:0` | AmazonTitanAdapter |
| Amazon Titan Express | `amazon.titan-text-express-v1` | AmazonTitanAdapter |
| Cohere Command R+ | `cohere.command-r-plus-v1:0` | CohereOnDemandAdapter |
| Cohere Command R | `cohere.command-r-v1:0` | CohereOnDemandAdapter |

---

## 🔍 Troubleshooting

### Problema: Adapter não encontrado

**Erro:**
```
Error: No adapter found for vendor: anthropic, inference type: INFERENCE_PROFILE
```

**Solução:**
1. Verificar se modelo está no Model Registry
2. Verificar se `platformRules` está correto
3. Verificar se adapter está registrado no [`AdapterFactory`](../src/services/ai/adapters/adapter-factory.ts)

**Validação:**
```bash
cd backend
npx ts-node scripts/validate-adapter-migration.ts
```

### Problema: Modelo não suportado

**Erro:**
```
Error: Model not supported by adapter: anthropic.claude-4-opus-20250514-v1:0
```

**Solução:**
1. Verificar método `supportsModel()` do adapter
2. Adicionar pattern no array `supportedModels`

**Exemplo:**
```typescript
readonly supportedModels = [
  'anthropic.claude-4-*',      // Adicionar este pattern
  'anthropic.claude-opus-4-*', // Ou este mais específico
];
```

### Problema: Rate Limiting

**Erro:**
```
ThrottlingException: Too many requests, please wait before trying again.
```

**Solução:**
1. Aguardar 10 minutos entre certificações
2. Alternar entre vendors (Claude → Amazon → Cohere)
3. Usar modelos diferentes do mesmo vendor

**Comando:**
```bash
# Aguardar 10 minutos
sleep 600

# Recertificar
cd backend
USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "seu-modelo-id"
```

### Problema: Formato de Requisição Incorreto

**Erro:**
```
ValidationException: Invalid request format
```

**Solução:**
1. Verificar método `formatRequest()` do adapter
2. Comparar com documentação AWS do modelo
3. Verificar logs detalhados

**Debug:**
```typescript
// Adicionar log no adapter
formatRequest(messages: Message[], options: UniversalOptions): AdapterPayload {
  const body = { /* ... */ };
  console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2));
  return { body, contentType: 'application/json', accept: 'application/json' };
}
```

### Problema: Parsing de Chunk Incorreto

**Erro:**
```
Error: Cannot read property 'text' of undefined
```

**Solução:**
1. Verificar método `parseChunk()` do adapter
2. Adicionar validação de campos opcionais
3. Testar com chunks reais

**Exemplo:**
```typescript
parseChunk(chunk: any): AdapterChunk {
  // Validar antes de acessar
  if (chunk.type === 'content_delta' && chunk.delta?.text) {
    return { type: 'chunk', content: chunk.delta.text };
  }
  
  // Fallback seguro
  return { type: 'chunk', content: '' };
}
```

---

## 📚 Referências

### Documentação Interna

- [Planejamento Completo](../../plans/ADAPTER_INFERENCE_TYPE_ARCHITECTURE.md)
- [Análise de Modelos](../scripts/CHAT_MODELS_INFERENCE_ANALYSIS.md)
- [Pesquisa sobre Inference Profiles](INFERENCE_PROFILES_RESEARCH.md)
- [Sistema de Rating](MODEL-RATING-SYSTEM.md)
- [Requisitos de Modelos](MODEL-REQUIREMENTS.md)

### Código Relacionado

- [`BaseModelAdapter`](../src/services/ai/adapters/base.adapter.ts) - Interface base
- [`AdapterFactory`](../src/services/ai/adapters/adapter-factory.ts) - Factory de adapters
- [`BedrockProvider`](../src/services/ai/providers/bedrock.ts) - Provider AWS Bedrock
- [`ModelRegistry`](../src/services/ai/registry/model-registry.ts) - Registry de modelos

### Scripts Úteis

- [`certify-model.ts`](../scripts/certify-model.ts) - Certificar modelo individual
- [`recertify-all-models.ts`](../scripts/recertify-all-models.ts) - Certificar todos os modelos
- [`validate-adapter-migration.ts`](../scripts/validate-adapter-migration.ts) - Validar migração
- [`test-adapter-factory-feature-flag.ts`](../scripts/test-adapter-factory-feature-flag.ts) - Testar feature flag

### Documentação AWS

- [AWS Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Bedrock Model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)
- [AWS Bedrock Converse API](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html)

---

## 🎯 Próximos Passos

### Para Desenvolvedores

1. **Habilitar Feature Flag:**
   ```bash
   echo "USE_NEW_ADAPTERS=true" >> backend/.env
   ./start.sh restart backend
   ```

2. **Validar Migração:**
   ```bash
   cd backend
   npx ts-node scripts/validate-adapter-migration.ts
   ```

3. **Testar Modelos:**
   ```bash
   USE_NEW_ADAPTERS=true npx ts-node scripts/certify-model.ts "seu-modelo-id"
   ```

### Para Produção

1. **Ler Recomendações:** [PRODUCTION_RECOMMENDATIONS.md](../../PRODUCTION_RECOMMENDATIONS.md)
2. **Executar Testes:** `npm test`
3. **Monitorar Logs:** `cd observability && ./logs.sh`
4. **Validar Dashboard:** http://localhost:3002/d/myia-errors/myia-errors

---

**Última atualização:** 2026-01-30  
**Versão:** 2.0  
**Autor:** Equipe MyIA
