// frontend/src/features/audit/context/AuditContext.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auditGateway } from '../auditGateway';
import type { AuditIntent, AuditState } from '../types';

interface AuditContextValue {
  readonly auditState: AuditState;
  readonly openAudit: (intent: AuditIntent) => void;
  readonly closeAudit: () => void;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [auditState, setAuditState] = useState<AuditState>(
    auditGateway.getCurrentAudit()
  );

  useEffect(() => {
    const unsubscribe = auditGateway.subscribe(setAuditState);
    return unsubscribe;
  }, []);

  const openAudit = (intent: AuditIntent) => {
    auditGateway.openAudit(intent);
  };

  const closeAudit = () => {
    auditGateway.closeAudit();
  };

  return (
    <AuditContext.Provider value={{ auditState, openAudit, closeAudit }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit(): AuditContextValue {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit deve ser usado dentro de AuditProvider');
  }
  return context;
}
