// frontend/src/features/chat/hooks/useChatLogic.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Hook orquestrador principal do chat - Refatorado e modularizado

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { useStableCallback } from '../../../hooks/memory';
import { Message } from '../../../services/chatHistoryService';

// Hooks especializados
import { useChatValidation } from './useChatValidation';
import { useChatCleanup } from './useChatCleanup';
import { useChatNavigation, useAuthRedirect } from './useChatNavigation';
import { useChatMessages } from './useChatMessages';
import { useChatStreaming, ChatPayload } from './useChatStreaming';

/**
 * Hook orquestrador principal do chat
 * 
 * Responsabilidades:
 * - Orquestração entre hooks especializados
 * - Gestão de estado de UI (input, loading)
 * - Construção de payload de envio
 * - Coordenação de callbacks de streaming
 * 
 * Reduzido de 322 linhas para ~150 linhas
 * Complexidade ciclomática reduzida de 25 para <10
 * 
 * @param chatId - ID do chat atual (opcional para novo chat)
 * @returns Estado e funções do chat
 */
export function useChatLogic(chatId?: string) {
  const { isAuthenticated } = useAuth();
  const { chatConfig, contextConfig, syncChatHistory, manualContext } = useLayout();

  // Estado de UI
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hooks especializados
  const validation = useChatValidation();
  const cleanup = useChatCleanup();
  const navigation = useChatNavigation();
  const messages = useChatMessages(chatId, syncChatHistory);

  // Obtém refs do cleanup
  const { 
    flushTimeoutRef, 
    abortControllerRef, 
    chunkBufferRef, 
    isSendingRef, 
    newChatIdRef 
  } = cleanup.getResources();

  // Hook de streaming
  const streaming = useChatStreaming(flushTimeoutRef, chunkBufferRef);

  // Auto-redirect se não autenticado
  useAuthRedirect(isAuthenticated);

  /**
   * Constrói payload para envio
   */
  const buildPayload = useStableCallback((userMsgText: string): ChatPayload => {
    const payload: ChatPayload = {
      prompt: userMsgText,
      provider: chatConfig.provider,
      model: chatConfig.model,
      chatId: chatId || null,
    };

    // Modo manual: contexto customizado
    if (manualContext.isActive) {
      if (manualContext.additionalText.trim()) {
        payload.context = manualContext.additionalText.trim();
      }
      if (manualContext.selectedMessageIds.length > 0) {
        payload.selectedMessageIds = manualContext.selectedMessageIds;
      }
    } 
    // Modo auto: configurações de contexto
    else {
      payload.strategy = chatConfig.strategy;
      payload.memoryWindow = chatConfig.memoryWindow;

      // Só envia parâmetros se modo manual (não auto)
      if (!chatConfig.isAutoMode) {
        payload.temperature = chatConfig.temperature;
        payload.topP = chatConfig.topP;
        payload.topK = chatConfig.topK;
        payload.maxTokens = chatConfig.maxTokens;
      }

      // Pipeline de contexto
      payload.contextConfig = {
        systemPrompt: contextConfig.useCustomSystemPrompt ? contextConfig.systemPrompt : undefined,
        pinnedEnabled: contextConfig.pinnedEnabled,
        recentEnabled: contextConfig.recentEnabled,
        recentCount: contextConfig.recentCount,
        ragEnabled: contextConfig.ragEnabled,
        ragTopK: contextConfig.ragTopK,
        maxContextTokens: contextConfig.maxContextTokens,
      };
    }

    return payload;
  });

  /**
   * Handler de envio de mensagem
   */
  const handleSendMessage = useStableCallback(async () => {
    // 1. Validações
    const inputValidation = validation.validateSendMessage(
      inputMessage,
      isLoading,
      isSendingRef.current
    );

    if (!inputValidation.isValid) {
      if (inputValidation.error && inputValidation.error !== 'Mensagem vazia') {
        streaming.addDebugLog(inputValidation.error);
      }
      return;
    }

    const contextValidation = validation.validateManualContext(manualContext);
    if (!contextValidation.isValid) {
      alert(contextValidation.error);
      return;
    }

    // 2. Preparação
    cleanup.cleanupBeforeSend();
    isSendingRef.current = true;

    const userMsgText = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    streaming.clearDebugLogs();

    // Cria AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // IDs temporários para UI otimista
    const userMsgId = `user-${Date.now()}`;
    const tempAiMsgId = `assistant-${Date.now()}`;

    // Mensagens otimistas
    const newUserMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: userMsgText,
      createdAt: new Date().toISOString(),
    };

    const newAiMsg: Message = {
      id: tempAiMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      costInUSD: 0,
    };

    messages.addOptimisticMessages(newUserMsg, newAiMsg);

    // 3. Payload
    const payload = buildPayload(userMsgText);

    // 4. Streaming com callbacks estruturados
    await streaming.startStream(
      payload,
      {
        onChunk: (content) => {
          messages.appendToMessage(tempAiMsgId, content);
        },
        onUserMessageSaved: (messageId) => {
          messages.swapMessageId(userMsgId, messageId);
        },
        onTelemetry: (metrics) => {
          // Salva chatId se for novo chat
          if (!chatId && metrics.chatId) {
            newChatIdRef.current = metrics.chatId;
          }

          // Swap de ID temporário → real + métricas
          messages.updateMessage(tempAiMsgId, {
            id: metrics.messageId ?? tempAiMsgId,
            ...metrics,
          });
        },
        onDebug: (_log) => {
          // Debug log já é adicionado no hook de streaming
        },
        onError: (error) => {
          messages.updateMessage(tempAiMsgId, {
            content: newAiMsg.content
              ? `${newAiMsg.content}\n\n❌ ${error}`
              : `❌ ${error}`,
          });
        },
        onComplete: () => {
          setIsLoading(false);
          isSendingRef.current = false;

          // Navegação para novo chat
          if (newChatIdRef.current && !chatId) {
            navigation.navigateToNewChat(newChatIdRef.current, chatId);
          }
        },
      },
      controller.signal
    );
  });

  /**
   * Handler de stop
   */
  const handleStop = useStableCallback(() => {
    cleanup.cleanup();
    setIsLoading(false);
    streaming.addDebugLog('🛑 Interrompido pelo usuário.');
  });

  return {
    // Estado
    messages: messages.messages,
    inputMessage,
    isLoading,
    debugLogs: streaming.debugLogs,

    // Setters
    setInputMessage,

    // Handlers
    handleSendMessage,
    handleStop,
    handleTogglePin: messages.togglePin,
  };
}
