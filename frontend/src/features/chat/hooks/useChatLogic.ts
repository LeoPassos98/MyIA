// frontend/src/features/chat/hooks/useChatLogic.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Importante: hooks de navegação
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { chatService, StreamChunk } from '../../../services/chatService';
import { chatHistoryService, Message } from '../../../services/chatHistoryService';

export function useChatLogic(chatId?: string) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { chatConfig, syncChatHistory, manualContext } = useLayout();

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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    isSendingRef.current = false;
    setDebugLogs(prev => [...prev, "🛑 Interrompido pelo usuário."]);
  };

  const handleSendMessage = async () => {
    // Validações iniciais
    if (!inputMessage.trim() || isLoading || isSendingRef.current) return;

    if (manualContext.isActive) {
      const hasContent = manualContext.selectedMessageIds.length > 0 || manualContext.additionalText.trim().length > 0;
      if (!hasContent) {
        alert('⚠️ Modo Manual Ativo: Selecione mensagens ou adicione contexto.');
        return;
      }
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
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);

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
        payload.temperature = chatConfig.temperature;
        payload.topK = chatConfig.topK;
        payload.memoryWindow = chatConfig.memoryWindow;
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
            else if (chunk.type === 'telemetry') {
              flushChunkBuffer();
              
              // --- CORREÇÃO DO CHAT ID ---
              if (!chatId && chunk.metrics.chatId) {
                newChatIdRef.current = chunk.metrics.chatId;
              }

              setMessages(prev => prev.map(msg => 
                msg.id === tempAiMsgId ? { ...msg, ...chunk.metrics } : msg
              ));
            }
            else if (chunk.type === 'debug') {
              setDebugLogs(prev => [...prev, chunk.log]);
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
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleStop,
    isLoading,
    debugLogs,
  };
}