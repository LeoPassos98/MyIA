// frontend/src/features/auditPage/hooks/useAuditSummary.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo } from 'react';
import { AuditTableRow } from '../types';

export interface AuditSummary {
  totalRecords: number;
  totalTokens: number;
  totalCost: number;
  avgCost: number;
}

export function useAuditSummary(records: AuditTableRow[]): AuditSummary {
  return useMemo(() => {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalTokens: 0,
        totalCost: 0,
        avgCost: 0,
      };
    }

    const totalTokens = records.reduce((sum, record) => sum + record.totalTokens, 0);
    const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
    const avgCost = totalCost / records.length;

    return {
      totalRecords: records.length,
      totalTokens,
      totalCost,
      avgCost,
    };
  }, [records]);
}
