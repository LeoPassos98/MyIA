import { api } from './api';

export interface Chat {
  id: string;
  title: string;
  provider: string; // Provider travado
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costInUSD?: number;
  telemetry?: any; // Campo opcional de telemetria
}

export const chatHistoryService = {
  getAllChats: async (): Promise<Chat[]> => {
    const response = await api.get('/chat-history');
    return response.data;
  },

  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chat-history/${chatId}`);
    return response.data;
  },

  deleteChat: async (chatId: string): Promise<void> => {
    await api.delete(`/chat-history/${chatId}`);
  },
};
