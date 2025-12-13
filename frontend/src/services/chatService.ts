import { api } from './api';

// O novo "protocolo" que esperamos do backend
export type StreamChunk = 
  | { type: 'chunk'; content: string }
  | { type: 'telemetry'; metrics: TelemetryMetrics }
  | { type: 'error'; error: string }
  | { type: 'debug'; log: string }; // <-- Tipo de debug adicionado

export interface TelemetryMetrics {
  tokensIn: number;
  tokensOut: number;
  costInUSD: number;
  model: string;
  provider: string;
  chatId?: string; // <-- ID do chat (para atualização após primeira mensagem)
  sentContext?: string; // <-- Contexto enviado (JSON string)
}

export interface SendMessageResponse {
  response: string;
  chatId: string;
  provider: string;
}

export interface ChatPayload {
  prompt: string;
  provider: string;
  model?: string;
  context?: string;
  selectedMessageIds?: string[];
  strategy?: string;
  temperature?: number;
  topK?: number;
  memoryWindow?: number;
  chatId?: string | null;
}

export const chatService = {
  /**
   * Função de stream com SSE.
   * Agora aceita 'signal' para cancelamento.
   */
  async streamChat(
    payload: ChatPayload,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: any) => void,
    signal?: AbortSignal // <--- 1. NOVO PARÂMETRO
  ) {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
        signal: signal, // <--- 2. CONECTADO AO FETCH
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Stream não disponível.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            const dataPayload = line.slice(6).trim();
            if (dataPayload === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(dataPayload);
              if (parsed && parsed.type) {
                onChunk(parsed as StreamChunk);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
        
        if (done) {
          onComplete();
          break;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Ignora cancelamento intencional
      console.error('ERRO no streamChat:', err);
      onError(err.message || 'Erro desconhecido');
    }
  },
  
  // Função legacy (não-streaming) - manter para compatibilidade se necessário
  async sendMessage(message: string, provider?: string, chatId?: string | null): Promise<SendMessageResponse> {
    const response = await api.post('/chat/message', {
      message,
      provider,
      chatId: chatId || undefined,
    });
    return response.data;
  },
};