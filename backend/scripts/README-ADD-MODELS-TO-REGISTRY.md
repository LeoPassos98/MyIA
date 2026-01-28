# Script de Automação: Add Models to Registry

## Visão Geral

Script automatizado para adicionar modelos AWS Bedrock ao registry do sistema. Identifica modelos não configurados, gera código TypeScript automaticamente e atualiza os arquivos de configuração.

## Funcionalidades

### 1. Listagem de Modelos AWS Bedrock
- Conecta à API do AWS Bedrock usando credenciais do usuário
- Lista todos os modelos disponíveis na região configurada
- Filtra modelos relevantes (TEXT output, ON_DEMAND inference)

### 2. Comparação com Registry Atual
- Carrega todos os modelos já configurados no registry
- Identifica modelos não configurados (114+ modelos)
- Exclui modelos da blacklist (Nova Sonic, Nova 2 Sonic)

### 3. Agrupamento por Vendor
- Agrupa modelos por vendor (NVIDIA, OpenAI, Qwen, Mistral, etc.)
- Mapeia automaticamente provider names para vendors internos
- Ordena modelos alfabeticamente dentro de cada vendor

### 4. Geração de Código TypeScript
- Gera configurações completas para cada modelo
- Estima capabilities baseado no vendor e modelo
- Determina automaticamente se requer inference profile
- Define adapter class apropriado
- Configura parâmetros recomendados por vendor

### 5. Escrita em Arquivos
- Adiciona modelos a arquivos existentes (`*.models.ts`)
- Cria novos arquivos para vendors não existentes
- Atualiza `index.ts` com novos exports
- Cria backups antes de modificar arquivos

### 6. Relatório Detalhado
- Mostra total de modelos adicionados
- Lista modelos por vendor
- Indica características especiais (🔐 Inference Profile, 👁️ Vision, ⚙️ Function Calling)

## Uso

### Modo Dry-Run (Preview)
```bash
npx ts-node backend/scripts/add-models-to-registry.ts --dry-run
```
Mostra o que seria feito sem modificar arquivos.

### Adicionar Todos os Modelos
```bash
npx ts-node backend/scripts/add-models-to-registry.ts
```

### Adicionar Apenas um Vendor
```bash
npx ts-node backend/scripts/add-models-to-registry.ts --vendor=mistral
```

## Blacklist de Modelos

Os seguintes modelos **NÃO** são adicionados devido a problemas conhecidos:

- `amazon.nova-sonic-v1:0` - Problemas graves de qualidade
- `amazon.nova-2-sonic-v1:0` - Problemas graves de qualidade

## Estrutura de Arquivos Gerados

### Arquivo de Vendor (`vendor.models.ts`)
```typescript
// backend/src/services/ai/registry/models/mistral.models.ts
import { ModelRegistry, ModelMetadata } from '../model-registry';

const mistralModels: ModelMetadata[] = [
  {
    modelId: 'mistral.mistral-large-2407-v1:0',
    vendor: 'mistral',
    displayName: 'Mistral Large 2407',
    description: 'Auto-generated model configuration',
    capabilities: {
      streaming: true,
      vision: false,
      functionCalling: true,
      maxContextWindow: 128000,
      maxOutputTokens: 4096,
    },
    supportedPlatforms: ['bedrock'],
    adapterClass: 'AmazonAdapter',
    recommendedParams: {
      temperature: 0.7,
      topP: 0.9,
      topK: 250,
      maxTokens: 2048,
    },
  },
  // ... mais modelos
];

ModelRegistry.registerMany(mistralModels);
export { mistralModels };
```

### Index Atualizado
```typescript
// backend/src/services/ai/registry/models/index.ts
import './anthropic.models';
import './amazon.models';
import './cohere.models';
import './mistral.models';  // ✅ Novo
import './nvidia.models';   // ✅ Novo

export * from './anthropic.models';
export * from './amazon.models';
export * from './cohere.models';
export * from './mistral.models';  // ✅ Novo
export * from './nvidia.models';   // ✅ Novo
```

## Estimativa de Capabilities

O script estima capabilities baseado em padrões conhecidos:

### Anthropic
- Context Window: 200k tokens
- Max Output: 8192 tokens
- Function Calling: Claude 3.5+ e Claude 4+
- Inference Profile: Modelos novos (3.5+, 4+)

### Amazon
- Nova: 300k context, 5000 output
- Titan Premier: 32k context, 3072 output
- Titan Express: 8k context, 8192 output
- Titan Lite: 4k context, 4096 output
- Inference Profile: Nova Premier, Nova 2

### Cohere
- Context Window: 128k tokens
- Max Output: 4000 tokens
- Function Calling: Command R models

### Meta
- Context Window: 128k tokens
- Max Output: 4096 tokens

### Mistral
- Context Window: 128k tokens
- Max Output: 4096 tokens
- Function Calling: Large e Medium models

## Adapter Classes

O script determina automaticamente o adapter apropriado:

- **AnthropicAdapter**: Modelos Anthropic
- **CohereAdapter**: Modelos Cohere
- **AmazonAdapter**: Amazon, Meta, Mistral, NVIDIA, OpenAI, Qwen, etc.

## Parâmetros Recomendados

### Anthropic
```typescript
{
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048
}
```

### Cohere
```typescript
{
  temperature: 0.3,
  topP: 0.75,
  topK: 0,
  maxTokens: 2048
}
```

### Outros (Amazon, Meta, Mistral, etc.)
```typescript
{
  temperature: 0.7,
  topP: 0.9,
  topK: 250,
  maxTokens: 2048
}
```

## Backups

Antes de modificar qualquer arquivo existente, o script cria um backup:

```
backend/src/services/ai/registry/models/anthropic.models.ts.backup
backend/src/services/ai/registry/models/amazon.models.ts.backup
```

## Validação Pós-Execução

Após executar o script, valide os modelos adicionados:

```bash
# Testar todos os modelos
npx ts-node backend/scripts/test-all-models.ts

# Testar apenas um vendor
npx ts-node backend/scripts/test-all-models.ts mistral
```

## Exemplo de Saída

```
🚀 Iniciando adição de modelos ao registry...

📅 Timestamp: 2026-01-27T16:00:00.000Z

🔍 Buscando modelos disponíveis no AWS Bedrock...
✅ 150 modelos encontrados no AWS Bedrock

🔧 Filtrando modelos relevantes...
⛔ Modelo na blacklist: amazon.nova-sonic-v1:0
⛔ Modelo na blacklist: amazon.nova-2-sonic-v1:0
✅ 148 modelos relevantes após filtragem

🔍 Comparando com registry atual...
📊 Registry atual: 34 modelos
📊 AWS Bedrock: 148 modelos
✅ 114 modelos não configurados identificados

📦 Agrupando modelos por vendor...
📊 Distribuição por vendor:
   ai21: 2 modelos
   cohere: 1 modelos
   google: 3 modelos
   meta: 2 modelos
   minimax: 1 modelos
   mistral: 11 modelos
   moonshot: 1 modelos
   nvidia: 3 modelos
   openai: 4 modelos
   qwen: 4 modelos
   twelvelabs: 1 modelos

📝 Escrevendo modelos em arquivos...

📄 mistral.models.ts (11 modelos)
   ✨ Criando novo arquivo
   ✅ Arquivo escrito com sucesso
   + mistral.mistral-large-2407-v1:0
   + mistral.mistral-large-2411-v1:0
   ...

📝 Atualizando index.ts com 8 novos vendors...
✅ index.ts atualizado

============================================================
📊 RELATÓRIO FINAL
============================================================

✅ Total de modelos adicionados: 114
📦 Vendors afetados: 11

📊 Por Vendor:

   mistral (11 modelos):
         mistral.mistral-large-2407-v1:0
     ⚙️  mistral.mistral-large-2411-v1:0
     ...

📝 Legenda:
   🔐 = Requer Inference Profile
   👁️ = Suporta Vision
   ⚙️ = Suporta Function Calling

✅ Modelos adicionados com sucesso!
💡 Execute os testes para validar os novos modelos:
   npx ts-node backend/scripts/test-all-models.ts

🎉 Script finalizado!
```

## Troubleshooting

### Erro: "Nenhum usuário com credenciais AWS configuradas"
Configure as credenciais AWS primeiro através da interface do sistema.

### Erro: "Não foi possível encontrar array de modelos"
O arquivo `*.models.ts` pode ter formato diferente do esperado. Verifique a estrutura.

### Modelos não aparecem no frontend
1. Reinicie o backend para carregar o novo registry
2. Verifique se os modelos foram habilitados nas configurações do usuário
3. Execute certificação dos modelos novos

## Integração com Sistema de Badges

O script trabalha em conjunto com o sistema de badges melhorado:

### 3 Estados de Disponibilidade

1. **✅ Disponível** - Modelo configurado no registry e certificado
2. **⚙️ Não Configurado** - Modelo existe no AWS mas sem registry
3. **❌ Indisponível** - Modelo realmente indisponível

### Campo `hasRegistry`

O controller `providersController.ts` foi atualizado para incluir:

```typescript
{
  providerSlug: 'bedrock',
  providerName: 'AWS Bedrock',
  isConfigured: true,
  hasRegistry: true,  // ✅ Indica se modelo tem configuração no registry
  certification: { ... }
}
```

### Lógica de Determinação de Status

```typescript
function getModelStatus(availability: ProviderAvailability): ModelAvailabilityStatus {
  // Modelo não tem registry = não configurado
  if (!availability.hasRegistry) {
    return 'unconfigured';
  }
  
  // Modelo tem registry mas falhou certificação = indisponível
  if (availability.certification?.status === 'failed') {
    return 'unavailable';
  }
  
  // Modelo tem registry e passou certificação = disponível
  return 'available';
}
```

## Manutenção

### Adicionar Novo Vendor ao Mapeamento

Edite a função `mapProviderToVendor()`:

```typescript
function mapProviderToVendor(providerName: string): string {
  const lower = providerName.toLowerCase();
  if (lower.includes('anthropic')) return 'anthropic';
  if (lower.includes('novo-vendor')) return 'novo-vendor'; // ✅ Adicionar aqui
  // ...
}
```

### Atualizar Blacklist

Edite a constante `BLACKLIST`:

```typescript
const BLACKLIST = [
  'amazon.nova-sonic-v1:0',
  'amazon.nova-2-sonic-v1:0',
  'novo-modelo-problematico' // ✅ Adicionar aqui
];
```

### Ajustar Estimativa de Capabilities

Edite a função `estimateCapabilities()`:

```typescript
if (vendor === 'novo-vendor') {
  maxContextWindow = 100000;
  maxOutputTokens = 8000;
  functionCalling = true;
}
```

## Referências

- [Model Registry](../src/services/ai/registry/model-registry.ts)
- [Test All Models](./test-all-models.ts)
- [Providers Controller](../src/controllers/providersController.ts)
- [Vendors Types](../src/types/vendors.ts)
