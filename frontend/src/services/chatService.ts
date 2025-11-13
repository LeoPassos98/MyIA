import { api } from './api';
import { Message, Provider } from '../types'; // <--- CORREÇÃO 1: Adicione o 'Provider'

// Opcional: defina o tipo de resposta se ainda não o fez
interface SendMessageResponse {
  response: string;
  contextSize: number;
  provider: string;
}

export const chatService = {
  // CORREÇÃO 2: Adicione 'provider?: string' e passe-o no body
  sendMessage: async (message: string, provider?: string): Promise<SendMessageResponse> => {
    const response = await api.post('/chat/message', { message, provider });
    return response.data;
  },

  clearContext: async (): Promise<void> => {
    await api.delete('/chat/context');
  },

  // Esta é a função que busca os providers (que também estava no diff)
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await api.get('/ai/providers');
      // A correção do 'response.data.providers' que discutimos
      return response.data.providers.filter((provider: Provider) => provider.configured === true);
    } catch (error) {
      console.error('Erro ao buscar providers:', error);
      return []; // Retorna vazio em caso de erro
    }
  }
};