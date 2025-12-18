// frontend/src/features/audit/types.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Modo de auditoria: o que está sendo auditado
 */
export type AuditMode = 'payload' | 'response' | 'context';

/**
 * Origem da auditoria: de onde veio a requisição
 */
export type AuditSource = 'chat' | 'history' | 'system';

/**
 * Intenção de auditoria: dados mínimos para abrir uma auditoria
 */
export interface AuditIntent {
  messageId: string;
  mode: AuditMode;
  source: AuditSource;
}

/**
 * Estado atual da auditoria
 * null = nenhuma auditoria ativa
 */
export type AuditState = AuditIntent | null;
