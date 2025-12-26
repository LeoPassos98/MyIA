// frontend/src/features/audit/constants/auditViewMode.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import type { AuditMode } from '../types';

/**
 * Conceitos de visualização de auditoria:
 * 
 * - human: Visualização humanizada, traduzida para linguagem natural
 * - technical: Visualização técnica, JSON cru (raw audit)
 */
export type AuditViewMode = 'human' | 'technical';

/**
 * Mapeamento de modos de auditoria para conceitos de visualização.
 * 
 * Define qual tipo de visualização deve ser usada para cada modo:
 * - payload → human (mostra o que foi enviado de forma legível)
 * - response → human (mostra a resposta de forma legível)
 * - context → human (mostra o contexto de forma legível)
 * 
 * Fonte única de verdade para decisões de visualização.
 */
export const AUDIT_MODE_TO_VIEW: Record<AuditMode, AuditViewMode> = {
  payload: 'human',
  response: 'human',
  context: 'human',
} as const;

/**
 * Determina o modo de visualização para um AuditMode específico.
 * 
 * @param mode - O modo de auditoria
 * @returns O conceito de visualização correspondente
 */
export function getViewModeForAuditMode(mode: AuditMode): AuditViewMode {
  return AUDIT_MODE_TO_VIEW[mode];
}
