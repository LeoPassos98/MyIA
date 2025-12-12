// frontend/src/services/aiProvidersService.ts

import { api } from './api';
import { AIProvider } from '../types/ai';

export const aiProvidersService = {
  getAll: async (): Promise<AIProvider[]> => {
    // Chama a rota que criamos: /api/ai/providers
    const response = await api.get<AIProvider[]>('/ai/providers');
    return response.data;
  },
};
