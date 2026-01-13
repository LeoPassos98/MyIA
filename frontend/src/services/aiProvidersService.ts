// frontend/src/services/aiProvidersService.ts

import { api } from './api';
import { AIProvider } from '../types/ai';

export const aiProvidersService = {
  getAll: async (): Promise<AIProvider[]> => {
    const response = await api.get('/ai/providers');
    // Interceptor já desembrulha JSend: response.data.providers
    return response.data.providers;
  },
};
