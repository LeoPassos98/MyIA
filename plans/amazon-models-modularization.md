# Plano de Modularização: amazon.models.ts

**Data:** 2026-02-07  
**Arquivo Alvo:** [`backend/src/services/ai/registry/models/amazon.models.ts`](../backend/src/services/ai/registry/models/amazon.models.ts)  
**Tamanho Atual:** 682 linhas (código efetivo: ~599 linhas)  
**Meta:** ≤250 linhas por arquivo  
**Referência:** [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)

---

## 📊 1. Análise da Estrutura Atual

### 1.1 Composição do Arquivo

O arquivo [`amazon.models.ts`](../backend/src/services/ai/registry/models/amazon.models.ts) contém **25 modelos** distribuídos em:

| Família de Modelos | Quantidade | Linhas Aprox. | Características |
|-------------------|------------|---------------|-----------------|
| **Titan Text** | 3 modelos | ~195 linhas | Express, Lite, Premier, TG1-Large |
| **Nova 2.x** | 4 modelos | ~156 linhas | Lite, Micro, Pro, Sonic (nova geração) |
| **Nova 1.x Pro** | 3 modelos | ~117 linhas | Variantes de context window (24k, 300k, default) |
| **Nova 1.x Lite** | 3 modelos | ~117 linhas | Variantes de context window (24k, 300k, default) |
| **Nova 1.x Micro** | 3 modelos | ~117 linhas | Variantes de context window (24k, 128k, default) |
| **Nova 1.x Sonic** | 1 modelo | ~39 linhas | Modelo de alta velocidade |
| **Nova 1.x Premier** | 5 modelos | ~195 linhas | Variantes (8k, 20k, 1000k, mm, default) |
| **Documentação** | - | ~30 linhas | Comentários sobre sufixos e normalização |

**Total:** ~966 linhas (incluindo espaçamento e comentários)

### 1.2 Padrões Identificados

#### Estrutura Repetitiva
Cada modelo segue o padrão [`ModelMetadata`](../backend/src/services/ai/registry/model-registry.ts:41):

```typescript
{
  modelId: string,
  vendor: 'amazon',
  displayName: string,
  description: string,
  capabilities: { streaming, vision, functionCalling, maxContextWindow, maxOutputTokens },
  supportedPlatforms: ['bedrock'],
  platformRules?: [{ platform, rule, config }],
  adapterClass: 'AmazonAdapter',
  recommendedParams: { temperature, topP, topK, maxTokens }
}
```

#### Variações por Família

1. **Titan Text:**
   - Sem `platformRules`
   - Context windows fixos (4k, 8k, 32k)
   - Sem vision/functionCalling

2. **Nova 2.x:**
   - Todos têm `requires_inference_profile`
   - Context windows grandes (128k-300k)
   - Sem vision/functionCalling

3. **Nova 1.x:**
   - Alguns têm `requires_inference_profile` (Premier)
   - Variantes de context window via sufixos (`:8k`, `:24k`, `:300k`)
   - Premier multimodal (`:mm`) tem `vision: true`

### 1.3 Dependências Externas

```typescript
import { ModelRegistry, ModelMetadata } from '../model-registry';
```

**Uso:**
- `ModelRegistry.registerMany(amazonModels)` - Registro automático
- `export { amazonModels }` - Re-exportado via [`index.ts`](../backend/src/services/ai/registry/models/index.ts:27)

**Consumidores:**
- [`index.ts`](../backend/src/services/ai/registry/models/index.ts) - Auto-import e re-export
- Sistema de certificação (via `ModelRegistry`)
- Adapter factory (via `ModelRegistry.getModel()`)

---

## 🎯 2. Proposta de Modularização

### 2.1 Estratégia: Divisão por Família de Modelos

**Justificativa:**
- ✅ Coesão natural (modelos da mesma família compartilham características)
- ✅ Facilita manutenção (atualizações afetam apenas uma família)
- ✅ Escalabilidade (novas famílias = novos arquivos)
- ✅ Alinhamento com documentação AWS (famílias Titan vs Nova)

### 2.2 Estrutura de Módulos Proposta

```
backend/src/services/ai/registry/models/amazon/
├── index.ts                    # Agregador e re-export (30 linhas)
├── titan.models.ts             # Família Titan (130 linhas)
├── nova-2.models.ts            # Nova 2.x (160 linhas)
├── nova-1-premier.models.ts    # Nova 1.x Premier (200 linhas)
├── nova-1-core.models.ts       # Nova 1.x Pro/Lite/Micro/Sonic (240 linhas)
└── shared.ts                   # Constantes e tipos compartilhados (40 linhas)
```

**Total:** 6 arquivos, média de ~133 linhas/arquivo

### 2.3 Detalhamento dos Módulos

#### 📄 `shared.ts` (40 linhas)
```typescript
// Constantes compartilhadas
export const AMAZON_VENDOR = 'amazon';
export const AMAZON_ADAPTER = 'AmazonAdapter';
export const AMAZON_PLATFORM = 'bedrock';

// Parâmetros padrão
export const DEFAULT_AMAZON_PARAMS = {
  temperature: 0.7,
  topP: 0.9,
  topK: 250,
  maxTokens: 2048,
};

// Regra de inference profile
export const INFERENCE_PROFILE_RULE = {
  platform: 'bedrock' as const,
  rule: 'requires_inference_profile',
  config: { profileFormat: '{region}.{modelId}' },
};

// Documentação de sufixos (comentário)
export const CONTEXT_WINDOW_SUFFIXES_DOC = `
/**
 * SUFIXOS DE CONTEXT WINDOW SUPORTADOS
 * ...
 */
`;
```

#### 📄 `titan.models.ts` (130 linhas)
```typescript
import { ModelMetadata } from '../../model-registry';
import { AMAZON_VENDOR, AMAZON_ADAPTER, AMAZON_PLATFORM, DEFAULT_AMAZON_PARAMS } from './shared';

export const titanModels: ModelMetadata[] = [
  // Titan Text Express (8k)
  // Titan Text Lite (4k)
  // Titan Text Premier (32k)
  // Titan TG1 Large (128k)
];
```

**Características:**
- 4 modelos
- Sem platformRules
- Context windows fixos
- Sem vision/functionCalling

#### 📄 `nova-2.models.ts` (160 linhas)
```typescript
import { ModelMetadata } from '../../model-registry';
import { AMAZON_VENDOR, AMAZON_ADAPTER, AMAZON_PLATFORM, DEFAULT_AMAZON_PARAMS, INFERENCE_PROFILE_RULE } from './shared';

export const nova2Models: ModelMetadata[] = [
  // Nova 2 Lite (300k)
  // Nova 2 Lite (256k)
  // Nova 2 Micro (128k)
  // Nova 2 Pro (300k)
  // Nova 2 Sonic (300k)
];
```

**Características:**
- 5 modelos (nova geração)
- Todos com `requires_inference_profile`
- Context windows grandes (128k-300k)
- Sem vision/functionCalling

#### 📄 `nova-1-premier.models.ts` (200 linhas)
```typescript
import { ModelMetadata } from '../../model-registry';
import { AMAZON_VENDOR, AMAZON_ADAPTER, AMAZON_PLATFORM, DEFAULT_AMAZON_PARAMS, INFERENCE_PROFILE_RULE } from './shared';

export const novaPremierModels: ModelMetadata[] = [
  // Nova Premier (8k)
  // Nova Premier (20k)
  // Nova Premier (1000k)
  // Nova Premier (multimodal)
  // Nova Premier (default 300k)
];
```

**Características:**
- 5 modelos (linha premium)
- Todos com `requires_inference_profile`
- Variantes de context window (8k-1M)
- Multimodal variant (`:mm`) com `vision: true`

#### 📄 `nova-1-core.models.ts` (240 linhas)
```typescript
import { ModelMetadata } from '../../model-registry';
import { AMAZON_VENDOR, AMAZON_ADAPTER, AMAZON_PLATFORM, DEFAULT_AMAZON_PARAMS } from './shared';

export const novaCoreModels: ModelMetadata[] = [
  // Nova Pro (24k, 300k, default)
  // Nova Lite (24k, 300k, default)
  // Nova Micro (24k, 128k, default)
  // Nova Sonic (300k)
];
```

**Características:**
- 10 modelos (linha core)
- Sem platformRules
- Variantes de context window
- Sem vision/functionCalling

#### 📄 `index.ts` (30 linhas)
```typescript
import { ModelRegistry } from '../../model-registry';
import { titanModels } from './titan.models';
import { nova2Models } from './nova-2.models';
import { novaPremierModels } from './nova-1-premier.models';
import { novaCoreModels } from './nova-1-core.models';

// Agregação
export const amazonModels = [
  ...titanModels,
  ...nova2Models,
  ...novaPremierModels,
  ...novaCoreModels,
];

// Auto-registro
ModelRegistry.registerMany(amazonModels);

// Re-export individual
export { titanModels, nova2Models, novaPremierModels, novaCoreModels };
```

---

## 📁 3. Estrutura de Diretórios

### 3.1 Estrutura Atual
```
backend/src/services/ai/registry/models/
├── ai21.models.ts
├── amazon.models.ts          ← 682 linhas (CRÍTICO)
├── anthropic.models.ts       ← 417 linhas (ATENÇÃO)
├── cohere.models.ts          ← 128 linhas (OK)
├── google.models.ts
├── meta.models.ts
├── minimax.models.ts
├── mistral.models.ts
├── moonshot.models.ts
├── nvidia.models.ts
├── openai.models.ts
├── qwen.models.ts
├── twelvelabs.models.ts
└── index.ts
```

### 3.2 Estrutura Proposta
```
backend/src/services/ai/registry/models/
├── ai21.models.ts
├── amazon/                    ← NOVO DIRETÓRIO
│   ├── index.ts              ← Agregador (30 linhas)
│   ├── shared.ts             ← Constantes (40 linhas)
│   ├── titan.models.ts       ← Titan (130 linhas)
│   ├── nova-2.models.ts      ← Nova 2.x (160 linhas)
│   ├── nova-1-premier.models.ts  ← Premier (200 linhas)
│   └── nova-1-core.models.ts     ← Core (240 linhas)
├── anthropic.models.ts       ← Próximo candidato (417 linhas)
├── cohere.models.ts
├── google.models.ts
├── meta.models.ts
├── minimax.models.ts
├── mistral.models.ts
├── moonshot.models.ts
├── nvidia.models.ts
├── openai.models.ts
├── qwen.models.ts
├── twelvelabs.models.ts
└── index.ts                  ← Atualizar import
```

### 3.3 Mudanças no `index.ts` Principal

**Antes:**
```typescript
import './amazon.models';
export * from './amazon.models';
```

**Depois:**
```typescript
import './amazon'; // Importa amazon/index.ts automaticamente
export * from './amazon'; // Re-exporta amazonModels
```

**Compatibilidade:** ✅ Zero breaking changes (mesmo export público)

---

## 🔄 4. Ordem de Implementação

### Fase 1: Preparação (Sem Breaking Changes)
**Objetivo:** Criar estrutura sem afetar código existente

1. **Criar diretório `amazon/`**
   ```bash
   mkdir -p backend/src/services/ai/registry/models/amazon
   ```

2. **Criar `shared.ts`**
   - Extrair constantes comuns
   - Documentação de sufixos
   - Validar compilação

3. **Criar módulos individuais**
   - `titan.models.ts`
   - `nova-2.models.ts`
   - `nova-1-premier.models.ts`
   - `nova-1-core.models.ts`
   - Validar cada arquivo individualmente

4. **Criar `amazon/index.ts`**
   - Agregar todos os modelos
   - Auto-registro
   - Re-exports

5. **Validação de integridade**
   ```bash
   npm run type-check
   npm run lint
   ```

### Fase 2: Migração (Transição Segura)
**Objetivo:** Substituir arquivo antigo mantendo compatibilidade

6. **Atualizar `models/index.ts`**
   ```typescript
   // Antes
   import './amazon.models';
   export * from './amazon.models';
   
   // Depois
   import './amazon';
   export * from './amazon';
   ```

7. **Testes de integração**
   ```bash
   # Verificar registro de modelos
   npx tsx backend/scripts/database/list-registry-models.ts | grep amazon
   
   # Verificar certificação
   npm test -- --grep "amazon"
   ```

8. **Validação de API pública**
   - `ModelRegistry.getModelsByVendor('amazon')` retorna 25 modelos
   - `ModelRegistry.getModel('amazon.nova-premier-v1:0')` funciona
   - Adapter factory resolve `AmazonAdapter` corretamente

### Fase 3: Limpeza (Remoção do Legado)
**Objetivo:** Remover arquivo antigo após validação completa

9. **Backup do arquivo original**
   ```bash
   mv backend/src/services/ai/registry/models/amazon.models.ts \
      backend/src/services/ai/registry/models/amazon.models.ts.backup
   ```

10. **Validação final**
    - Executar suite completa de testes
    - Verificar certificações existentes
    - Testar inferências com modelos Amazon

11. **Commit e documentação**
    ```bash
    git add backend/src/services/ai/registry/models/amazon/
    git commit -m "refactor: modularize amazon.models.ts (599→240 lines max)"
    ```

12. **Remover backup (após 1 semana de validação)**
    ```bash
    rm backend/src/services/ai/registry/models/amazon.models.ts.backup
    ```

---

## ⚠️ 5. Riscos e Mitigações

### 5.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Quebra de imports externos** | Baixa | Alto | Manter export público idêntico via `amazon/index.ts` |
| **Duplicação de modelos** | Média | Médio | Validar contagem de modelos antes/depois (25 modelos) |
| **Perda de documentação** | Baixa | Baixo | Mover comentários de sufixos para `shared.ts` |
| **Erro de tipagem** | Baixa | Médio | Executar `npm run type-check` em cada fase |
| **Certificações quebradas** | Baixa | Alto | Testar certificação de 1 modelo por família |
| **Adapter factory falha** | Baixa | Alto | Validar `ModelRegistry.getModel()` para cada família |

### 5.2 Plano de Rollback

**Se algo der errado:**

1. **Reverter commit:**
   ```bash
   git revert HEAD
   ```

2. **Restaurar backup:**
   ```bash
   mv backend/src/services/ai/registry/models/amazon.models.ts.backup \
      backend/src/services/ai/registry/models/amazon.models.ts
   ```

3. **Reverter `index.ts`:**
   ```bash
   git checkout HEAD~1 backend/src/services/ai/registry/models/index.ts
   ```

4. **Validar restauração:**
   ```bash
   npm run type-check
   npm test
   ```

### 5.3 Checklist de Validação

**Antes de cada fase:**
- [ ] Backup do estado atual
- [ ] Branch de trabalho criado (`refactor/amazon-models-modularization`)
- [ ] Testes passando (baseline)

**Após cada fase:**
- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem erros críticos
- [ ] Contagem de modelos: 25 modelos Amazon
- [ ] `ModelRegistry.count()` inalterado
- [ ] Testes de integração passando

**Antes do merge:**
- [ ] Code review aprovado
- [ ] Certificação de 1 modelo por família (5 testes)
- [ ] Inferência real testada (1 modelo)
- [ ] Documentação atualizada
- [ ] Changelog atualizado

---

## 📋 6. Padrão Replicável para Outros Vendors

### 6.1 Candidatos para Modularização

| Arquivo | Linhas | Status | Prioridade |
|---------|--------|--------|------------|
| [`anthropic.models.ts`](../backend/src/services/ai/registry/models/anthropic.models.ts) | 417 | ⚠️ ATENÇÃO | Alta |
| [`google.models.ts`](../backend/src/services/ai/registry/models/google.models.ts) | ? | ? | Média |
| [`meta.models.ts`](../backend/src/services/ai/registry/models/meta.models.ts) | ? | ? | Média |

### 6.2 Template de Modularização

**Estrutura genérica:**
```
models/{vendor}/
├── index.ts              # Agregador
├── shared.ts             # Constantes do vendor
├── {family-1}.models.ts  # Família 1
├── {family-2}.models.ts  # Família 2
└── {family-n}.models.ts  # Família N
```

**Exemplo para Anthropic:**
```
models/anthropic/
├── index.ts
├── shared.ts
├── claude-3.models.ts    # Claude 3 (Opus, Sonnet, Haiku)
├── claude-3-5.models.ts  # Claude 3.5 (Sonnet v1/v2, Haiku)
├── claude-4.models.ts    # Claude 4 (Opus, Sonnet)
└── claude-4-5.models.ts  # Claude 4.5 (Opus, Sonnet, Haiku)
```

### 6.3 Critérios de Divisão

**Quando modularizar:**
- ✅ Arquivo > 400 linhas (bloqueado)
- ✅ Arquivo > 300 linhas (recomendado)
- ✅ Múltiplas famílias de modelos (>3)
- ✅ Padrões repetitivos (>70% código similar)

**Como dividir:**
1. **Por família de modelos** (preferencial)
   - Exemplo: Titan vs Nova, Claude 3 vs Claude 4
2. **Por geração** (alternativo)
   - Exemplo: Nova 1.x vs Nova 2.x
3. **Por capacidade** (caso especial)
   - Exemplo: Multimodal vs Text-only

---

## 🎯 7. Benefícios Esperados

### 7.1 Manutenibilidade
- ✅ Arquivos menores (130-240 linhas vs 682)
- ✅ Responsabilidade única (1 família por arquivo)
- ✅ Fácil localização de modelos
- ✅ Redução de conflitos em PRs

### 7.2 Escalabilidade
- ✅ Adicionar nova família = novo arquivo
- ✅ Atualizar família = editar 1 arquivo
- ✅ Deprecar família = remover 1 arquivo
- ✅ Padrão replicável para outros vendors

### 7.3 Conformidade
- ✅ Atende [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199)
- ✅ Passa pre-commit hook (≤400 linhas)
- ✅ Melhora métricas de qualidade do projeto
- ✅ Facilita code review

### 7.4 Performance
- ⚠️ **Impacto neutro:** Auto-registro continua no boot
- ✅ Imports mais granulares (se necessário no futuro)
- ✅ Tree-shaking potencial (se migrar para lazy loading)

---

## 📊 8. Métricas de Sucesso

### 8.1 Métricas Quantitativas

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| **Linhas por arquivo** | 682 | 130-240 | ≤250 |
| **Arquivos críticos (>400)** | 1 | 0 | 0 |
| **Arquivos atenção (300-400)** | 0 | 0 | 0 |
| **Total de modelos** | 25 | 25 | 25 |
| **Cobertura de testes** | ? | ? | 100% |

### 8.2 Métricas Qualitativas

- [ ] Code review aprovado sem ressalvas
- [ ] Zero breaking changes reportados
- [ ] Documentação clara e completa
- [ ] Padrão adotado por outros vendors
- [ ] Feedback positivo da equipe

### 8.3 Validação de Integridade

**Comando de validação:**
```bash
# Contar modelos registrados
npx tsx -e "
import './backend/src/services/ai/registry/models';
import { ModelRegistry } from './backend/src/services/ai/registry/model-registry';
const amazon = ModelRegistry.getModelsByVendor('amazon');
console.log('Amazon models:', amazon.length);
console.log('Expected: 25');
console.log('Status:', amazon.length === 25 ? '✅ PASS' : '❌ FAIL');
"
```

**Resultado esperado:**
```
Amazon models: 25
Expected: 25
Status: ✅ PASS
```

---

## 🔗 9. Referências

### 9.1 Documentação Interna
- [STANDARDS.md Seção 15](../docs/STANDARDS.md:1199) - Tamanho de Arquivos
- [STANDARDS.md Seção 4](../docs/STANDARDS.md:117) - Arquitetura Backend
- [FILE_SIZE_ANALYSIS_REPORT.md](../docs/FILE_SIZE_ANALYSIS_REPORT.md) - Análise de tamanhos

### 9.2 Arquivos Relacionados
- [`model-registry.ts`](../backend/src/services/ai/registry/model-registry.ts) - Interface de registro
- [`anthropic.models.ts`](../backend/src/services/ai/registry/models/anthropic.models.ts) - Próximo candidato
- [`cohere.models.ts`](../backend/src/services/ai/registry/models/cohere.models.ts) - Exemplo de arquivo saudável

### 9.3 Scripts Úteis
- [`analyze-file-sizes.ts`](../backend/scripts/analysis/analyze-file-sizes.ts) - Análise de tamanhos
- [`list-registry-models.ts`](../backend/scripts/database/list-registry-models.ts) - Listar modelos registrados

---

## ✅ 10. Checklist de Implementação

### Preparação
- [ ] Criar branch `refactor/amazon-models-modularization`
- [ ] Backup do arquivo original
- [ ] Validar testes baseline (todos passando)

### Fase 1: Estrutura
- [ ] Criar diretório `amazon/`
- [ ] Criar `shared.ts` com constantes
- [ ] Criar `titan.models.ts` (130 linhas)
- [ ] Criar `nova-2.models.ts` (160 linhas)
- [ ] Criar `nova-1-premier.models.ts` (200 linhas)
- [ ] Criar `nova-1-core.models.ts` (240 linhas)
- [ ] Criar `amazon/index.ts` (30 linhas)
- [ ] Validar `npm run type-check`
- [ ] Validar `npm run lint`

### Fase 2: Migração
- [ ] Atualizar `models/index.ts`
- [ ] Testar registro de modelos (25 modelos)
- [ ] Testar `ModelRegistry.getModel()` para cada família
- [ ] Testar adapter factory
- [ ] Executar testes de integração

### Fase 3: Validação
- [ ] Certificar 1 modelo por família (5 testes)
- [ ] Testar inferência real (1 modelo)
- [ ] Code review
- [ ] Atualizar documentação
- [ ] Atualizar CHANGELOG.md

### Fase 4: Finalização
- [ ] Merge para main
- [ ] Remover backup (após 1 semana)
- [ ] Documentar padrão para outros vendors
- [ ] Criar issue para `anthropic.models.ts`

---

## 📝 11. Notas de Implementação

### 11.1 Considerações Especiais

**Sufixos de Context Window:**
- Documentação deve permanecer visível (mover para `shared.ts`)
- Normalização é feita pelo adapter (não afeta registro)
- UI mostra sufixo, AWS recebe ID base

**Inference Profiles:**
- Nova 2.x e Premier requerem `requires_inference_profile`
- Core models (Pro/Lite/Micro/Sonic v1) não requerem
- Validar regra em cada módulo

**Multimodal:**
- Apenas `nova-premier-v1:0:mm` tem `vision: true`
- Outros modelos Nova são text-only
- Validar capability em testes

### 11.2 Comandos Úteis

```bash
# Contar linhas de código (sem comentários/vazias)
cloc backend/src/services/ai/registry/models/amazon.models.ts

# Validar estrutura de imports
npx madge --circular backend/src/services/ai/registry/models/

# Verificar exports públicos
npx tsx -e "import { amazonModels } from './backend/src/services/ai/registry/models'; console.log(amazonModels.length);"

# Testar certificação
npm test -- --grep "amazon.*certification"
```

### 11.3 Padrão de Commit

```bash
# Fase 1
git commit -m "refactor(models): create amazon/ directory structure"
git commit -m "refactor(models): extract shared constants for Amazon models"
git commit -m "refactor(models): modularize Titan models (130 lines)"
git commit -m "refactor(models): modularize Nova 2.x models (160 lines)"
git commit -m "refactor(models): modularize Nova Premier models (200 lines)"
git commit -m "refactor(models): modularize Nova Core models (240 lines)"
git commit -m "refactor(models): create amazon/index.ts aggregator"

# Fase 2
git commit -m "refactor(models): migrate models/index.ts to use amazon/"

# Fase 3
git commit -m "refactor(models): remove legacy amazon.models.ts (682→240 lines max)"
git commit -m "docs: update CHANGELOG for amazon.models modularization"
```

---

## 🎓 12. Lições Aprendidas (Para Próximas Modularizações)

### 12.1 O Que Funcionou Bem
- ✅ Divisão por família de modelos (coesão natural)
- ✅ Constantes compartilhadas (`shared.ts`)
- ✅ Agregador transparente (`index.ts`)
- ✅ Zero breaking changes (compatibilidade total)

### 12.2 O Que Evitar
- ❌ Divisão por capacidade (vision/streaming) - baixa coesão
- ❌ Divisão por tamanho de context window - acoplamento artificial
- ❌ Múltiplos níveis de diretórios - complexidade desnecessária

### 12.3 Recomendações para Anthropic
- Dividir por geração: Claude 3, 3.5, 4, 4.5
- Manter Opus/Sonnet/Haiku juntos (mesma geração)
- Extrair constantes de inference profile
- Validar 11 modelos após migração

---

**Plano criado por:** Kilo Code (Architect Mode)  
**Revisão necessária:** Code Mode (implementação)  
**Estimativa de implementação:** 2-3 horas (todas as fases)  
**Risco geral:** 🟢 Baixo (padrão bem estabelecido, zero breaking changes)
