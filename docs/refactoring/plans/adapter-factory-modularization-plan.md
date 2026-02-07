# Plano de Modularização: AdapterFactory

**Arquivo:** [`backend/src/services/ai/adapters/adapter-factory.ts`](backend/src/services/ai/adapters/adapter-factory.ts:1)  
**Linhas:** 288  
**Data:** 2026-02-07  
**Padrões Aplicados:** Strategy Pattern + Registry Pattern

---

## 1. Objetivo da Modularização

Refatorar [`AdapterFactory`](backend/src/services/ai/adapters/adapter-factory.ts:57) para eliminar complexidade ciclomática e aplicar princípios SOLID, especialmente **Open/Closed Principle**, permitindo extensibilidade sem modificação do código core.

### Problemas Identificados

1. **Alta Complexidade Ciclomática (22)**
   - Switch gigante em [`createLegacyAdapter`](backend/src/services/ai/adapters/adapter-factory.ts:101) (linhas 102-111)
   - Múltiplos condicionais em [`detectVendor`](backend/src/services/ai/adapters/adapter-factory.ts:221) (linhas 221-248)
   - Lógica aninhada em [`detectInferenceType`](backend/src/services/ai/adapters/adapter-factory.ts:118) (linhas 118-147)

2. **Baixa Extensibilidade**
   - Adicionar novo vendor requer modificar 4 locais diferentes
   - Mapa hardcoded [`adapterMap`](backend/src/services/ai/adapters/adapter-factory.ts:33) (linhas 33-52)
   - Lista hardcoded de vendors conhecidos (linha 232)

3. **Código Duplicado**
   - Detecção de vendor repetida em múltiplos métodos
   - Validação de modelId espalhada
   - Lógica de fallback duplicada

4. **Violação de Princípios SOLID**
   - **Open/Closed**: Factory não é aberta para extensão
   - **Single Responsibility**: Factory faz detecção, validação, criação e cache
   - **Dependency Inversion**: Dependências concretas hardcoded

---

## 2. Análise de Responsabilidades Atuais

### 2.1 Responsabilidades Misturadas

| Responsabilidade | Linhas | Problema |
|------------------|--------|----------|
| Criação de adapters | 64-96 | Misturada com detecção |
| Detecção de vendor | 221-248 | Lógica complexa inline |
| Detecção de inference type | 118-147 | Consulta registry + regex |
| Cache de adapters | 58-59, 161-170 | Responsabilidade extra |
| Validação de suporte | 256-263 | Acoplada à criação |
| Fallback legado | 101-112 | Switch gigante |

### 2.2 Dependências Problemáticas

```typescript
// Imports hardcoded (linhas 15-21)
import { AnthropicAdapter } from './anthropic.adapter';
import { AmazonAdapter } from './amazon.adapter';
import { CohereAdapter } from './cohere.adapter';
import { AnthropicProfileAdapter, AmazonProfileAdapter } from './inference-profile';
```

**Problema:** Adicionar novo adapter requer modificar imports e mapa.

---

## 3. Estrutura de Módulos Proposta

```
backend/src/services/ai/adapters/
├── adapter-factory.ts (80 linhas) ← Factory simplificada
├── registry/
│   ├── adapter-registry.ts (100 linhas) ← Registro dinâmico
│   └── vendor-detector.ts (70 linhas) ← Detecção centralizada
├── loaders/
│   ├── adapter-loader.ts (60 linhas) ← Carregamento lazy
│   └── adapter-validator.ts (50 linhas) ← Validação isolada
└── strategies/
    ├── vendor-strategy.interface.ts (40 linhas) ← Contrato
    ├── anthropic-strategy.ts (30 linhas)
    ├── amazon-strategy.ts (30 linhas)
    ├── cohere-strategy.ts (30 linhas)
    └── index.ts (20 linhas) ← Auto-registro
```

**Total:** ~510 linhas (vs 288 originais)  
**Ganho:** Extensibilidade, testabilidade, manutenibilidade

---

## 4. Interfaces e Contratos

### 4.1 Strategy Pattern: VendorStrategy

```typescript
// strategies/vendor-strategy.interface.ts
export interface VendorStrategy {
  readonly vendor: string;
  readonly supportedInferenceTypes: InferenceType[];
  
  // Detecção
  canHandle(modelId: string): boolean;
  detectInferenceType(modelId: string): InferenceType;
  
  // Criação
  createAdapter(inferenceType: InferenceType): BaseModelAdapter;
  
  // Validação
  validateModelId(modelId: string): boolean;
  normalizeModelId(modelId: string): string;
}
```

**Benefícios:**
- Cada vendor implementa sua própria lógica
- Facilita testes unitários isolados
- Permite adicionar vendors sem modificar factory

### 4.2 Registry Pattern: AdapterRegistry

```typescript
// registry/adapter-registry.ts
export interface AdapterRegistration {
  vendor: string;
  strategy: VendorStrategy;
  priority: number; // Para resolver conflitos
}

export class AdapterRegistry {
  private strategies: Map<string, VendorStrategy>;
  private detectionOrder: string[]; // Ordem de tentativa
  
  register(registration: AdapterRegistration): void;
  unregister(vendor: string): void;
  
  getStrategy(vendor: string): VendorStrategy | undefined;
  findStrategyForModel(modelId: string): VendorStrategy | undefined;
  
  getAllVendors(): string[];
  isVendorSupported(vendor: string): boolean;
}
```

**Benefícios:**
- Registro dinâmico em runtime
- Suporte a plugins/extensões
- Facilita testes com mocks

### 4.3 Detector: VendorDetector

```typescript
// registry/vendor-detector.ts
export interface DetectionRule {
  pattern: RegExp;
  vendor: string;
  priority: number;
}

export class VendorDetector {
  private rules: DetectionRule[];
  
  addRule(rule: DetectionRule): void;
  detect(modelId: string): string | null;
  
  // Detecção por padrões comuns
  detectByPrefix(modelId: string): string | null;
  detectByInferenceProfile(modelId: string): string | null;
  detectByDirectApi(modelId: string): string | null;
}
```

**Benefícios:**
- Centraliza lógica de detecção
- Regras configuráveis
- Fácil adicionar novos padrões

---

## 5. Estratégia de Migração

### 5.1 Fase 1: Criar Infraestrutura (Sem Breaking Changes)

**Objetivo:** Criar novos módulos mantendo código existente funcionando.

**Passos:**

1. **Criar interfaces** (`strategies/vendor-strategy.interface.ts`)
   - Definir contrato `VendorStrategy`
   - Documentar métodos obrigatórios

2. **Implementar AdapterRegistry** (`registry/adapter-registry.ts`)
   - Sistema de registro dinâmico
   - Métodos de busca e validação
   - Suporte a prioridades

3. **Implementar VendorDetector** (`registry/vendor-detector.ts`)
   - Extrair lógica de [`detectVendor`](backend/src/services/ai/adapters/adapter-factory.ts:221)
   - Adicionar sistema de regras
   - Testes unitários isolados

4. **Criar strategies iniciais**
   - [`AnthropicStrategy`](backend/src/services/ai/adapters/anthropic.adapter.ts:1) (baseado em adapter existente)
   - [`AmazonStrategy`](backend/src/services/ai/adapters/amazon.adapter.ts:1)
   - [`CohereStrategy`](backend/src/services/ai/adapters/cohere.adapter.ts:1)

**Validação:** Testes unitários de cada módulo isoladamente.

### 5.2 Fase 2: Integração Gradual (Feature Flag)

**Objetivo:** Integrar novos módulos com fallback para código legado.

**Implementação:**

```typescript
// adapter-factory.ts (refatorado)
export class AdapterFactory {
  private static registry = new AdapterRegistry();
  private static detector = new VendorDetector();
  
  static createAdapter(vendor: string, inferenceType?: InferenceType): BaseModelAdapter {
    const useNewSystem = process.env.USE_STRATEGY_PATTERN === 'true';
    
    if (useNewSystem) {
      return this.createAdapterV2(vendor, inferenceType);
    }
    
    // Fallback para código legado
    return this.createLegacyAdapter(vendor);
  }
  
  private static createAdapterV2(vendor: string, inferenceType?: InferenceType): BaseModelAdapter {
    const strategy = this.registry.getStrategy(vendor);
    if (!strategy) {
      throw new Error(`Vendor not supported: ${vendor}`);
    }
    
    const type = inferenceType || 'ON_DEMAND';
    return strategy.createAdapter(type);
  }
  
  // Manter código legado temporariamente
  private static createLegacyAdapter(vendor: string): BaseModelAdapter { /* ... */ }
}
```

**Validação:**
- Testes A/B com feature flag
- Monitorar logs de erros
- Comparar comportamento legado vs novo

### 5.3 Fase 3: Auto-Registro de Strategies

**Objetivo:** Eliminar imports hardcoded.

**Implementação:**

```typescript
// strategies/index.ts
import { AdapterRegistry } from '../registry/adapter-registry';
import { AnthropicStrategy } from './anthropic-strategy';
import { AmazonStrategy } from './amazon-strategy';
import { CohereStrategy } from './cohere-strategy';

export function registerAllStrategies(registry: AdapterRegistry): void {
  registry.register({ vendor: 'anthropic', strategy: new AnthropicStrategy(), priority: 10 });
  registry.register({ vendor: 'amazon', strategy: new AmazonStrategy(), priority: 10 });
  registry.register({ vendor: 'cohere', strategy: new CohereStrategy(), priority: 10 });
}

// Inicialização automática
if (process.env.USE_STRATEGY_PATTERN === 'true') {
  registerAllStrategies(AdapterFactory.getRegistry());
}
```

**Validação:**
- Verificar registro automático no startup
- Testar adição de novo vendor sem modificar factory

### 5.4 Fase 4: Remoção de Código Legado

**Objetivo:** Remover código antigo após validação completa.

**Passos:**

1. Confirmar 100% dos casos de uso cobertos
2. Remover métodos `createLegacyAdapter`, `getAdapter` (deprecated)
3. Remover `adapterMap` hardcoded (linhas 33-52)
4. Remover feature flag `USE_NEW_ADAPTERS`
5. Atualizar documentação

**Validação:**
- Executar suite completa de testes
- Validar em ambiente de staging
- Monitorar métricas de erro

---

## 6. Exemplo de Implementação: AnthropicStrategy

```typescript
// strategies/anthropic-strategy.ts
export class AnthropicStrategy implements VendorStrategy {
  readonly vendor = 'anthropic';
  readonly supportedInferenceTypes: InferenceType[] = [
    'ON_DEMAND',
    'INFERENCE_PROFILE',
    'PROVISIONED',
    'CROSS_REGION'
  ];
  
  canHandle(modelId: string): boolean {
    return modelId.startsWith('anthropic.') || 
           modelId.startsWith('claude-') ||
           /\.(anthropic)\./i.test(modelId); // Inference Profile
  }
  
  detectInferenceType(modelId: string): InferenceType {
    if (/^(us|eu|apac)\.anthropic\./i.test(modelId)) {
      return 'INFERENCE_PROFILE';
    }
    if (modelId.startsWith('arn:aws:bedrock')) {
      return 'PROVISIONED';
    }
    return 'ON_DEMAND';
  }
  
  createAdapter(inferenceType: InferenceType): BaseModelAdapter {
    switch (inferenceType) {
      case 'INFERENCE_PROFILE':
        return new AnthropicProfileAdapter();
      case 'ON_DEMAND':
      case 'PROVISIONED':
      case 'CROSS_REGION':
      default:
        return new AnthropicAdapter();
    }
  }
  
  validateModelId(modelId: string): boolean {
    return this.canHandle(modelId);
  }
  
  normalizeModelId(modelId: string): string {
    // Lógica específica de normalização Anthropic
    return modelId.replace(':', '.');
  }
}
```

---

## 7. Benefícios da Modularização

### 7.1 Extensibilidade

**Antes:** Adicionar novo vendor requer modificar 4 arquivos
```typescript
// 1. Imports
import { NewVendorAdapter } from './new-vendor.adapter';

// 2. adapterMap
const adapterMap = {
  // ...
  newvendor: { ON_DEMAND: NewVendorAdapter, /* ... */ }
};

// 3. createLegacyAdapter switch
case 'newvendor': return new NewVendorAdapter();

// 4. detectVendor
if (modelId.startsWith('newvendor-')) return 'newvendor';
```

**Depois:** Criar apenas 1 arquivo
```typescript
// strategies/new-vendor-strategy.ts
export class NewVendorStrategy implements VendorStrategy {
  readonly vendor = 'newvendor';
  // Implementar interface...
}

// Auto-registro em strategies/index.ts
registry.register({ vendor: 'newvendor', strategy: new NewVendorStrategy(), priority: 10 });
```

### 7.2 Testabilidade

**Antes:** Testar factory requer mockar todos os adapters

**Depois:** Testar cada strategy isoladamente
```typescript
describe('AnthropicStrategy', () => {
  it('should detect inference profile format', () => {
    const strategy = new AnthropicStrategy();
    expect(strategy.detectInferenceType('us.anthropic.claude-3')).toBe('INFERENCE_PROFILE');
  });
});
```

### 7.3 Manutenibilidade

- **Separação de Responsabilidades:** Cada módulo tem função única
- **Baixo Acoplamento:** Strategies não dependem umas das outras
- **Alta Coesão:** Lógica relacionada agrupada

---

## 8. Checklist de Validação

### 8.1 Funcionalidade

- [ ] Todos os vendors existentes funcionam (anthropic, amazon, cohere)
- [ ] Detecção de inference type mantém comportamento original
- [ ] Cache de adapters funciona corretamente
- [ ] Fallback para ON_DEMAND funciona
- [ ] Método `getAdapterForModel` retorna adapter correto
- [ ] Validação de modelId funciona

### 8.2 Compatibilidade

- [ ] API pública mantém mesma assinatura
- [ ] Código cliente não precisa modificações
- [ ] Testes existentes continuam passando
- [ ] Feature flag permite rollback seguro

### 8.3 Extensibilidade

- [ ] Adicionar novo vendor não modifica factory
- [ ] Registro dinâmico funciona em runtime
- [ ] Prioridades de detecção respeitadas
- [ ] Strategies podem ser substituídas

### 8.4 Performance

- [ ] Tempo de criação de adapter não aumenta >10%
- [ ] Detecção de vendor não aumenta >5%
- [ ] Memória não aumenta significativamente
- [ ] Cache continua efetivo

### 8.5 Qualidade de Código

- [ ] Complexidade ciclomática <10 por método
- [ ] Cobertura de testes >80%
- [ ] Sem duplicação de código
- [ ] Documentação atualizada

---

## 9. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Breaking changes em API pública | Alto | Baixo | Manter métodos legados como deprecated |
| Regressão em detecção de vendor | Alto | Médio | Testes extensivos + feature flag |
| Performance degradada | Médio | Baixo | Benchmarks antes/depois |
| Complexidade aumentada | Médio | Médio | Documentação clara + exemplos |
| Dificuldade em rollback | Alto | Baixo | Feature flag + código legado mantido |

---

## 10. Estimativa de Esforço

### 10.1 Desenvolvimento

| Fase | Tarefas | Complexidade |
|------|---------|--------------|
| **Fase 1: Infraestrutura** | Criar interfaces, registry, detector, strategies | Média |
| **Fase 2: Integração** | Integrar com factory, feature flag, testes A/B | Média |
| **Fase 3: Auto-Registro** | Sistema de registro automático | Baixa |
| **Fase 4: Limpeza** | Remover código legado, atualizar docs | Baixa |

### 10.2 Testes

| Tipo | Escopo | Complexidade |
|------|--------|--------------|
| **Unitários** | Cada strategy, registry, detector | Baixa |
| **Integração** | Factory com strategies, auto-registro | Média |
| **E2E** | Fluxo completo de criação de adapter | Média |
| **Regressão** | Validar comportamento original mantido | Alta |

### 10.3 Validação

- **Code Review:** Revisão detalhada de cada PR
- **Testes Manuais:** Validar casos de uso principais
- **Staging:** Deploy em ambiente de testes
- **Monitoramento:** Métricas de erro e performance

---

## 11. Próximos Passos

1. **Aprovação do Plano:** Revisar com time técnico
2. **Criar Issues:** Quebrar em tarefas menores no backlog
3. **Priorizar Fase 1:** Começar pela infraestrutura
4. **Setup de Testes:** Preparar ambiente de testes A/B
5. **Implementação Iterativa:** Desenvolver fase por fase
6. **Validação Contínua:** Testar cada fase antes de avançar
7. **Documentação:** Atualizar docs conforme progresso
8. **Rollout Gradual:** Feature flag → Staging → Produção

---

## 12. Referências

- [`adapter-factory.ts`](backend/src/services/ai/adapters/adapter-factory.ts:1) - Código original
- [`base.adapter.ts`](backend/src/services/ai/adapters/base.adapter.ts:1) - Interface base
- [`model-registry.ts`](backend/src/services/ai/registry/model-registry.ts:1) - Registry existente
- [STANDARDS.md](docs/STANDARDS.md:1) - Padrões do projeto
- Strategy Pattern: Design Patterns (GoF)
- Registry Pattern: Martin Fowler's PoEAA
