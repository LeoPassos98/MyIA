// backend/src/services/ai/certification/errors/index.ts
// Standards: docs/STANDARDS.md

/**
 * Sistema modular de categorização de erros usando Strategy Pattern
 * 
 * Exporta API pública compatível com código existente
 */

export {
  categorizeError,
  isModelAvailable,
  shouldRetry,
  getRetryDelay
} from './ErrorCategorizer';

export type {
  IErrorCategory,
  IMatcher,
  RetryConfig,
  MatchResult
} from './types';
