/**
 * frontend/src/features/settings/components/ModelsManagement/hooks/useModelFilters.ts
 * Hook for managing model filtering logic
 * Standards: docs/STANDARDS.md §3.0, §15
 */

import { useState, useCallback } from 'react';
import type { ModelWithProvider } from '../types';

export type FilterType = 'all' | 'certified' | 'untested';

/**
 * Hook para gerenciar filtros de modelos
 */
export function useModelFilters() {
  const [filter, setFilter] = useState<FilterType>('all');

  /**
   * Aplica filtro aos modelos baseado no tipo selecionado
   */
  const applyFilter = useCallback(
    (models: ModelWithProvider[], certifiedModels: string[]) => {
      switch (filter) {
        case 'certified':
          return models.filter((m) => certifiedModels.includes(m.apiModelId));
        case 'untested':
          return models.filter((m) => !certifiedModels.includes(m.apiModelId));
        default:
          return models;
      }
    },
    [filter]
  );

  /**
   * Calcula contadores para cada tipo de filtro
   */
  const getFilterCounts = useCallback(
    (allModels: ModelWithProvider[], certifiedModels: string[]) => {
      return {
        all: allModels.length,
        certified: certifiedModels.length,
        untested: allModels.length - certifiedModels.length,
      };
    },
    []
  );

  return {
    filter,
    setFilter,
    applyFilter,
    getFilterCounts,
  };
}
