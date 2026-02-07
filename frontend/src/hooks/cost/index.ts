// frontend/src/hooks/cost/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Cost Estimation Module
 *
 * Módulo centralizado para estimativa de custos de modelos de IA.
 * Exporta hooks, tipos e utilitários.
 *
 * @module hooks/cost
 */

// ============================================================================
// Hooks Principais
// ============================================================================

export { useCostEstimate } from './useCostEstimate';
export type { CostEstimate } from './useCostEstimate';

export { useConversationCostEstimate } from './useConversationCostEstimate';

export { useCostComparison, useCheapestModel } from './useCostComparison';
export type { 
  ModelForComparison, 
  CostComparisonResult,
  SortBy 
} from './useCostComparison';

// ============================================================================
// Data & Types
// ============================================================================

export { 
  MODEL_PRICING,
  getModelPricing,
  hasModelPricing,
  getAvailableModels,
  getPricingStats
} from './data/modelPricing';
export type { ModelPricing, ModelId } from './data/modelPricing';

// ============================================================================
// Calculators
// ============================================================================

export { CostCalculator } from './calculators/CostCalculator';
export type { 
  CostCalculationInput,
  CostCalculationResult 
} from './calculators/CostCalculator';

export { TokenCalculator } from './calculators/TokenCalculator';
export type { 
  Message,
  TokenAggregation 
} from './calculators/TokenCalculator';

// ============================================================================
// Formatters
// ============================================================================

export { CostFormatter } from './formatters/CostFormatter';
export type { FormatOptions } from './formatters/CostFormatter';
