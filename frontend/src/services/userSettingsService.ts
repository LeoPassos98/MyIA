// frontend/src/services/userSettingsService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { api } from './api';

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark';
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  awsEnabledModels?: string[];
}

export const userSettingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/settings', data);
    return response.data;
  },
};
