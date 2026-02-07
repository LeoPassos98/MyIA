// frontend/src/features/chat/hooks/useChatMessages.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook especializado para gestão de mensagens do chat

import { useState, useEffect, useCallback } from 'react';
import { chatHistoryService, Message } from '../../../services/chatHistoryService';
import { useStableCallback } from '../../../hooks/memory';
import { logger } from '../../../utils/logger';

/**
 * Interface do hook de mensagens
 */
export interface ChatMessagesHook {
  messages: Message[];
  isLoading: boolean;
  loadMessages: (chatId: string) => Promise<void>;
  addOptimisticMessages: (userMsg: Message, aiMsg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, content: string) => void;
  swapMessageId: (tempId: string, realId: string) => void;
  togglePin: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

/**
 * Hook para gestão de mensagens do chat
 * 
 * Responsabilidades:
 * - Carregamento de mensagens do histórico
 * - Criação de mensagens otimistas (IDs temporários)
 * - Atualização de mensagens (conteúdo, métricas)
 * - Swap de IDs temporários → reais
 * - Toggle de pin
 * - Sincronização com histórico
 * 
 * @param chatId - ID do chat atual (opcional para novo chat)
 * @param onMessagesChange - Callback para sincronizar com sidebar
 * @returns {ChatMessagesHook} Estado e funções de mensagens
 */
export function useChatMessages(
  chatId?: string,
  onMessagesChange?: (messages: Message[]) => void
): ChatMessagesHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Carrega mensagens do histórico
   */
  const loadMessages = useStableCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const chatMessages = await chatHistoryService.getChatMessages(id);
      setMessages(chatMessages);
    } catch (error) {
      logger.error('Erro ao carregar mensagens', { error });
    } finally {
      setIsLoading(false);
    }
  });

  /**
   * Adiciona mensagens otimistas (user + AI placeholder)
   */
  const addOptimisticMessages = useStableCallback((userMsg: Message, aiMsg: Message) => {
    setMessages((prev) => [...prev, userMsg, aiMsg]);
  });

  /**
   * Atualiza mensagem existente (merge parcial)
   */
  const updateMessage = useStableCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  });

  /**
   * Adiciona conteúdo ao final da mensagem (streaming)
   */
  const appendToMessage = useStableCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
      )
    );
  });

  /**
   * Troca ID temporário por ID real (após persistência)
   */
  const swapMessageId = useStableCallback((tempId: string, realId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? { ...msg, id: realId } : msg))
    );
  });

  /**
   * Toggle de pin de mensagem
   */
  const togglePin = useCallback(async (messageId: string) => {
    try {
      const result = await chatHistoryService.toggleMessagePin(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isPinned: result.isPinned } : msg
        )
      );
    } catch (error) {
      logger.error('Erro ao fixar/desafixar mensagem', { error });
    }
  }, []);

  /**
   * Limpa todas as mensagens
   */
  const clearMessages = useStableCallback(() => {
    setMessages([]);
  });

  // Carrega mensagens quando chatId muda
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    } else {
      clearMessages();
    }
  }, [chatId, loadMessages, clearMessages]);

  // Sincroniza com sidebar quando mensagens mudam
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  return {
    messages,
    isLoading,
    loadMessages,
    addOptimisticMessages,
    updateMessage,
    appendToMessage,
    swapMessageId,
    togglePin,
    clearMessages,
    setMessages
  };
}
