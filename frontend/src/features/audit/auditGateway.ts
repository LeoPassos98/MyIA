// frontend/src/features/audit/auditGateway.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import type { AuditIntent, AuditState } from './types';

/**
 * Gateway de auditoria: gerencia intenção de auditoria
 * Independente de React, UI ou backend
 */
class AuditGateway {
  private currentAudit: AuditState = null;
  private listeners: Set<(state: AuditState) => void> = new Set();

  /**
   * Abre uma nova auditoria
   */
  openAudit(intent: AuditIntent): void {
    this.currentAudit = intent;
    this.notifyListeners();
  }

  /**
   * Fecha a auditoria atual
   */
  closeAudit(): void {
    this.currentAudit = null;
    this.notifyListeners();
  }

  /**
   * Retorna o estado atual da auditoria
   */
  getCurrentAudit(): AuditState {
    return this.currentAudit;
  }

  /**
   * Registra listener para mudanças de estado
   */
  subscribe(listener: (state: AuditState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentAudit));
  }
}

export const auditGateway = new AuditGateway();
