// frontend/src/hooks/useModelRating.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ModelWithRating, ModelFilters } from '../types/model-rating';
import { filterModels, sortModels } from '../utils/rating-helpers';
import { api } from '../services/api';

interface UseModelRatingReturn {
  models: ModelWithRating[];
  filteredModels: ModelWithRating[];
  loading: boolean;
  error: Error | null;
  filters: ModelFilters;
  setFilters: (filters: ModelFilters) => void;
  refetch: () => Promise<void>;
  getModelById: (modelId: string) => ModelWithRating | undefined;
}

/**
 * Hook para buscar e gerenciar modelos com rating
 * 
 * ✅ Características:
 * - Busca modelos da API /api/providers/models
 * - Suporta filtros e ordenação
 * - Cache automático
 * - Refetch manual
 * - Estados de loading e erro
 * 
 * @example
 * const { models, filteredModels, loading, error, filters, setFilters } = useModelRating();
 */
export function useModelRating(): UseModelRatingReturn {
  const [models, setModels] = useState<ModelWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ModelFilters>({
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/providers/models');
      
      // O interceptor JSend já desembrulha response.data.data → response.data
      const modelsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      console.error('Erro ao buscar modelos com rating:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar modelos ao montar o componente
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Aplicar filtros e ordenação
  const filteredModels = useMemo(() => {
    let result = [...models];

    // Aplicar filtros
    result = filterModels(result, filters);

    // Aplicar ordenação
    if (filters.sortBy && filters.sortOrder) {
      result = sortModels(result, filters.sortBy, filters.sortOrder);
    }

    return result;
  }, [models, filters]);

  // Função para buscar modelo por ID
  const getModelById = useCallback((modelId: string) => {
    return models.find(m => m.id === modelId || m.apiModelId === modelId);
  }, [models]);

  return {
    models,
    filteredModels,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchModels,
    getModelById
  };
}

/**
 * Hook simplificado para buscar apenas modelos certificados (com rating)
 */
export function useCertifiedModels() {
  const { models, loading, error, refetch } = useModelRating();

  const certifiedModels = useMemo(() => {
    return models.filter(model => model.rating !== undefined);
  }, [models]);

  return {
    models: certifiedModels,
    loading,
    error,
    refetch
  };
}

/**
 * Hook para buscar um modelo específico por ID
 */
export function useModelById(modelId: string) {
  const { models, loading, error } = useModelRating();

  const model = useMemo(() => {
    return models.find(m => m.id === modelId);
  }, [models, modelId]);

  return {
    model,
    loading,
    error
  };
}
