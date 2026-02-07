// frontend/src/hooks/useCostEstimate.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * @deprecated Este arquivo foi modularizado. Use 'hooks/cost' em vez disso.
 * 
 * Migração:
 * ANTES: import { useCostEstimate } from '@/hooks/useCostEstimate';
 * DEPOIS: import { useCostEstimate } from '@/hooks/cost';
 * 
 * Este arquivo mantém re-exports para backward compatibility.
 * Será removido em versão futura.
 * 
 * @see frontend/src/hooks/cost/
 */

// Re-exports para manter compatibilidade
export {
  useCostEstimate,
  useConversationCostEstimate,
  useCostComparison,
  useCheapestModel
} from './cost';

export type {
  CostEstimate,
  ModelForComparison,
  CostComparisonResult,
  SortBy
} from './cost';
