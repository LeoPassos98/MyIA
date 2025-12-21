// frontend/src/features/auditPage/types.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Filtros locais da página de auditoria
 */
export interface AuditPageFilters {
  provider: string;
  model: string;
  dateFrom: string;
  dateTo: string;
}

/**
 * Item da tabela (derivado de AuditRecord)
 */
export interface AuditTableRow {
  messageId: string;
  timestamp: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}
