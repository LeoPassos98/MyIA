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
    contextStrategy: string,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: string) => void
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
        body: JSON.stringify({ message, provider, chatId, contextStrategy }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Stream não disponível (response body vazio).');
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
              
              if (parsed && typeof parsed === 'object' && parsed.type) {
                onChunk(parsed as StreamChunk);
                
                if (parsed.type === 'debug' && typeof parsed.log === 'string') {
                  const chatIdMatch = parsed.log.match(/Chat (?:criado|ID):\s*([0-9a-fA-F-]{36})/i);
                  if (chatIdMatch) {
                    onChunk({
                      type: 'telemetry',
                      metrics: {
                        tokensIn: 0, tokensOut: 0, costInUSD: 0,
                        model: '', provider, chatId: chatIdMatch[1], sentContext: undefined
                      }
                    });
                  }
                }
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
        
        if (done) {
          if (buffer.trim()) {
            const finalLine = buffer.trim();
            if (finalLine.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(finalLine.slice(6));
                if (parsed?.type) onChunk(parsed as StreamChunk);
              } catch (e) {
                console.error('Final buffer parse error:', e);
              }
            }
          }
          
          onComplete();
          break;
        }
      }
      
      return;
      
    } catch (err: any) {
      console.error('ERRO no streamChat:', err);
      onError(err.message || 'Erro desconhecido no stream');
      return;
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