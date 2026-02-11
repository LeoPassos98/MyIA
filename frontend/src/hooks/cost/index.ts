// frontend/src/hooks/cost/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Cost Estimation Module
 *
 * Módulo centralizado para estimativa de custos de modelos de IA.
 * Exporta hooks, tipos e utilitários.
 * 
 * Versão v2: Preços são buscados da API v2 (/api/v2/deployments)
 * e expressos em custo por 1M tokens (padrão da indústria).
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
// Calculators
// ============================================================================

export { CostCalculator } from './calculators/CostCalculator';
export type { 
  ModelPricing,
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

// ============================================================================
// Services (API v2)
// ============================================================================

export { 
  deploymentPricingService,
  getDeploymentPricing,
  getDeploymentPricingSync,
  hasDeploymentPricing,
  getActiveDeployments,
  invalidateDeploymentsCache,
  preloadDeploymentsCache
} from '../../services/deploymentPricingService';
export type { 
  DeploymentPricing,
  Deployment 
} from '../../services/deploymentPricingService';
