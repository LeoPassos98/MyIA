// frontend/src/services/aiProvidersService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { api } from './api';
import type {
  AIProvider,
  ModelsByVendor
} from '../types/ai';

export const aiProvidersService = {
  getAll: async (): Promise<AIProvider[]> => {
    const response = await api.get('/ai/providers');
    return response.data.providers;
  },

  getConfigured: async (): Promise<AIProvider[]> => {
    const response = await api.get('/providers/configured');
    return response.data.providers;
  },

  /**
   * Busca modelos agrupados por vendor (Anthropic, Amazon, Cohere)
   * com informações de disponibilidade em múltiplos providers
   */
  getByVendor: async (): Promise<ModelsByVendor> => {
    try {
      const response = await api.get('/providers/by-vendor');
      // O interceptor JSend já desembrulha response.data.data → response.data
      return response.data as ModelsByVendor;
    } catch (error) {
      console.error('[aiProvidersService] Erro ao buscar vendors:', error);
      throw error;
    }
  },
};
