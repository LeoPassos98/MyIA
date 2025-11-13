import { api } from './api';

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark';
  // ...outros campos que virão no futuro...
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
