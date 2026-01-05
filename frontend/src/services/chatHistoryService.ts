// frontend/src/services/chatHistoryService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { api } from './api';

export interface Chat {
  id: string;
  title: string | null;
  createdAt: string; // Adicionado o campo createdAt
  updatedAt?: string; // Campo opcional para futuras atualizações
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isPinned?: boolean;
  provider?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costInUSD?: number;
  sentContext?: string | Array<{ role: string; content: string }>; // <-- Aceita ambos
}

// Alias opcional para compatibilidade
export type ChatSession = Chat;

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

  toggleMessagePin: async (messageId: string): Promise<{ messageId: string; isPinned: boolean }> => {
    const response = await api.patch(`/chat-history/message/${messageId}/pin`);
    return response.data;
  },

  getPinnedMessages: async (chatId: string): Promise<Message[]> => {
    const response = await api.get(`/chat-history/${chatId}/pinned`);
    return response.data;
  },
};
