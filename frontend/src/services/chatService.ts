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
    chatId: string | null, // <-- Deve estar aqui!
    contextStrategy: string, // <-- O NOVO PARÂMETRO
    // Callbacks para o "gotejamento"
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) {
    try {
      // 🔥 FIX: Usar fetch() direto ao invés de axios para SSE
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message,
          provider,
          chatId,
          contextStrategy,
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

      // --- HOTFIX V20: parser SSE por bloco (event/data) com flush final ---
      const processBuffer = () => {
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const trimmedBlock = block.trim();
          if (!trimmedBlock) continue;

          const lines = trimmedBlock.split('\n');
          let eventType: string | undefined;
          let dataPayload = '';

          for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line) continue;

            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              const part = line.slice(5).trimStart();
              dataPayload += (dataPayload ? '\n' : '') + part;
              continue;
            }
          }

          if (!dataPayload) continue;

          try {
            const parsed = JSON.parse(dataPayload) as any;

            if (parsed && typeof parsed === 'object' && parsed.type) {
              onChunk(parsed as StreamChunk);

              // --- Fallback existente: "✅ Chat criado: <uuid> (provider: ...)" ---
              if (parsed.type === 'debug' && typeof parsed.log === 'string') {
                const log: string = parsed.log;
                const createdMatch = log.match(/Chat criado:\s*([0-9a-fA-F-]{36})\s*\(provider:\s*([^)]+)\)/i);
                if (createdMatch) {
                  const syntheticId = createdMatch[1];
                  const syntheticProvider = createdMatch[2];
                  onChunk({
                    type: 'telemetry',
                    metrics: {
                      tokensIn: 0, tokensOut: 0, costInUSD: 0,
                      model: '', provider: syntheticProvider, chatId: syntheticId, sentContext: undefined
                    }
                  });
                }

                // --- NOVO Fallback: "💬 Chat ID: <uuid>" (chat existente) ---
                const existingMatch = log.match(/Chat ID:\s*([0-9a-fA-F-]{36})/i);
                if (existingMatch) {
                  const syntheticId = existingMatch[1];
                  onChunk({
                    type: 'telemetry',
                    metrics: {
                      tokensIn: 0, tokensOut: 0, costInUSD: 0,
                      model: '', provider, chatId: syntheticId, sentContext: undefined
                    }
                  });
                }
              }
              continue;
            }

            switch (eventType) {
              case 'telemetry':
                onChunk({ type: 'telemetry', metrics: parsed });
                break;
              case 'chunk': {
                const content = typeof parsed === 'string' ? parsed : parsed?.content ?? '';
                onChunk({ type: 'chunk', content });
                break;
              }
              case 'error': {
                const err = typeof parsed === 'string' ? parsed : parsed?.error ?? JSON.stringify(parsed);
                onChunk({ type: 'error', error: err });
                break;
              }
              case 'debug': {
                const log = typeof parsed === 'string' ? parsed : parsed?.log ?? JSON.stringify(parsed);
                onChunk({ type: 'debug', log });

                // --- Fallback existente: "✅ Chat criado: <uuid> (provider: ...)" ---
                if (typeof log === 'string') {
                  const createdMatch = log.match(/Chat criado:\s*([0-9a-fA-F-]{36})\s*\(provider:\s*([^)]+)\)/i);
                  if (createdMatch) {
                    const syntheticId = createdMatch[1];
                    const syntheticProvider = createdMatch[2];
                    onChunk({
                      type: 'telemetry',
                      metrics: {
                        tokensIn: 0, tokensOut: 0, costInUSD: 0,
                        model: '', provider: syntheticProvider, chatId: syntheticId, sentContext: undefined
                      }
                    });
                  }

                  // --- NOVO Fallback: "💬 Chat ID: <uuid>" (chat existente) ---
                  const existingMatch = log.match(/Chat ID:\s*([0-9a-fA-F-]{36})/i);
                  if (existingMatch) {
                    const syntheticId = existingMatch[1];
                    onChunk({
                      type: 'telemetry',
                      metrics: {
                        tokensIn: 0, tokensOut: 0, costInUSD: 0,
                        model: '', provider, chatId: syntheticId, sentContext: undefined
                      }
                    });
                  }
                }
                break;
              }
              default: {
                // Heurística de telemetria
                if (parsed && typeof parsed === 'object' && ('tokensIn' in parsed || 'tokensOut' in parsed || 'model' in parsed || 'provider' in parsed)) {
                  onChunk({ type: 'telemetry', metrics: parsed });
                }
                break;
              }
            }
          } catch (e) {
            // Ignorar sinais especiais não-JSON (ex.: [DONE])
            if (dataPayload.trim() === '[DONE]') {
              continue;
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          processBuffer(); // processa a cada chunk recebido
        }

        if (done) {
          buffer += decoder.decode(); // flush final do TextDecoder
          processBuffer();            // processa qualquer resíduo (ex.: telemetria final)
          onComplete();               // somente após o último processamento
          break;
        }
      }
    } catch (err: any) {
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