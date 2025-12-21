// frontend/src/features/auditPage/hooks/useAuditCostTimeline.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo } from 'react';
import { AuditTableRow } from '../types';

export interface CostTimelinePoint {
  date: string; // YYYY-MM-DD
  cost: number;
}

export function useAuditCostTimeline(records: AuditTableRow[]): CostTimelinePoint[] {
  return useMemo(() => {
    if (records.length === 0) {
      return [];
    }

    // Agrupar por data (YYYY-MM-DD)
    const costByDate = new Map<string, number>();

    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      const currentCost = costByDate.get(date) || 0;
      costByDate.set(date, currentCost + record.cost);
    });

    // Converter para array e ordenar por data
    const timeline = Array.from(costByDate.entries())
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return timeline;
  }, [records]);
}
