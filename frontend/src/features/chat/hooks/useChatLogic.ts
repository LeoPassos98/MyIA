import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const isSendingRef = useRef(false);
  const chunkBufferRef = useRef<string>('');
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (chatId) {
      loadChatMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isSendingRef.current) {
      return;
    }

    if (manualContext.isActive) {
      const hasSelectedMessages = manualContext.selectedMessageIds.length > 0;
      const hasAdditionalText = manualContext.additionalText.trim().length > 0;

      if (!hasSelectedMessages && !hasAdditionalText) {
        alert('⚠️ Modo Manual Ativo: Selecione pelo menos uma mensagem ou adicione contexto adicional antes de enviar.');
        return;
      }
    }

    isSendingRef.current = true;
    const userMsgText = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setDebugLogs([]);

    chunkBufferRef.current = '';
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    newChatIdRef.current = null;

    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempAiMsgId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newUserMsg: Message = { id: userMsgId, role: 'user', content: userMsgText, createdAt: new Date().toISOString() };
    const newAiMsg: Message = { id: tempAiMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString(), costInUSD: 0 };

    setMessages((prev) => [...prev, newUserMsg, newAiMsg]);

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
      let payload: any = {
        prompt: userMsgText,
        provider: chatConfig.provider,
        model: chatConfig.model,
        chatId: chatId || null,
      };

      if (manualContext.isActive) {
        if (manualContext.additionalText.trim()) {
          payload.context = manualContext.additionalText.trim();
        }
        if (manualContext.selectedMessageIds.length > 0) {
          payload.selectedMessageIds = manualContext.selectedMessageIds;
        }
      } else {
        payload.strategy = chatConfig.strategy;
        payload.temperature = chatConfig.temperature;
        payload.topK = chatConfig.topK;
        payload.memoryWindow = chatConfig.memoryWindow;
      }

      await chatService.streamChat(
        payload,
        (chunk: StreamChunk) => {
          try {
            if (chunk.type === 'chunk') {
              chunkBufferRef.current += chunk.content;

              if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);

              if (chunkBufferRef.current.length > 10) {
                flushChunkBuffer();
              } else {
                flushTimeoutRef.current = setTimeout(flushChunkBuffer, 50);
              }
            } else if (chunk.type === 'debug') {
              setDebugLogs((prevLogs) => [...prevLogs, chunk.log]);
            } else if (chunk.type === 'telemetry') {
              flushChunkBuffer();

              if (!chatId && chunk.metrics.chatId) {
                newChatIdRef.current = chunk.metrics.chatId;
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAiMsgId
                    ? {
                        ...msg,
                        costInUSD: chunk.metrics.costInUSD,
                        model: chunk.metrics.model,
                        provider: chunk.metrics.provider,
                        tokensIn: chunk.metrics.tokensIn,
                        tokensOut: chunk.metrics.tokensOut,
                        sentContext: chunk.metrics.sentContext || msg.sentContext,
                      }
                    : msg
                )
              );
            }
          } catch (err) {
            console.error('Erro no onChunk:', err);
          }
        },
        () => {
          flushChunkBuffer();
          isSendingRef.current = false;
          setIsLoading(false);

          if (newChatIdRef.current && !chatId) {
            navigate(`/chat/${newChatIdRef.current}`, { replace: true });
            newChatIdRef.current = null;
          }
        },
        (err: any) => {
          console.error('streamChat.onError', err);
          flushChunkBuffer();
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAiMsgId ? { ...msg, content: msg.content + '\n[Erro]' } : msg
            )
          );
          isSendingRef.current = false;
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Erro Fatal:', error);
    } finally {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isLoading,
    debugLogs,
    setDebugLogs,
  };
}
