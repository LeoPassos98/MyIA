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

export const chatService = {
  /**
   * NOVA função de stream com SSE.
   * Usa callbacks para gotejar dados para a UI em tempo real.
   */
  async streamChat(
    message: string,
    provider: string,
    chatId: string | null,
    contextStrategy: string, // <-- O NOVO PARÂMETRO
    // Callbacks para o "gotejamento"
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) {
    try {
      // 1. Pegar o Token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      // 2. Usar 'fetch' (NÃO AXIOS) para SSE
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message, 
          provider, 
          chatId, 
          contextStrategy // <-- ADICIONE AQUI
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Stream não disponível (response body vazio).');
      }

      // 3. Ler o "gotejamento" (ReadableStream)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(); // Stream terminou
          break;
        }

        // Decodificar chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Processar linhas completas (SSE usa \n\n como separador)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Última linha incompleta volta pro buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6); // Remove 'data: '
            if (data.trim()) {
              try {
                const parsedChunk = JSON.parse(data) as StreamChunk;
                onChunk(parsedChunk); // Goteja o chunk para a UI!
              } catch (e) {
                console.error("Erro ao parsear chunk SSE:", data, e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Erro fatal no fetch stream:", err);
      onError(err.message || 'Erro desconhecido no stream');
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