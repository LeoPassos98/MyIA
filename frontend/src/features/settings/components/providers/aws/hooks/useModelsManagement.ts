// frontend/src/features/settings/components/providers/aws/hooks/useModelsManagement.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, useMemo } from 'react';
import { EnrichedAWSModel } from '@/types/ai';

/**
 * Props para o hook de gerenciamento de modelos
 */
export interface UseModelsManagementProps {
  availableModels: EnrichedAWSModel[];
}

/**
 * Retorno do hook de gerenciamento de modelos
 */
export interface UseModelsManagementReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  groupedModels: [string, EnrichedAWSModel[]][];
  handleSearch: (value: string) => void;
}

/**
 * Hook para gerenciar busca, agrupamento e filtros de modelos
 * 
 * Responsabilidades:
 * - Gerenciar busca com debounce
 * - Agrupar modelos por provedor
 * - Filtrar modelos por termo de busca
 * 
 * @param props - Props com modelos disponíveis
 * @returns Estado e handlers de gerenciamento de modelos
 */
export function useModelsManagement(
  props: UseModelsManagementProps
): UseModelsManagementReturn {
  const { availableModels } = props;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // ✅ OTIMIZAÇÃO: Debounce do searchTerm (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // ✅ OTIMIZAÇÃO: Agrupar modelos por provedor e filtrar por busca (com debounce)
  const groupedModels = useMemo(() => {
    const filtered = availableModels.filter(model => {
      if (!debouncedSearchTerm) return true;
      const search = debouncedSearchTerm.toLowerCase();
      return (
        model.name.toLowerCase().includes(search) ||
        model.apiModelId.toLowerCase().includes(search) ||
        (model.providerName && model.providerName.toLowerCase().includes(search))
      );
    });

    const groups: Record<string, typeof availableModels> = {};
    filtered.forEach(model => {
      const provider = model.providerName || 'Outros';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [availableModels, debouncedSearchTerm]);
  
  /**
   * Handler para atualizar termo de busca
   */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };
  
  return {
    searchTerm,
    debouncedSearchTerm,
    groupedModels,
    handleSearch
  };
}
