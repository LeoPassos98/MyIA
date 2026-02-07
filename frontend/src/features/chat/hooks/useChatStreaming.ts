// frontend/src/features/chat/hooks/useChatStreaming.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook especializado para streaming de mensagens

import { useState } from 'react';
import { chatService, StreamChunk } from '../../../services/chatService';
import { useStableCallback } from '../../../hooks/memory';
import { logger } from '../../../utils/logger';

/**
 * Métricas de telemetria do streaming
 */
export interface TelemetryMetrics {
  messageId?: string;
  chatId?: string;
  costInUSD?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

/**
 * Callbacks estruturados para eventos de streaming
 */
export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onUserMessageSaved: (messageId: string) => void;
  onTelemetry: (metrics: TelemetryMetrics) => void;
  onDebug: (log: string) => void;
  onError: (error: string) => void;
  onComplete: (chatId?: string) => void;
}

/**
 * Payload para envio de mensagem
 */
export interface ChatPayload {
  prompt: string;
  provider: string;
  model: string;
  chatId?: string | null;
  context?: string;
  selectedMessageIds?: string[];
  strategy?: string;
  memoryWindow?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  contextConfig?: {
    systemPrompt?: string;
    pinnedEnabled?: boolean;
    recentEnabled?: boolean;
    recentCount?: number;
    ragEnabled?: boolean;
    ragTopK?: number;
    maxContextTokens?: number;
  };
}

/**
 * Interface do hook de streaming
 */
export interface ChatStreamingHook {
  isStreaming: boolean;
  debugLogs: string[];
  startStream: (
    payload: ChatPayload,
    callbacks: StreamCallbacks,
    abortSignal: AbortSignal
  ) => Promise<void>;
  addDebugLog: (log: string) => void;
  clearDebugLogs: () => void;
}

/**
 * Hook para gerenciamento de streaming de chat
 * 
 * Responsabilidades:
 * - Processamento de chunks de streaming
 * - Buffer de chunks com flush automático (50ms)
 * - Processamento de 5 tipos de chunks (chunk, user_message_saved, telemetry, debug, error)
 * - Callbacks estruturados para cada tipo de evento
 * - Gerenciamento de debug logs
 * 
 * @param flushTimeoutRef - Ref para timeout de flush
 * @param chunkBufferRef - Ref para buffer de chunks
 * @returns {ChatStreamingHook} Estado e funções de streaming
 */
export function useChatStreaming(
  flushTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  chunkBufferRef: React.MutableRefObject<string>
): ChatStreamingHook {
  const [isStreaming, setIsStreaming] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  /**
   * Adiciona log de debug
   */
  const addDebugLog = useStableCallback((log: string) => {
    setDebugLogs((prev) => [...prev, log]);
  });

  /**
   * Limpa logs de debug
   */
  const clearDebugLogs = useStableCallback(() => {
    setDebugLogs([]);
  });

  /**
   * Flush do buffer de chunks
   */
  const flushChunkBuffer = useStableCallback((onChunk: (content: string) => void) => {
    if (chunkBufferRef.current.length > 0) {
      const contentToAdd = chunkBufferRef.current;
      chunkBufferRef.current = '';
      onChunk(contentToAdd);
    }
  });

  /**
   * Processa chunk individual
   */
  const processChunk = useStableCallback((
    chunk: StreamChunk,
    callbacks: StreamCallbacks,
    abortSignal: AbortSignal
  ) => {
    if (abortSignal.aborted) return;

    try {
      switch (chunk.type) {
        case 'chunk':
          // Acumula chunks no buffer
          chunkBufferRef.current += chunk.content;
          // Agenda flush se não houver timeout pendente
          if (!flushTimeoutRef.current) {
            flushTimeoutRef.current = setTimeout(() => {
              flushChunkBuffer(callbacks.onChunk);
              flushTimeoutRef.current = null;
            }, 50);
          }
          break;

        case 'user_message_saved':
          // Swap de ID temporário → real (user message)
          callbacks.onUserMessageSaved(chunk.userMessageId);
          break;

        case 'telemetry':
          // Flush buffer antes de processar telemetria
          flushChunkBuffer(callbacks.onChunk);
          callbacks.onTelemetry(chunk.metrics);
          break;

        case 'debug':
          addDebugLog(chunk.log);
          callbacks.onDebug(chunk.log);
          break;

        case 'error':
          // Flush buffer antes de processar erro
          flushChunkBuffer(callbacks.onChunk);
          addDebugLog(`❌ Erro: ${chunk.error}`);
          callbacks.onError(chunk.error);
          break;

        default:
          logger.warn('Tipo de chunk desconhecido', { chunk });
      }
    } catch (error) {
      logger.error('Erro ao processar chunk', { error, chunk });
    }
  });

  /**
   * Inicia streaming de mensagem
   */
  const startStream = useStableCallback(async (
    payload: ChatPayload,
    callbacks: StreamCallbacks,
    abortSignal: AbortSignal
  ) => {
    try {
      setIsStreaming(true);
      clearDebugLogs();
      chunkBufferRef.current = '';

      await chatService.streamChat(
        payload,
        (chunk: StreamChunk) => processChunk(chunk, callbacks, abortSignal),
        () => {
          // onComplete
          flushChunkBuffer(callbacks.onChunk);
          setIsStreaming(false);
          callbacks.onComplete();
        },
        (error) => {
          // onError
          if (error.name === 'AbortError') return;
          
          logger.error('Erro no stream de chat', { error });
          setIsStreaming(false);

          const errorMessage = typeof error === 'string' 
            ? error 
            : (error.message || 'Erro desconhecido');
          
          callbacks.onError(errorMessage);
        },
        abortSignal
      );
    } catch (error) {
      logger.error('Erro ao iniciar stream', { error });
      setIsStreaming(false);
      
      const errorMessage = typeof error === 'string' 
        ? error 
        : ((error as Error).message || 'Erro desconhecido');
      
      callbacks.onError(errorMessage);
    }
  });

  return {
    isStreaming,
    debugLogs,
    startStream,
    addDebugLog,
    clearDebugLogs
  };
}
