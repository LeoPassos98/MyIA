import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SendMessageResponse {
  response: string;
  contextSize: number;
}

export const chatService = {
  sendMessage: async (message: string): Promise<SendMessageResponse> => {
    const response = await api.post('/chat/message', { message });
    return response.data;
  },

  clearContext: async (): Promise<void> => {
    await api.delete('/chat/context');
  },
};