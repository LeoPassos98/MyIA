# Plano de Migração: Modelos com Inference Profile Obrigatório

**Data:** 2026-01-30  
**Autor:** Architect Mode  
**Status:** 📋 PLANEJAMENTO - Aguardando Aprovação

---

## 📋 Sumário Executivo

### Objetivo

Migrar a aplicação MyIA para usar **APENAS modelos com Inference Profile**, eliminando modelos obsoletos e simplificando o código.

### Motivação

1. **Modelos Modernos**: Focar em modelos 2024-2025 com melhor performance
2. **Código Mais Simples**: Padronizar formato `{region}.{modelId}` para todos
3. **Melhor Disponibilidade**: Cross-region inference automático
4. **Preparado para Futuro**: AWS está migrando nessa direção

### Escopo

- **Filtrar registry**: Manter apenas modelos com `supportsInferenceProfile: true`
- **Remover auto-test**: Sistema de 3 variações no [`bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:250)
- **Padronizar código**: Sempre usar inference profile format
- **Re-certificar**: ~40 modelos filtrados
- **Atualizar UI**: Mostrar apenas modelos modernos

---

## 🔍 Análise da Documentação AWS

### Descobertas Importantes

#### 1. Formato Correto de Inference Profile IDs

**Documentação AWS confirmada:**

```
Regional Inference Profiles:
- us.{modelId}    (US regions: us-east-1, us-west-2, etc.)
- eu.{modelId}    (EU regions: eu-central-1, eu-west-1, etc.)
- apac.{modelId}  (APAC regions: ap-southeast-1, etc.)

Global Inference Profile:
- global.{modelId} (apenas Claude Sonnet 4.5)
```

**Exemplo:**
```
Model ID: anthropic.claude-sonnet-4-5-20250929-v1:0
Regional: us.anthropic.claude-sonnet-4-5-20250929-v1:0
Global:   global.anthropic.claude-sonnet-4-5-20250929-v1:0
```

#### 2. Extração do Prefixo Regional

**CORRETO:**
```typescript
const region = 'us-east-1';
const regionPrefix = region.split('-')[0]; // 'us' ✅
```

**Regiões suportadas:**
- `us-east-1` → `us`
- `us-west-2` → `us`
- `eu-central-1` → `eu`
- `eu-west-1` → `eu`
- `ap-southeast-1` → `apac` ⚠️ (EXCEÇÃO!)

#### 3. ⚠️ PROBLEMA IDENTIFICADO: Região APAC

**Código atual** ([`bedrock.ts:102`](backend/src/services/ai/providers/bedrock.ts:102)):
```typescript
const regionPrefix = region.split('-')[0]; // 'ap' ❌ ERRADO!
```

**Problema:**
- Região `ap-southeast-1` → extrai `ap`
- AWS espera `apac` (não `ap`)
- Resultado: `ap.anthropic.claude-...` → **ERRO!**

**Solução necessária:**
```typescript
function getRegionPrefix(region: string): string {
  if (region.startsWith('ap-')) {
    return 'apac'; // ✅ CORRETO
  }
  return region.split('-')[0]; // us, eu, etc.
}
```

#### 4. Modelos que REQUEREM Inference Profile

**Confirmado pela documentação e testes:**

- ✅ Claude 4.x (todos)
- ✅ Claude 3.7 Sonnet
- ✅ Claude 3.5 Sonnet v2
- ✅ Claude 3.5 Haiku
- ✅ AWS Nova (alguns modelos)
- ✅ Llama 3.3, 3.2 (alguns modelos)

**Modelos ANTIGOS que NÃO suportam:**
- ❌ Titan Text Lite/Express v1
- ❌ Cohere Command Text
- ❌ AI21 Jurassic-2
- ❌ Embeddings (não são chat)

---

## 🐛 Problemas Passados Identificados

### Problema #1: Região APAC Incorreta

**Evidência:**
- Código atual usa `region.split('-')[0]` sem tratamento especial
- Regiões APAC geram prefixo `ap` ao invés de `apac`
- Erro: `ValidationException: Inference profile ap.{modelId} not found`

**Impacto:**
- Modelos em regiões APAC nunca funcionaram corretamente
- Auto-test mascara o problema tentando outras variações

**Solução:**
- Adicionar função `getRegionPrefix()` com tratamento especial para APAC

### Problema #2: Auto-Test Mascara Erros Reais

**Evidência:**
- Sistema tenta 3 variações de model ID ([`bedrock.ts:250`](backend/src/services/ai/providers/bedrock.ts:250))
- Se uma variação funciona, considera sucesso
- Mas não registra qual variação funcionou

**Impacto:**
- Dificulta debug de problemas
- Não sabemos se inference profile está sendo usado corretamente
- Pode certificar modelo com variação errada

**Solução:**
- Remover auto-test após migração
- Usar APENAS inference profile format
- Falhar explicitamente se não funcionar

### Problema #3: Modelos Obsoletos no Registry

**Evidência:**
- Registry contém modelos que não suportam inference profile
- Alguns modelos estão marcados incorretamente

**Impacto:**
- Usuários veem modelos que não funcionarão
- Certificação falha sem explicação clara

**Solução:**
- Filtrar registry para remover modelos obsoletos
- Manter apenas modelos com `supportsInferenceProfile: true`

---

## 🎯 Decisões Arquiteturais

### Decisão #1: Usar APENAS Modelos com Inference Profile

**Justificativa:**
1. **Modelos Modernos**: Claude 4.x, Nova, Llama 3.3 são superiores
2. **Melhor Suporte AWS**: Cross-region inference, maior throughput
3. **Código Mais Simples**: Sem lógica condicional complexa
4. **Preparado para Futuro**: AWS está descontinuando modelos antigos

**Alternativas Consideradas:**
- ❌ Manter ambos (com e sem profile): Código complexo, difícil manter
- ❌ Migração gradual: Prolonga problema, mais bugs

**Decisão Final:** ✅ Migração completa e imediata

### Decisão #2: Remover Sistema de Auto-Test

**Justificativa:**
1. **Mascara Problemas**: Dificulta debug
2. **Latência Desnecessária**: 3 tentativas por invocação
3. **Não é Mais Necessário**: Com inference profile obrigatório, formato é conhecido

**Alternativas Consideradas:**
- ❌ Manter auto-test: Complexidade desnecessária
- ❌ Reduzir para 2 variações: Ainda mascara problemas

**Decisão Final:** ✅ Remover completamente após migração

### Decisão #3: Corrigir Região APAC Antes da Migração

**Justificativa:**
1. **Bug Crítico**: Regiões APAC nunca funcionaram
2. **Fácil de Corrigir**: Apenas uma função
3. **Necessário para Migração**: Sem isso, migração falhará em APAC

**Alternativas Consideradas:**
- ❌ Ignorar APAC: Usuários nessas regiões ficariam sem suporte
- ❌ Corrigir depois: Migração falharia

**Decisão Final:** ✅ Corrigir ANTES da migração

### Decisão #4: Estratégia de Migração Completa (Não Gradual)

**Justificativa:**
1. **Menos Complexidade**: Uma mudança grande vs múltiplas pequenas
2. **Menos Bugs**: Sem estado intermediário inconsistente
3. **Mais Rápido**: Uma certificação vs múltiplas

**Alternativas Consideradas:**
- ❌ Migração gradual por vendor: Mais tempo, mais bugs
- ❌ Feature flag: Complexidade desnecessária

**Decisão Final:** ✅ Migração completa em uma release

---

## 📝 Plano de Implementação Detalhado

### Fase 0: Preparação e Análise (1-2h)

#### Tarefa 0.1: Executar Script de Análise
```bash
cd backend
npx ts-node scripts/analyze-chat-models-profiles.ts
```

**Objetivo:** Confirmar números exatos de modelos

**Saída esperada:**
```
Total de modelos ACTIVE: ~108
Modelos de CHAT: ~60-70
Modelos de CHAT com Inference Profile: ~40-50
Modelos de CHAT MODERNOS (2024-2025): ~30-40
```

**Arquivos:** [`backend/scripts/analyze-chat-models-profiles.ts`](backend/scripts/analyze-chat-models-profiles.ts)

#### Tarefa 0.2: Criar Backup do Registry
```bash
cd backend/src/services/ai/registry/models
cp anthropic.models.ts anthropic.models.ts.backup-$(date +%Y%m%d)
cp amazon.models.ts amazon.models.ts.backup-$(date +%Y%m%d)
cp cohere.models.ts cohere.models.ts.backup-$(date +%Y%m%d)
# ... outros vendors
```

**Objetivo:** Permitir rollback rápido se necessário

---

### Fase 1: Correção do Bug APAC (1h)

#### Tarefa 1.1: Criar Função `getRegionPrefix()`

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:80)

**Código:**
```typescript
/**
 * Extrai prefixo regional para inference profile
 * 
 * AWS usa prefixos específicos:
 * - us-east-1, us-west-2 → 'us'
 * - eu-central-1, eu-west-1 → 'eu'
 * - ap-southeast-1, ap-northeast-1 → 'apac' (não 'ap'!)
 * 
 * @param region Região AWS (ex: 'us-east-1')
 * @returns Prefixo regional (ex: 'us', 'eu', 'apac')
 */
function getRegionPrefix(region: string): string {
  // Tratamento especial para regiões APAC
  if (region.startsWith('ap-')) {
    return 'apac';
  }
  
  // Outras regiões: extrair primeiro segmento
  return region.split('-')[0];
}
```

**Testes:**
```typescript
// backend/src/services/ai/providers/__tests__/bedrock.test.ts
describe('getRegionPrefix', () => {
  it('should return "us" for US regions', () => {
    expect(getRegionPrefix('us-east-1')).toBe('us');
    expect(getRegionPrefix('us-west-2')).toBe('us');
  });
  
  it('should return "eu" for EU regions', () => {
    expect(getRegionPrefix('eu-central-1')).toBe('eu');
    expect(getRegionPrefix('eu-west-1')).toBe('eu');
  });
  
  it('should return "apac" for APAC regions', () => {
    expect(getRegionPrefix('ap-southeast-1')).toBe('apac');
    expect(getRegionPrefix('ap-northeast-1')).toBe('apac');
  });
});
```

#### Tarefa 1.2: Atualizar `getInferenceProfileId()`

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:102)

**Antes:**
```typescript
const regionPrefix = region.split('-')[0]; // ❌ ERRADO para APAC
```

**Depois:**
```typescript
const regionPrefix = getRegionPrefix(region); // ✅ CORRETO
```

#### Tarefa 1.3: Testar Correção

**Teste manual:**
```bash
# Configurar região APAC
export AWS_REGION=ap-southeast-1

# Testar modelo
npx ts-node scripts/test-model-after-fix.ts anthropic.claude-sonnet-4-5-20250929-v1:0
```

**Resultado esperado:**
```
✅ Using Inference Profile: apac.anthropic.claude-sonnet-4-5-20250929-v1:0
✅ Model invocation successful
```

---

### Fase 2: Filtrar Registry (2-3h)

#### Tarefa 2.1: Criar Script de Filtragem

**Arquivo:** `backend/scripts/filter-inference-profile-models.ts`

```typescript
import { ModelRegistry } from '../src/services/ai/registry';
import { logger } from '../src/utils/logger';

/**
 * Filtra modelos do registry mantendo apenas os que suportam inference profile
 */
async function filterModels() {
  const allModels = ModelRegistry.getAll();
  
  logger.info(`Total de modelos no registry: ${allModels.length}`);
  
  // Filtrar modelos
  const filteredModels = allModels.filter(model => {
    // 1. Apenas modelos de chat (modalidade TEXT)
    if (!model.capabilities.streaming) {
      logger.debug(`❌ Excluído (não streaming): ${model.modelId}`);
      return false;
    }
    
    // 2. Excluir embeddings
    if (model.modelId.includes('embed')) {
      logger.debug(`❌ Excluído (embedding): ${model.modelId}`);
      return false;
    }
    
    // 3. Apenas modelos com inference profile
    const hasInferenceProfile = model.platformRules?.some(
      rule => rule.rule === 'requires_inference_profile'
    );
    
    if (!hasInferenceProfile) {
      logger.debug(`❌ Excluído (sem inference profile): ${model.modelId}`);
      return false;
    }
    
    // 4. Excluir modelos obsoletos
    const obsoletePatterns = [
      'v1.0', 'v1.2', 'v1.3',
      'titan-text-lite', 'titan-text-express',
      'command-text', 'command-light',
      'j2-'
    ];
    
    const isObsolete = obsoletePatterns.some(pattern => 
      model.modelId.toLowerCase().includes(pattern)
    );
    
    if (isObsolete) {
      logger.debug(`❌ Excluído (obsoleto): ${model.modelId}`);
      return false;
    }
    
    logger.info(`✅ Mantido: ${model.modelId}`);
    return true;
  });
  
  // Estatísticas
  logger.info(`\n📊 Estatísticas:`);
  logger.info(`Total original: ${allModels.length}`);
  logger.info(`Total filtrado: ${filteredModels.length}`);
  logger.info(`Removidos: ${allModels.length - filteredModels.length}`);
  
  // Agrupar por vendor
  const byVendor = filteredModels.reduce((acc, model) => {
    acc[model.vendor] = (acc[model.vendor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  logger.info(`\n📊 Por Vendor:`);
  Object.entries(byVendor).forEach(([vendor, count]) => {
    logger.info(`  ${vendor}: ${count} modelos`);
  });
  
  // Listar modelos removidos
  const removedModels = allModels.filter(m => 
    !filteredModels.find(f => f.modelId === m.modelId)
  );
  
  logger.info(`\n❌ Modelos Removidos (${removedModels.length}):`);
  removedModels.forEach(model => {
    logger.info(`  - ${model.modelId} (${model.vendor})`);
  });
  
  return filteredModels;
}

// Executar
filterModels()
  .then(() => {
    logger.info('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch(error => {
    logger.error('❌ Erro na análise:', error);
    process.exit(1);
  });
```

#### Tarefa 2.2: Executar Análise

```bash
cd backend
npx ts-node scripts/filter-inference-profile-models.ts > filter-results.txt
```

**Revisar resultados** antes de prosseguir!

#### Tarefa 2.3: Atualizar Arquivos de Modelos

**Para cada vendor:**

1. **Anthropic** ([`anthropic.models.ts`](backend/src/services/ai/registry/models/anthropic.models.ts))
   - ✅ Manter: Todos os modelos já têm `requires_inference_profile`
   - ❌ Remover: Nenhum (todos são modernos)

2. **Amazon** ([`amazon.models.ts`](backend/src/services/ai/registry/models/amazon.models.ts))
   - ✅ Manter: Nova Pro, Lite, Micro (2024)
   - ❌ Remover: Titan Text Lite/Express v1 (2023)

3. **Cohere** ([`cohere.models.ts`](backend/src/services/ai/registry/models/cohere.models.ts))
   - ✅ Manter: Command R, Command R+ (2024)
   - ❌ Remover: Command Text, Command Light (2023)

4. **Meta** ([`meta.models.ts`](backend/src/services/ai/registry/models/meta.models.ts))
   - ✅ Manter: Llama 3.3, 3.2 (2024)
   - ❌ Remover: Llama 2 (2023)

5. **Mistral** ([`mistral.models.ts`](backend/src/services/ai/registry/models/mistral.models.ts))
   - ✅ Manter: Mistral Large 2 (2024)
   - ❌ Remover: Mistral 7B v1 (2023)

6. **AI21** ([`ai21.models.ts`](backend/src/services/ai/registry/models/ai21.models.ts))
   - ❌ Remover: Todos (Jurassic-2 é 2023, sem inference profile)

**Exemplo de remoção:**

```typescript
// ❌ REMOVER
{
  modelId: 'amazon.titan-text-lite-v1',
  vendor: 'amazon',
  displayName: 'Titan Text Lite',
  // ... resto do modelo
}
```

#### Tarefa 2.4: Adicionar `supportsInferenceProfile` ao Metadata

**Arquivo:** [`backend/src/services/ai/registry/model-registry.ts`](backend/src/services/ai/registry/model-registry.ts:41)

**Adicionar campo:**
```typescript
export interface ModelMetadata {
  modelId: string;
  vendor: string;
  displayName: string;
  description?: string;
  capabilities: ModelCapabilities;
  supportedPlatforms: string[];
  platformRules?: PlatformRule[];
  adapterClass: string;
  deprecated?: boolean;
  replacedBy?: string;
  recommendedParams?: RecommendedParams;
  supportsInferenceProfile?: boolean; // ✅ NOVO
}
```

**Atualizar todos os modelos:**
```typescript
{
  modelId: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  // ... outros campos
  supportsInferenceProfile: true, // ✅ ADICIONAR
}
```

---

### Fase 3: Simplificar BedrockProvider (2-3h)

#### Tarefa 3.1: Remover Sistema de Auto-Test

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:250)

**Antes (linhas 250-386):**
```typescript
// 🧪 AUTO-TEST: Tentar múltiplas variações do modelId
const modelIdVariations = [
  modelIdWithProfile,
  normalizedModelId,
  normalizedModelId.replace('nova-2-', 'nova-'),
];

for (let i = 0; i < modelIdVariations.length; i++) {
  const testModelId = modelIdVariations[i];
  // ... tentar cada variação ...
}
```

**Depois:**
```typescript
// Usar APENAS inference profile format
const finalModelId = getInferenceProfileId(normalizedModelId, this.region);

logger.info(`🔄 [Bedrock] Using model ID: ${finalModelId}`);

// Retry loop com backoff exponencial
for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
  try {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId: finalModelId, // ✅ Apenas uma variação
      contentType: contentType || 'application/json',
      accept: accept || 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);

    if (!response.body) {
      throw new Error('No response body from AWS Bedrock');
    }

    // ✅ Stream bem-sucedido! Processa chunks
    logger.info(`✅ [Bedrock] SUCCESS with: ${finalModelId}`);
    
    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        const parsed = adapter.parseChunk(chunk);

        if (parsed.type === 'chunk' && parsed.content) {
          yield { type: 'chunk', content: parsed.content };
        } else if (parsed.type === 'done') {
          break;
        } else if (parsed.type === 'error') {
          yield { type: 'error', error: parsed.error || 'Unknown error from adapter' };
          break;
        }
      }
    }
    
    // Se chegou aqui, sucesso completo!
    return;
    
  } catch (error: unknown) {
    // ... tratamento de erro ...
    
    // Verifica se é erro de rate limiting
    if (this.isRateLimitError(error)) {
      const isLastAttempt = attempt === this.retryConfig.maxRetries;
      
      if (isLastAttempt) {
        logger.error(`[BedrockProvider] Rate limit após ${attempt + 1} tentativas`);
        break;
      }
      
      const delayMs = this.calculateRetryDelay(attempt);
      logger.warn(`[BedrockProvider] Rate limit. Aguardando ${delayMs}ms...`);
      
      yield {
        type: 'debug',
        log: `⏳ Rate limit. Aguardando ${Math.round(delayMs / 1000)}s... (${attempt + 1}/${this.retryConfig.maxRetries + 1})`,
      };
      
      await sleep(delayMs);
      continue; // Tenta novamente
    }
    
    // Erro não é de rate limiting - falha definitiva
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`❌ [Bedrock] Failed with ${finalModelId}: ${errorMessage}`);
    break;
  }
}

// Se chegou aqui, todas as tentativas falharam
const errorMessage = lastGlobalError instanceof Error 
  ? lastGlobalError.message 
  : 'Erro desconhecido no AWS Bedrock';
  
logger.error(`❌ [Bedrock] All retries failed for: ${originalModelId}`);

// Categorizar erro para mensagem amigável
const categorizedError = categorizeError(errorMessage);

// ... resto do tratamento de erro ...
```

**Mudanças:**
- ❌ Remove array `modelIdVariations`
- ❌ Remove loop de variações
- ✅ Usa apenas `finalModelId` (com inference profile)
- ✅ Mantém retry para rate limiting
- ✅ Falha explicitamente se não funcionar

#### Tarefa 3.2: Atualizar `getInferenceProfileId()`

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:80)

**Antes:**
```typescript
function getInferenceProfileId(modelId: string, region: string): string {
  const baseModelId = normalizeModelId(modelId);
  
  // Se já tem prefixo de região, retornar como está
  if (baseModelId.startsWith('us.') || baseModelId.startsWith('eu.')) {
    return baseModelId;
  }
  
  // Verificar se modelo requer inference profile via registry
  try {
    const { ModelRegistry } = require('../registry');
    const platformRule = ModelRegistry.getPlatformRules(baseModelId, 'bedrock');
    
    if (platformRule?.rule === 'requires_inference_profile') {
      const regionPrefix = region.split('-')[0];
      const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
      logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId}`);
      return inferenceProfileId;
    }
  } catch (error) {
    logger.error(`❌ [getInferenceProfileId] Error loading ModelRegistry:`, error);
  }
  
  return baseModelId;
}
```

**Depois:**
```typescript
function getInferenceProfileId(modelId: string, region: string): string {
  const baseModelId = normalizeModelId(modelId);
  
  // Se já tem prefixo de região, retornar como está
  if (baseModelId.startsWith('us.') || 
      baseModelId.startsWith('eu.') || 
      baseModelId.startsWith('apac.') ||
      baseModelId.startsWith('global.')) {
    logger.info(`🔍 [getInferenceProfileId] Model already has regional prefix: ${baseModelId}`);
    return baseModelId;
  }
  
  // ✅ SEMPRE usar inference profile (não mais condicional)
  const regionPrefix = getRegionPrefix(region);
  const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
  
  logger.info(`🔄 [Bedrock] Using Inference Profile: ${inferenceProfileId} (region: ${region})`);
  
  return inferenceProfileId;
}
```

**Mudanças:**
- ❌ Remove verificação de `platformRule` (não mais necessário)
- ✅ SEMPRE adiciona prefixo regional
- ✅ Usa `getRegionPrefix()` (corrige APAC)
- ✅ Adiciona suporte para `apac.` e `global.`

#### Tarefa 3.3: Atualizar Mensagens de Erro

**Arquivo:** [`backend/src/services/ai/providers/bedrock.ts`](backend/src/services/ai/providers/bedrock.ts:389)

**Antes:**
```typescript
yield {
  type: 'error',
  error: friendlyMessage.trim(),
};
```

**Depois:**
```typescript
// Criar mensagem amigável com contexto
let userFriendlyMessage = `❌ Erro ao invocar modelo: ${originalModelId}\n\n`;

if (categorizedError.category === ErrorCategory.PROVISIONING_REQUIRED) {
  userFriendlyMessage += `Este modelo requer habilitação prévia na sua conta AWS.\n\n`;
  userFriendlyMessage += `🔧 Como resolver:\n`;
  userFriendlyMessage += `1. Acesse AWS Console → Bedrock → Model Access\n`;
  userFriendlyMessage += `2. Solicite acesso ao modelo\n`;
  userFriendlyMessage += `3. Aguarde aprovação (pode levar minutos/horas)\n\n`;
  userFriendlyMessage += `📚 Documentação: https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html`;
} else if (categorizedError.category === ErrorCategory.CONFIGURATION_ERROR) {
  userFriendlyMessage += `Problema de configuração detectado.\n\n`;
  userFriendlyMessage += `Possíveis causas:\n`;
  userFriendlyMessage += `• Modelo não disponível na região ${this.region}\n`;
  userFriendlyMessage += `• Inference profile incorreto\n`;
  userFriendlyMessage += `• Modelo requer configuração especial\n\n`;
  userFriendlyMessage += `💡 Tente outro modelo ou verifique a região AWS.`;
} else {
  userFriendlyMessage += `Erro técnico: ${errorMessage}\n\n`;
  userFriendlyMessage += `Região: ${this.region}\n`;
  userFriendlyMessage += `Model ID tentado: ${finalModelId}\n\n`;
  userFriendlyMessage += `💡 Verifique os logs para mais detalhes.`;
}

logger.error(`❌ [Bedrock] Error details:`, {
  originalModelId,
  finalModelId,
  region: this.region,
  category: categorizedError.category,
  severity: categorizedError.severity,
});

yield {
  type: 'error',
  error: userFriendlyMessage.trim(),
};
```

---

### Fase 4: Re-certificar Modelos (3-4h)

#### Tarefa 4.1: Limpar Certificações Antigas

```bash
cd backend
npx ts-node scripts/clear-all-certifications.ts
```

**Objetivo:** Forçar re-certificação de todos os modelos

#### Tarefa 4.2: Executar Certificação em Lote

```bash
cd backend
npx ts-node scripts/recertify-all-models.ts
```

**Monitorar:**
- Quantos modelos passaram
- Quantos falharam
- Quais erros ocorreram

**Resultado esperado:**
```
✅ Certificados: ~35-40 modelos
❌ Falhados: ~5-10 modelos (provisioning required, etc.)
⚠️  Quality Warning: ~5 modelos (latência alta, etc.)
```

#### Tarefa 4.3: Analisar Falhas

```bash
cd backend
npx ts-node scripts/check-failed-certifications.ts
```

**Ações:**
- Identificar modelos que falharam por provisioning
- Marcar como `deprecated` no registry
- Adicionar nota explicativa

---

### Fase 5: Atualizar UI e Documentação (1-2h)

#### Tarefa 5.1: Atualizar Endpoint de Modelos

**Arquivo:** [`backend/src/controllers/providersController.ts`](backend/src/controllers/providersController.ts)

**Adicionar filtro:**
```typescript
async getAvailableModels(req: AuthRequest, res: Response) {
  // ... código existente ...
  
  // ✅ NOVO: Filtrar apenas modelos com inference profile
  const filteredModels = chatModels.filter(model => {
    const metadata = ModelRegistry.getModel(model.apiModelId);
    return metadata?.supportsInferenceProfile === true;
  });
  
  return res.json(jsend.success({
    models: filteredModels,
    totalCount: filteredModels.length,
    region: credentials.region,
    note: 'Showing only modern models with cross-region inference support'
  }));
}
```

#### Tarefa 5.2: Atualizar Documentação

**Arquivos a atualizar:**
1. [`backend/docs/MODEL-REQUIREMENTS.md`](backend/docs/MODEL-REQUIREMENTS.md)
   - Atualizar requisitos
   - Adicionar nota sobre inference profiles obrigatórios

2. [`backend/docs/REGISTRY-MODELS-LIST.md`](backend/docs/REGISTRY-MODELS-LIST.md)
   - Atualizar lista de modelos
   - Remover modelos obsoletos

3. [`README.md`](README.md)
   - Atualizar seção de modelos suportados
   - Adicionar nota sobre regiões APAC

#### Tarefa 5.3: Criar Changelog

**Arquivo:** [`CHANGELOG.md`](CHANGELOG.md)

```markdown
## [2.0.0] - 2026-01-30

### 🚀 Breaking Changes

- **Modelos com Inference Profile Obrigatório**: Aplicação agora usa APENAS modelos com inference profile
- **Modelos Removidos**: Titan Text Lite/Express v1, Cohere Command Text, AI21 Jurassic-2, e outros modelos obsoletos (2023)
- **~40 Modelos Modernos**: Foco em Claude 4.x, Nova, Llama 3.3, Mistral Large 2

### ✨ Features

- **Correção APAC**: Regiões APAC (ap-southeast-1, etc.) agora funcionam corretamente
- **Código Simplificado**: Removido sistema de auto-test (3 variações)
- **Mensagens Melhores**: Erros mais claros e acionáveis

### 🐛 Bug Fixes

- **Região APAC**: Corrigido prefixo `ap` → `apac` para inference profiles
- **Auto-test**: Removido sistema que mascarava erros reais

### 📚 Documentation

- Atualizado MODEL-REQUIREMENTS.md
- Atualizado REGISTRY-MODELS-LIST.md
- Adicionado guia de migração
```

---

## 🚨 Riscos e Mitigações

### Risco #1: Usuários Perdem Acesso a Modelos Antigos

**Probabilidade:** Alta
**Impacto:** Médio

**Descrição:**
- Usuários que usavam Titan Text Lite, Cohere Command Text, etc. perderão acesso
- Podem ter workflows dependentes desses modelos

**Mitigação:**
1. **Comunicação Prévia:**
   - Anunciar mudança com 1 semana de antecedência
   - Listar modelos que serão removidos
   - Sugerir alternativas

2. **Guia de Migração:**
   - Criar tabela de equivalências:
     - Titan Text Lite → Nova Lite
     - Cohere Command Text → Command R
     - AI21 Jurassic-2 → Claude 3 Haiku

3. **Período de Transição:**
   - Manter modelos antigos como `deprecated` por 1 mês
   - Mostrar warning na UI
   - Permitir uso mas alertar sobre remoção futura

### Risco #2: Bugs em Regiões APAC

**Probabilidade:** Média
**Impacto:** Alto

**Descrição:**
- Correção de APAC nunca foi testada em produção
- Pode haver casos edge não cobertos

**Mitigação:**
1. **Testes Extensivos:**
   - Testar em todas as regiões APAC:
     - ap-southeast-1 (Singapore)
     - ap-northeast-1 (Tokyo)
     - ap-south-1 (Mumbai)

2. **Rollback Plan:**
   - Manter código antigo comentado
   - Feature flag para reverter se necessário

3. **Monitoramento:**
   - Logs detalhados de invocações APAC
   - Alertas para erros em regiões específicas

### Risco #3: Certificação Falha em Massa

**Probabilidade:** Baixa
**Impacto:** Alto

**Descrição:**
- Re-certificação de ~40 modelos pode falhar
- Usuários ficam sem modelos disponíveis

**Mitigação:**
1. **Certificação Gradual:**
   - Certificar por vendor (Anthropic → Amazon → Meta → ...)
   - Parar se taxa de falha > 30%

2. **Backup de Certificações:**
   - Exportar certificações atuais antes de limpar
   - Restaurar se necessário

3. **Fallback:**
   - Manter pelo menos Claude 3.5 Sonnet certificado
   - Garantir que há sempre 1 modelo funcional

### Risco #4: Performance Degradada

**Probabilidade:** Baixa
**Impacto:** Médio

**Descrição:**
- Remoção de auto-test pode expor problemas de latência
- Inference profiles podem ter latência maior

**Mitigação:**
1. **Benchmarks:**
   - Medir latência antes e depois
   - Comparar com auto-test

2. **Monitoramento:**
   - Adicionar métricas de latência por região
   - Alertar se latência > 5s

3. **Otimização:**
   - Cache de inference profile IDs
   - Conexões persistentes com AWS

### Risco #5: Modelos Requerem Provisioning

**Probabilidade:** Média
**Impacto:** Médio

**Descrição:**
- Alguns modelos podem requerer provisioning prévio
- Usuários não sabem como habilitar

**Mitigação:**
1. **Detecção Automática:**
   - Categorizar erro "on-demand throughput" corretamente
   - Mensagem clara com passos para habilitar

2. **Documentação:**
   - Guia passo-a-passo para habilitar modelos
   - Screenshots do AWS Console

3. **Pré-validação:**
   - Verificar disponibilidade antes de mostrar na UI
   - Marcar modelos que requerem provisioning

---

## ✅ Checklist de Validação

### Pré-Migração

- [ ] Backup do registry criado
- [ ] Script de análise executado
- [ ] Números confirmados (~40 modelos)
- [ ] Comunicação enviada aos usuários
- [ ] Guia de migração criado

### Fase 1: Correção APAC

- [ ] Função `getRegionPrefix()` criada
- [ ] Testes unitários passando
- [ ] Teste manual em região APAC bem-sucedido
- [ ] Logs confirmam prefixo `apac` correto

### Fase 2: Filtrar Registry

- [ ] Script de filtragem executado
- [ ] Resultados revisados manualmente
- [ ] Modelos obsoletos removidos
- [ ] Campo `supportsInferenceProfile` adicionado
- [ ] Todos os modelos atualizados

### Fase 3: Simplificar BedrockProvider

- [ ] Auto-test removido
- [ ] `getInferenceProfileId()` atualizado
- [ ] Mensagens de erro melhoradas
- [ ] Testes unitários atualizados
- [ ] Testes de integração passando

### Fase 4: Re-certificar

- [ ] Certificações antigas limpas
- [ ] Re-certificação executada
- [ ] Pelo menos 35 modelos certificados
- [ ] Falhas analisadas e documentadas
- [ ] Modelos problemáticos marcados como deprecated

### Fase 5: UI e Documentação

- [ ] Endpoint de modelos atualizado
- [ ] UI mostra apenas modelos modernos
- [ ] MODEL-REQUIREMENTS.md atualizado
- [ ] REGISTRY-MODELS-LIST.md atualizado
- [ ] README.md atualizado
- [ ] CHANGELOG.md criado

### Testes Finais

- [ ] Teste end-to-end em região US
- [ ] Teste end-to-end em região EU
- [ ] Teste end-to-end em região APAC
- [ ] Teste com modelo Claude 4.5 Sonnet
- [ ] Teste com modelo Nova Lite
- [ ] Teste com modelo Llama 3.3
- [ ] Teste de erro (modelo inexistente)
- [ ] Teste de erro (sem permissão)
- [ ] Teste de erro (provisioning required)

### Pós-Migração

- [ ] Monitoramento ativo por 24h
- [ ] Logs revisados para erros
- [ ] Feedback de usuários coletado
- [ ] Métricas de latência analisadas
- [ ] Documentação de rollback preparada

---

## 🔄 Plano de Rollback

### Cenário 1: Bugs Críticos em APAC

**Sintomas:**
- Erros em massa em regiões APAC
- Inference profiles não funcionam

**Ações:**
1. Reverter `getRegionPrefix()`:
   ```typescript
   // Rollback temporário
   function getRegionPrefix(region: string): string {
     return region.split('-')[0]; // Volta ao comportamento antigo
   }
   ```

2. Reativar auto-test:
   ```typescript
   // Adicionar variação sem prefixo
   const modelIdVariations = [
     finalModelId,
     normalizedModelId, // Fallback sem inference profile
   ];
   ```

3. Comunicar usuários APAC sobre problema temporário

### Cenário 2: Certificação Falha em Massa

**Sintomas:**
- Menos de 20 modelos certificados
- Taxa de falha > 50%

**Ações:**
1. Restaurar certificações antigas:
   ```bash
   cd backend
   npx ts-node scripts/restore-certifications.ts backup-20260130.json
   ```

2. Reverter filtro de modelos:
   ```typescript
   // Mostrar todos os modelos temporariamente
   const filteredModels = chatModels; // Sem filtro
   ```

3. Investigar causa raiz antes de tentar novamente

### Cenário 3: Performance Degradada

**Sintomas:**
- Latência > 5s consistentemente
- Timeouts frequentes

**Ações:**
1. Reativar auto-test com timeout menor:
   ```typescript
   const modelIdVariations = [
     finalModelId,
     normalizedModelId,
   ];
   // Timeout: 10s por variação
   ```

2. Adicionar cache de inference profile IDs

3. Investigar latência por região

### Cenário 4: Usuários Insatisfeitos

**Sintomas:**
- Reclamações sobre modelos removidos
- Solicitações para restaurar modelos antigos

**Ações:**
1. Restaurar modelos mais solicitados como `deprecated`:
   ```typescript
   {
     modelId: 'amazon.titan-text-lite-v1',
     deprecated: true,
     replacedBy: 'amazon.nova-lite-v1:0',
     // ... resto do modelo
   }
   ```

2. Mostrar warning na UI:
   ```
   ⚠️ Este modelo será removido em 30 dias.
   Migre para: Nova Lite
   ```

3. Estender período de transição

---

## 📊 Métricas de Sucesso

### Métricas Técnicas

1. **Cobertura de Modelos:**
   - ✅ Alvo: 35-40 modelos certificados
   - ✅ Mínimo aceitável: 30 modelos

2. **Taxa de Sucesso de Certificação:**
   - ✅ Alvo: > 80%
   - ✅ Mínimo aceitável: > 70%

3. **Latência Média:**
   - ✅ Alvo: < 2s (primeira resposta)
   - ✅ Mínimo aceitável: < 3s

4. **Taxa de Erro:**
   - ✅ Alvo: < 5%
   - ✅ Mínimo aceitável: < 10%

### Métricas de Usuário

1. **Satisfação:**
   - ✅ Alvo: > 80% satisfeitos
   - ✅ Mínimo aceitável: > 70%

2. **Adoção de Novos Modelos:**
   - ✅ Alvo: > 50% usando Claude 4.x ou Nova
   - ✅ Mínimo aceitável: > 30%

3. **Reclamações:**
   - ✅ Alvo: < 5 reclamações/semana
   - ✅ Mínimo aceitável: < 10 reclamações/semana

### Métricas de Código

1. **Complexidade:**
   - ✅ Alvo: Redução de 30% em linhas de código
   - ✅ Mínimo aceitável: Redução de 20%

2. **Cobertura de Testes:**
   - ✅ Alvo: > 80%
   - ✅ Mínimo aceitável: > 70%

3. **Bugs Reportados:**
   - ✅ Alvo: < 3 bugs críticos
   - ✅ Mínimo aceitável: < 5 bugs críticos

---

## 📅 Cronograma Estimado

### Semana 1: Preparação e Análise

| Dia | Atividade | Duração | Responsável |
|-----|-----------|---------|-------------|
| 1 | Executar análise e criar backups | 2h | Dev |
| 2 | Revisar resultados e aprovar plano | 1h | Tech Lead |
| 3 | Comunicar mudança aos usuários | 1h | Product |
| 4-5 | Criar guia de migração | 2h | Dev + Docs |

### Semana 2: Implementação

| Dia | Atividade | Duração | Responsável |
|-----|-----------|---------|-------------|
| 1 | Fase 1: Correção APAC | 1h | Dev |
| 1 | Testes APAC | 1h | QA |
| 2 | Fase 2: Filtrar Registry | 3h | Dev |
| 3 | Fase 3: Simplificar Provider | 3h | Dev |
| 4 | Testes unitários e integração | 2h | Dev + QA |
| 5 | Code review | 1h | Tech Lead |

### Semana 3: Certificação e Deploy

| Dia | Atividade | Duração | Responsável |
|-----|-----------|---------|-------------|
| 1 | Fase 4: Re-certificar modelos | 4h | Dev |
| 2 | Analisar falhas e ajustar | 2h | Dev |
| 3 | Fase 5: UI e Documentação | 2h | Dev + Docs |
| 4 | Testes finais end-to-end | 2h | QA |
| 5 | Deploy em produção | 1h | DevOps |

### Semana 4: Monitoramento

| Dia | Atividade | Duração | Responsável |
|-----|-----------|---------|-------------|
| 1-7 | Monitoramento ativo | 1h/dia | Dev + DevOps |
| 7 | Retrospectiva | 1h | Team |

**Total estimado:** 30-35 horas de desenvolvimento

---

## 🎯 Conclusão

### Resumo da Migração

Esta migração representa uma **mudança arquitetural significativa** na aplicação MyIA:

1. **Foco em Modernidade**: Apenas modelos 2024-2025
2. **Simplificação de Código**: Remoção de lógica complexa
3. **Melhor UX**: Mensagens claras e modelos confiáveis
4. **Preparado para Futuro**: Alinhado com direção da AWS

### Próximos Passos Imediatos

1. ✅ **Revisar este plano** com o time
2. ✅ **Aprovar decisões arquiteturais**
3. ✅ **Executar Fase 0** (análise e backups)
4. ✅ **Comunicar usuários** sobre mudança
5. ✅ **Iniciar implementação** (Fase 1)

### Recomendações

1. **Não pular etapas**: Cada fase depende da anterior
2. **Testar extensivamente**: Especialmente regiões APAC
3. **Monitorar de perto**: Primeiras 24h são críticas
4. **Estar preparado para rollback**: Ter plano B sempre pronto

---

**Documento criado em:** 2026-01-30
**Última atualização:** 2026-01-30
**Status:** 📋 PLANEJAMENTO - Aguardando Aprovação
**Versão:** 1.0