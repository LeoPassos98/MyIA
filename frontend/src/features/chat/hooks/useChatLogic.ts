// frontend/src/features/chat/hooks/useChatLogic.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Fase 3: Memory Optimization - Fixed memory leaks, cleanup de recursos

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Importante: hooks de navegação
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { chatService, StreamChunk } from '../../../services/chatService';
import { chatHistoryService, Message } from '../../../services/chatHistoryService';
import { useStableCallback } from '../../../hooks/useMemoryOptimization';

export function useChatLogic(chatId?: string) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { chatConfig, contextConfig, syncChatHistory, manualContext } = useLayout();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Refs para controle interno (não geram renderização)
  const isSendingRef = useRef(false);
  const chunkBufferRef = useRef<string>('');
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newChatIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fase 3: Cleanup de recursos ao desmontar
  useEffect(() => {
    return () => {
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
    };
  }, []);

  // 1. Redirecionar se não logado
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // 2. Carregar mensagens quando o chatId muda (ou limpar se for novo)
  useEffect(() => {
    if (chatId) {
      loadChatMessages(chatId);
    } else {
      setMessages([]);
      newChatIdRef.current = null; // Reseta ID temporário
    }
  }, [chatId]);

  // 3. Sincronizar histórico com sidebar
  useEffect(() => {
    syncChatHistory(messages);
  }, [messages, syncChatHistory]);

  const loadChatMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const chatMessages = await chatHistoryService.getChatMessages(id);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fase 3: useStableCallback para evitar recriação
  const handleStop = useStableCallback(() => {
    // Limpa timeout pendente
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    
    // Aborta requisição
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Limpa buffer
    chunkBufferRef.current = '';
    
    setIsLoading(false);
    isSendingRef.current = false;
    setDebugLogs(prev => [...prev, "🛑 Interrompido pelo usuário."]);
  });

  const handleSendMessage = useStableCallback(async () => {
    // Validações iniciais
    if (!inputMessage.trim() || isLoading || isSendingRef.current) return;

    if (manualContext.isActive) {
      const hasContent = manualContext.selectedMessageIds.length > 0 || manualContext.additionalText.trim().length > 0;
      if (!hasContent) {
        alert('⚠️ Modo Manual Ativo: Selecione mensagens ou adicione contexto.');
        return;
      }
    }

    // Fase 3: Limpa recursos anteriores antes de novo envio
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Preparação do envio
    isSendingRef.current = true;
    const userMsgText = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setDebugLogs([]);

    // Cria o Controller de Cancelamento
    const controller = new AbortController();
    abortControllerRef.current = controller;

    chunkBufferRef.current = '';

    // IDs temporários para UI Otimista
    const userMsgId = `user-${Date.now()}`;
    const tempAiMsgId = `assistant-${Date.now()}`;

    // Adiciona mensagens na tela imediatamente
    const newUserMsg: Message = { 
      id: userMsgId, 
      role: 'user', 
      content: userMsgText, 
      createdAt: new Date().toISOString() 
    };
    const newAiMsg: Message = { 
      id: tempAiMsgId, 
      role: 'assistant', 
      content: '', 
      createdAt: new Date().toISOString(), 
      costInUSD: 0 
    };

    setMessages((prev) => [...prev, newUserMsg, newAiMsg]);

    // Função para atualizar a mensagem da IA na tela
    const flushChunkBuffer = () => {
      if (chunkBufferRef.current.length > 0) {
        const contentToAdd = chunkBufferRef.current;
        chunkBufferRef.current = '';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAiMsgId ? { ...msg, content: msg.content + contentToAdd } : msg
          )
        );
      }
    };

    try {
      // --- CORREÇÃO 1: Payload Limpo (Sem Signal aqui dentro) ---
      const payload: any = {
        prompt: userMsgText,
        provider: chatConfig.provider,
        model: chatConfig.model,
        chatId: chatId || null, // Se tiver ID na URL, usa. Se não, null (cria novo).
      };

      // Adiciona configurações extras
      if (manualContext.isActive) {
        if (manualContext.additionalText.trim()) payload.context = manualContext.additionalText.trim();
        if (manualContext.selectedMessageIds.length > 0) payload.selectedMessageIds = manualContext.selectedMessageIds;
      } else {
        payload.strategy = chatConfig.strategy;
        payload.memoryWindow = chatConfig.memoryWindow;
        
        // 🎯 MODO AUTO/MANUAL: Só envia parâmetros se modo manual
        if (!chatConfig.isAutoMode) {
          payload.temperature = chatConfig.temperature;
          payload.topP = chatConfig.topP;
          payload.topK = chatConfig.topK;
          payload.maxTokens = chatConfig.maxTokens;
        }
        // Se isAutoMode === true, não envia parâmetros (backend usa recommendedParams)
        
        // Configuração do Pipeline de Contexto
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

      // --- CHAMADA AO SERVIÇO ---
      await chatService.streamChat(
        payload,
        (chunk: StreamChunk) => {
          if (controller.signal.aborted) return;

          try {
            if (chunk.type === 'chunk') {
              chunkBufferRef.current += chunk.content;
              if (!flushTimeoutRef.current) flushTimeoutRef.current = setTimeout(flushChunkBuffer, 50);
            } 
            else if (chunk.type === 'user_message_saved') {
              // 🔥 SWAP: Trocar ID temporário do USER pelo ID real persistido
              setMessages(prev => prev.map(msg => 
                msg.id === userMsgId ? { ...msg, id: chunk.userMessageId } : msg
              ));
            }
            else if (chunk.type === 'telemetry') {
              flushChunkBuffer();
              
              // --- CORREÇÃO DO CHAT ID ---
              if (!chatId && chunk.metrics.chatId) {
                newChatIdRef.current = chunk.metrics.chatId;
              }

              // 🔥 SWAP CRÍTICO: Trocar ID temporário pelo ID real persistido
              setMessages(prev => prev.map(msg => 
                msg.id === tempAiMsgId ? { 
                  ...msg,
                  id: chunk.metrics.messageId ?? msg.id, // Fonte Única de Verdade
                  ...chunk.metrics 
                } : msg
              ));
            }
            else if (chunk.type === 'debug') {
              setDebugLogs(prev => [...prev, chunk.log]);
            }
            else if (chunk.type === 'error') {
              // 🔥 Erro vindo do backend via SSE - atualiza conteúdo da mensagem
              flushChunkBuffer();
              setMessages(prev => prev.map(msg => 
                msg.id === tempAiMsgId ? { 
                  ...msg, 
                  content: msg.content ? `${msg.content}\n\n❌ ${chunk.error}` : `❌ ${chunk.error}`
                } : msg
              ));
              setDebugLogs(prev => [...prev, `❌ Erro: ${chunk.error}`]);
            }
          } catch (e) { console.error(e); }
        },
        () => {
          flushChunkBuffer();
          setIsLoading(false);
          isSendingRef.current = false;
          
          // --- NAVEGAÇÃO VITAL ---
          if (newChatIdRef.current && !chatId) {
            navigate(`/chat/${newChatIdRef.current}`, { replace: true });
          }
        },
        (err) => {
          if (err.name === 'AbortError') return;
          console.error(err);
          setIsLoading(false);
          isSendingRef.current = false;
          setMessages(prev => prev.map(msg => msg.id === tempAiMsgId ? { ...msg, content: msg.content + "\n[Erro]" } : msg));
        },
        controller.signal
      );

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      isSendingRef.current = false;
    }
  });

  const handleTogglePin = useCallback(async (messageId: string) => {
    try {
      const result = await chatHistoryService.toggleMessagePin(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPinned: result.isPinned } : msg
      ));
    } catch (error) {
      console.error('Erro ao fixar/desafixar mensagem:', error);
    }
  }, []);

  return {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleStop,
    handleTogglePin,
    isLoading,
    debugLogs,
  };
}