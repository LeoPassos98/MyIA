import { api } from './api';
import { Provider } from '../types';

// Atualizando a interface para incluir chatId na resposta
export interface SendMessageResponse {
  response: string;
  chatId: string;
  provider: string;
}

export const chatService = {
  sendMessage: async (message: string, provider?: string, chatId?: string | null): Promise<SendMessageResponse> => {
    const response = await api.post('/chat/message', {
      message,
      provider,
      chatId: chatId || undefined,
    });
    return response.data;
  },

  clearContext: async (): Promise<void> => {
    await api.delete('/chat/context');
  },

  async getProviders(): Promise<Provider[]> {
    try {
      const response = await api.get('/ai/providers');
      return response.data.providers.filter((provider: Provider) => provider.configured === true);
    } catch (error) {
      console.error('Erro ao buscar providers:', error);
      return [];
    }
  }
};