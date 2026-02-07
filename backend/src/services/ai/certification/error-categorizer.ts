// backend/src/services/ai/certification/error-categorizer.ts
// Standards: docs/STANDARDS.md

/**
 * @deprecated Este arquivo foi modularizado usando Strategy Pattern
 * 
 * O sistema de categorização de erros foi refatorado em módulos especializados:
 * - backend/src/services/ai/certification/errors/
 * 
 * Este arquivo agora apenas re-exporta a API pública do novo sistema
 * para manter compatibilidade com código existente.
 * 
 * Nova estrutura:
 * - errors/ErrorCategorizer.ts - Orquestrador principal
 * - errors/categories/ - 10 categorias especializadas
 * - errors/matchers/ - Estratégias de matching
 * - errors/registry/ - Registro de categorias
 * 
 * Plano de modularização: docs/refactoring/plans/error-categorizer-modularization-plan.md
 * 
 * @see backend/src/services/ai/certification/errors/
 */

// Re-exportar API pública do novo sistema modular
export {
  categorizeError,
  isModelAvailable,
  shouldRetry,
  getRetryDelay
} from './errors';
