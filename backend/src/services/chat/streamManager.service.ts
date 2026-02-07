// backend/src/services/chat/streamManager.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { aiService } from '../ai';
import { StreamChunk, TelemetryMetrics } from '../ai/types';

/**
 * Parâmetros para processamento de stream
 */
interface ProcessStreamParams {
  payload: Array<{ role: string; content: string }>;
  options: {
    providerSlug: string;
    modelId: string;
    userId: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  };
  writeSSE: (data: StreamChunk) => void;
}

/**
 * Resultado do processamento de stream
 */
interface StreamResult {
  content: string | null;
  metrics: TelemetryMetrics | null;
  error: string | null;
}

/**
 * Watchdog para timeout de stream
 */
interface Watchdog {
  reset: () => void;
  clear: () => void;
}

/**
 * Service responsável por gerenciar o streaming da IA
 * 
 * Responsabilidades:
 * - Processar stream da IA
 * - Gerenciar watchdog de timeout
 * - Acumular conteúdo da resposta
 * - Capturar métricas e erros
 * - Repassar chunks via SSE
 */
class StreamManagerService {
  /**
   * Processa stream da IA e retorna resultado completo
   */
  async processStream(params: ProcessStreamParams): Promise<StreamResult> {
    const { payload, options, writeSSE } = params;

    // Inicia stream da IA
    const stream = aiService.stream(payload, options);

    // Variáveis de acumulação
    let fullContent = '';
    let finalMetrics: TelemetryMetrics | null = null;
    let streamError: string | null = null;

    // Cria watchdog para timeout
    const watchdog = this.createWatchdog(writeSSE);

    try {
      watchdog.reset();

      // Processa cada chunk do stream
      for await (const chunk of stream) {
        watchdog.reset();

        // Acumula conteúdo
        if (chunk.type === 'chunk') {
          fullContent += chunk.content;
        }
        // Captura métricas
        else if (chunk.type === 'telemetry') {
          finalMetrics = chunk.metrics;
        }
        // Captura erro
        else if (chunk.type === 'error') {
          streamError = chunk.error;
        }

        // Repassa chunk via SSE
        writeSSE(chunk);
      }

      watchdog.clear();

      // Retorna resultado
      return {
        content: streamError ? null : fullContent,
        metrics: finalMetrics,
        error: streamError
      };
    } catch (error: unknown) {
      watchdog.clear();
      throw error;
    }
  }

  /**
   * Cria watchdog para detectar timeout de stream
   * Envia erro via SSE se a API parar de responder por 60s
   */
  private createWatchdog(writeSSE: (data: StreamChunk) => void): Watchdog {
    let timer: NodeJS.Timeout | undefined;

    return {
      reset: () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          writeSSE({
            type: 'error',
            error: 'Timeout: API parou de responder.'
          });
        }, 60000); // 60 segundos
      },
      clear: () => {
        if (timer) clearTimeout(timer);
      }
    };
  }

  /**
   * Prepara opções de inferência baseado no modo (auto/manual)
   */
  prepareInferenceOptions(
    baseOptions: {
      providerSlug: string;
      modelId: string;
      userId: string;
    },
    inferenceParams: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxTokens?: number;
    },
    isAutoMode: boolean
  ): any {
    // Se modo auto, não envia parâmetros
    if (isAutoMode) {
      return baseOptions;
    }

    // Se modo manual, envia parâmetros
    return {
      ...baseOptions,
      ...inferenceParams
    };
  }
}

export const streamManagerService = new StreamManagerService();
