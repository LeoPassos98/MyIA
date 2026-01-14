// frontend/src/services/aiProvidersService.ts

import { api } from './api';
import { AIProvider } from '../types/ai';

export const aiProvidersService = {
  getAll: async (): Promise<AIProvider[]> => {
    const response = await api.get('/ai/providers');
    return response.data.providers;
  },

  getConfigured: async (): Promise<AIProvider[]> => {
    const response = await api.get('/providers/configured');
    return response.data.providers;
  },
};
