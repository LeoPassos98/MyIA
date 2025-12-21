// frontend/src/features/auditPage/hooks/useAuditProviderStats.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useMemo } from 'react';
import { AuditTableRow } from '../types';

export interface ProviderStats {
  provider: string;
  totalCost: number;
  totalTokens: number;
  recordCount: number;
}

export function useAuditProviderStats(records: AuditTableRow[]): ProviderStats[] {
  return useMemo(() => {
    const statsMap = new Map<string, ProviderStats>();

    records.forEach(record => {
      // Normalização: prioriza dados diretos, fallback para nested/unknown
      const provider = record.provider && record.provider !== '—' 
        ? record.provider 
        : 'unknown';
      
      // Ignora registros sem provider válido
      if (!provider || provider === 'unknown') {
        return;
      }
      
      if (!statsMap.has(provider)) {
        statsMap.set(provider, {
          provider,
          totalCost: 0,
          totalTokens: 0,
          recordCount: 0,
        });
      }

      const stats = statsMap.get(provider)!;
      stats.totalCost += record.cost || 0;
      stats.totalTokens += record.totalTokens || 0;
      stats.recordCount += 1;
    });

    // Retorna array vazio se não houver dados válidos
    const result = Array.from(statsMap.values()).sort((a, b) => b.totalCost - a.totalCost);
    return result.length > 0 ? result : [];
  }, [records]);
}
