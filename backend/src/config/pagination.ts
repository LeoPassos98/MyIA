// backend/src/config/pagination.ts
// Standards: docs/STANDARDS.md

/**
 * Constantes de paginação para toda a aplicação
 * 
 * Referência: plans/MITIGACAO-INCONSISTENCIA-LIMIT-VALIDACAO.md
 * 
 * Estas constantes garantem consistência na validação de parâmetros
 * de paginação em todas as rotas da API.
 */
export const PAGINATION_LIMITS = {
  /** Limite padrão de itens por página */
  DEFAULT: 20,
  /** Limite mínimo de itens por página */
  MIN: 1,
  /** Limite máximo de itens por página */
  MAX: 100
} as const;

export type PaginationLimits = typeof PAGINATION_LIMITS;
