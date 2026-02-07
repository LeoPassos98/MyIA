// frontend/src/features/chat/hooks/useChatCleanup.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook especializado para cleanup de recursos do chat

import { useRef, useEffect } from 'react';
import { useStableCallback } from '../../../hooks/memory';

/**
 * Recursos que precisam de cleanup
 */
export interface CleanupResources {
  flushTimeout: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
  chunkBuffer: string;
  isSending: boolean;
  newChatId: string | null;
}

/**
 * Interface do hook de cleanup
 */
export interface ChatCleanupHook {
  cleanup: () => void;
  cleanupBeforeSend: () => void;
  getResources: () => {
    flushTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    abortControllerRef: React.MutableRefObject<AbortController | null>;
    chunkBufferRef: React.MutableRefObject<string>;
    isSendingRef: React.MutableRefObject<boolean>;
    newChatIdRef: React.MutableRefObject<string | null>;
  };
}

/**
 * Hook para cleanup centralizado de recursos do chat
 * 
 * Responsabilidades:
 * - Cleanup de timeouts pendentes
 * - Abort de requisições em andamento
 * - Reset de buffers e flags
 * - Cleanup no unmount do componente
 * 
 * Elimina código duplicado que estava em 3 lugares diferentes
 * 
 * @returns {ChatCleanupHook} Funções de cleanup e refs
 */
export function useChatCleanup(): ChatCleanupHook {
  // Refs para controle interno (não geram renderização)
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chunkBufferRef = useRef<string>('');
  const isSendingRef = useRef<boolean>(false);
  const newChatIdRef = useRef<string | null>(null);

  /**
   * Cleanup completo de todos os recursos
   */
  const cleanup = useStableCallback(() => {
    // Limpa timeout pendente
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    // Aborta requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Limpa buffer de chunks
    chunkBufferRef.current = '';

    // Reseta flags
    isSendingRef.current = false;
    newChatIdRef.current = null;
  });

  /**
   * Cleanup antes de novo envio (mantém newChatId)
   */
  const cleanupBeforeSend = useStableCallback(() => {
    // Limpa timeout pendente
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    // Aborta requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Limpa buffer
    chunkBufferRef.current = '';
  });

  /**
   * Retorna refs para uso externo
   */
  const getResources = useStableCallback(() => ({
    flushTimeoutRef,
    abortControllerRef,
    chunkBufferRef,
    isSendingRef,
    newChatIdRef
  }));

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    cleanup,
    cleanupBeforeSend,
    getResources
  };
}
