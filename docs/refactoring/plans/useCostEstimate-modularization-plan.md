# Plano de Modularização: useCostEstimate.ts

**Arquivo:** [`frontend/src/hooks/useCostEstimate.ts`](../../../frontend/src/hooks/useCostEstimate.ts:1)  
**Tamanho Atual:** 296 linhas  
**Tamanho Alvo:** ~490 linhas (distribuídas em 9 arquivos)  
**Complexidade:** Média  
**Prioridade:** Alta

---

## 1. Objetivo da Modularização

### Problemas Identificados
1. **Múltiplas Responsabilidades**: 3 hooks diferentes no mesmo arquivo
2. **Dados Hardcoded**: Tabela de preços inline (50+ linhas, linhas 22-52)
3. **Lógica Duplicada**: Cálculo de custo repetido em 3 lugares (linhas 143-145, 278-280)
4. **Baixa Extensibilidade**: Adicionar modelo requer editar arquivo principal
5. **Formatação Inline**: Lógica de formatação misturada com cálculo

### Objetivos
- ✅ Separar dados (pricing) de lógica (cálculo) de apresentação (formatação)
- ✅ Eliminar duplicação de código de cálculo
- ✅ Facilitar atualização de preços (arquivo separado)
- ✅ Hooks mais focados e reutilizáveis
- ✅ Manter backward compatibility (re-exports)

---

## 2. Análise de Responsabilidades Atuais

### Hook 1: `useCostEstimate` (linhas 114-159)
**Responsabilidade:** Estimar custo de uma única interação  
**Entradas:** provider, modelId, inputTokens, outputTokens  
**Saída:** CostEstimate  
**Problemas:**
- Lógica de cálculo inline (linhas 143-145)
- Formatação inline via função auxiliar
- Acessa MODEL_PRICING diretamente

### Hook 2: `useConversationCostEstimate` (linhas 211-233)
**Responsabilidade:** Estimar custo de conversa completa  
**Entradas:** provider, modelId, messages[]  
**Saída:** CostEstimate  
**Problemas:**
- Apenas agrega tokens e delega para useCostEstimate
- Poderia ser utilitário puro

### Hook 3: `useCostComparison` (linhas 256-296)
**Responsabilidade:** Comparar custos entre modelos  
**Entradas:** models[], inputTokens, outputTokens  
**Saída:** Array<CostEstimate>  
**Problemas:**
- **Duplica lógica de cálculo** (linhas 278-280 = linhas 143-145)
- Acessa MODEL_PRICING diretamente
- Formatação inline duplicada

### Dados: `MODEL_PRICING` (linhas 22-52)
**Responsabilidade:** Tabela de preços por modelo  
**Estrutura:** Record<string, { input: number; output: number }>  
**Problemas:**
- 31 linhas de dados hardcoded
- Dificulta atualização de preços
- Sem tipagem forte para modelIds

### Utilitário: `formatCost` (linhas 167-185)
**Responsabilidade:** Formatar custo para exibição  
**Lógica:** Regras de formatação por faixa de valor  
**Problemas:**
- Função privada não reutilizável
- Lógica de apresentação misturada

---

## 3. Estrutura de Módulos Proposta

```
frontend/src/hooks/cost/
├── index.ts                          (30 linhas)  - Re-exports públicos
├── useCostEstimate.ts                (80 linhas)  - Hook principal refatorado
├── useConversationCostEstimate.ts    (60 linhas)  - Hook de conversa
├── useCostComparison.ts              (70 linhas)  - Hook de comparação
├── data/
│   └── modelPricing.ts               (100 linhas) - Tabela de preços + tipos
├── calculators/
│   ├── CostCalculator.ts             (60 linhas)  - Lógica de cálculo
│   └── TokenCalculator.ts            (50 linhas)  - Agregação de tokens
└── formatters/
    └── CostFormatter.ts              (40 linhas)  - Formatação de custos
```

**Total:** ~490 linhas (vs 296 originais)  
**Overhead:** +194 linhas (+65%) - justificado pela separação de responsabilidades

---

## 4. Interfaces e Contratos

### 4.1 Tipos Base (`data/modelPricing.ts`)

```typescript
export interface ModelPricing {
  input: number;   // USD por 1M tokens
  output: number;  // USD por 1M tokens
}

export type ModelId = string; // Ex: "anthropic:claude-3-5-sonnet-20241022"

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  // Dados migrados do arquivo original
};

export function getModelPricing(provider: string, modelId: string): ModelPricing | null;
```

### 4.2 Calculadora de Custo (`calculators/CostCalculator.ts`)

```typescript
export interface CostCalculationInput {
  inputTokens: number;
  outputTokens: number;
  pricing: ModelPricing;
}

export interface CostCalculationResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export class CostCalculator {
  static calculate(input: CostCalculationInput): CostCalculationResult;
}
```

### 4.3 Calculadora de Tokens (`calculators/TokenCalculator.ts`)

```typescript
export interface Message {
  role: 'user' | 'assistant';
  tokens: number;
}

export interface TokenAggregation {
  inputTokens: number;
  outputTokens: number;
}

export class TokenCalculator {
  static aggregateFromMessages(messages: Message[]): TokenAggregation;
}
```

### 4.4 Formatador de Custo (`formatters/CostFormatter.ts`)

```typescript
export interface FormatOptions {
  showCurrency?: boolean;
  locale?: string;
}

export class CostFormatter {
  static format(cost: number, options?: FormatOptions): string;
  static formatRange(min: number, max: number): string;
}
```

### 4.5 Interface Pública (`index.ts`)

```typescript
export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: 'USD';
  formatted: string;
  hasPricing: boolean;
}

// Re-exports
export { useCostEstimate } from './useCostEstimate';
export { useConversationCostEstimate } from './useConversationCostEstimate';
export { useCostComparison } from './useCostComparison';
```

---

## 5. Estratégia de Migração

### Fase 1: Preparação (Sem Breaking Changes)
1. ✅ Criar estrutura de diretórios `frontend/src/hooks/cost/`
2. ✅ Extrair `MODEL_PRICING` para `data/modelPricing.ts`
3. ✅ Criar `CostCalculator` com lógica centralizada
4. ✅ Criar `TokenCalculator` para agregação
5. ✅ Criar `CostFormatter` com função `formatCost`

**Validação:** Testes unitários para cada módulo isolado

### Fase 2: Refatoração dos Hooks
6. ✅ Refatorar `useCostEstimate` para usar CostCalculator
7. ✅ Mover `useConversationCostEstimate` para arquivo separado
8. ✅ Refatorar `useCostComparison` para usar CostCalculator
9. ✅ Criar `index.ts` com re-exports

**Validação:** Testes de integração dos hooks

### Fase 3: Migração de Importações
10. ✅ Atualizar imports em componentes para `hooks/cost`
11. ✅ Deprecar arquivo original (manter por 1 sprint)
12. ✅ Remover arquivo original após confirmação

**Validação:** Build sem erros, testes E2E passando

---

## 6. Detalhamento dos Módulos

### 6.1 `data/modelPricing.ts` (100 linhas)

**Responsabilidade:** Centralizar dados de preços  
**Conteúdo:**
- Tipos: `ModelPricing`, `ModelId`
- Constante: `MODEL_PRICING` (migrada das linhas 22-52)
- Função: `getModelPricing(provider, modelId)`
- Função: `hasModelPricing(provider, modelId)`

**Benefícios:**
- Atualização de preços em único lugar
- Tipagem forte para modelIds
- Facilita integração futura com API de pricing

### 6.2 `calculators/CostCalculator.ts` (60 linhas)

**Responsabilidade:** Lógica de cálculo de custo  
**Métodos:**
- `calculate(input)`: Calcula custos (elimina duplicação linhas 143-145 e 278-280)
- `calculateForModel(provider, modelId, tokens)`: Wrapper com lookup de pricing

**Elimina Duplicação:**
```typescript
// ANTES (duplicado em 2 lugares):
const inputCost = (inputTokens / 1_000_000) * pricing.input;
const outputCost = (outputTokens / 1_000_000) * pricing.output;
const totalCost = inputCost + outputCost;

// DEPOIS (centralizado):
const result = CostCalculator.calculate({ inputTokens, outputTokens, pricing });
```

### 6.3 `calculators/TokenCalculator.ts` (50 linhas)

**Responsabilidade:** Agregação de tokens de mensagens  
**Métodos:**
- `aggregateFromMessages(messages)`: Soma tokens por role (linhas 217-230)
- `estimateOutputTokens(inputTokens, ratio)`: Estimativa baseada em ratio

### 6.4 `formatters/CostFormatter.ts` (40 linhas)

**Responsabilidade:** Formatação de custos  
**Métodos:**
- `format(cost)`: Migração da função `formatCost` (linhas 167-185)
- `formatRange(min, max)`: Para comparações
- `formatBreakdown(estimate)`: Detalhamento input/output

### 6.5 `useCostEstimate.ts` (80 linhas)

**Responsabilidade:** Hook principal simplificado  
**Mudanças:**
- Remove lógica de cálculo inline → usa `CostCalculator`
- Remove formatação inline → usa `CostFormatter`
- Remove acesso direto a `MODEL_PRICING` → usa `getModelPricing`

**Estrutura:**
```typescript
export function useCostEstimate(...): CostEstimate {
  const pricing = useMemo(() => getModelPricing(provider, modelId), [provider, modelId]);
  
  return useMemo(() => {
    if (!pricing) return createEmptyEstimate();
    
    const result = CostCalculator.calculate({ inputTokens, outputTokens, pricing });
    const formatted = CostFormatter.format(result.totalCost);
    
    return { ...result, currency: 'USD', formatted, hasPricing: true };
  }, [pricing, inputTokens, outputTokens]);
}
```

### 6.6 `useConversationCostEstimate.ts` (60 linhas)

**Responsabilidade:** Hook de conversa (arquivo separado)  
**Mudanças:**
- Usa `TokenCalculator.aggregateFromMessages`
- Delega cálculo para `useCostEstimate`

### 6.7 `useCostComparison.ts` (70 linhas)

**Responsabilidade:** Hook de comparação (arquivo separado)  
**Mudanças:**
- Remove duplicação de cálculo → usa `CostCalculator`
- Adiciona opções de ordenação (custo, nome, provider)

---

## 7. Backward Compatibility

### Estratégia de Re-exports

**`frontend/src/hooks/cost/index.ts`:**
```typescript
// Re-exports para manter compatibilidade
export { useCostEstimate } from './useCostEstimate';
export { useConversationCostEstimate } from './useConversationCostEstimate';
export { useCostComparison } from './useCostComparison';
export type { CostEstimate } from './useCostEstimate';
```

**Arquivo original (deprecado):**
```typescript
// @deprecated Use 'hooks/cost' instead
export { useCostEstimate, useConversationCostEstimate, useCostComparison } from './cost';
```

### Migração de Imports

**ANTES:**
```typescript
import { useCostEstimate } from '@/hooks/useCostEstimate';
```

**DEPOIS:**
```typescript
import { useCostEstimate } from '@/hooks/cost';
```

---

## 8. Checklist de Validação

### Testes Unitários
- [ ] `CostCalculator.calculate()` com diferentes valores
- [ ] `CostCalculator.calculate()` com valores zero
- [ ] `TokenCalculator.aggregateFromMessages()` com mensagens mistas
- [ ] `CostFormatter.format()` para todas as faixas de valor
- [ ] `getModelPricing()` com modelos válidos/inválidos

### Testes de Integração
- [ ] `useCostEstimate` retorna mesmos valores que versão original
- [ ] `useConversationCostEstimate` agrega tokens corretamente
- [ ] `useCostComparison` ordena por custo corretamente
- [ ] Re-exports funcionam sem quebrar imports existentes

### Testes de Regressão
- [ ] Componentes que usam hooks renderizam sem erros
- [ ] Valores formatados aparecem corretamente na UI
- [ ] Performance não degradou (benchmark com 100 modelos)

### Validação Manual
- [ ] Atualizar preço em `modelPricing.ts` reflete na UI
- [ ] Adicionar novo modelo requer apenas editar `modelPricing.ts`
- [ ] Build de produção sem warnings

---

## 9. Estimativa de Esforço

### Desenvolvimento
- **Fase 1 (Preparação):** 4-6 horas
  - Criar módulos de dados e calculadoras
  - Testes unitários
  
- **Fase 2 (Refatoração):** 3-4 horas
  - Refatorar hooks
  - Testes de integração
  
- **Fase 3 (Migração):** 2-3 horas
  - Atualizar imports
  - Validação E2E

**Total:** 9-13 horas

### Testes e Validação
- Testes unitários: 2-3 horas
- Testes de integração: 1-2 horas
- Validação manual: 1 hora

**Total:** 4-6 horas

### **Esforço Total:** 13-19 horas (~2-3 dias)

---

## 10. Riscos e Mitigações

### Risco 1: Breaking Changes em Componentes
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Mitigação:** Re-exports mantêm compatibilidade; deprecar arquivo original gradualmente

### Risco 2: Performance Degradada
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:** Calculadoras são classes estáticas (sem overhead); benchmarks antes/depois

### Risco 3: Preços Desatualizados
**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:** Documentar processo de atualização; considerar API de pricing futura

---

## 11. Próximos Passos

1. ✅ Revisar e aprovar este plano
2. ✅ Criar branch `refactor/cost-estimate-modularization`
3. ✅ Implementar Fase 1 (módulos base)
4. ✅ Code review + testes unitários
5. ✅ Implementar Fase 2 (refatoração hooks)
6. ✅ Code review + testes integração
7. ✅ Implementar Fase 3 (migração)
8. ✅ Validação E2E + merge

---

## 12. Referências

- Arquivo original: [`frontend/src/hooks/useCostEstimate.ts`](../../../frontend/src/hooks/useCostEstimate.ts:1)
- Standards: [`docs/STANDARDS.md`](../../STANDARDS.md:1)
- Padrão de modularização: [`docs/refactoring/plans/`](./README.md:1)

---

**Documento gerado para uso por IA**  
**Última atualização:** 2026-02-07
