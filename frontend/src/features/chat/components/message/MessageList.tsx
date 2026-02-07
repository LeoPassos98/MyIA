// frontend/src/features/chat/components/message/MessageList.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// Otimização Fase 2: Layout Optimization - Batch DOM operations para scroll
// Fase 3: Memory Optimization - React.memo e otimizações de re-render

import { useRef, useEffect, useState, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Message } from '../../types';
import ChatMessage from './ChatMessage';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';
import { useRafThrottledCallback } from '../../../../hooks/useEventOptimization';
import { getEventOptions } from '../../../../utils/performance';
import { useBatchedLayout, useOptimizedScroll } from '../../../../hooks/useLayoutOptimization';
import { useStableCallback } from '../../../../hooks/memory';


interface MessageListProps {
  messages: Message[];
  isDevMode?: boolean;
  onTogglePin?: (messageId: string) => void;
  inputHeight: number;
  devConsole?: React.ReactNode;
}


const MessageList: React.FC<MessageListProps> = ({
  messages,
  isDevMode = false,
  onTogglePin,
  inputHeight,
  devConsole,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Otimização Fase 2: Batch DOM operations para scroll
  const { scheduleRead } = useBatchedLayout();
  const { scrollIntoView } = useOptimizedScroll(messagesEndRef);

  // Fase 3: Estabiliza callback de toggle pin para evitar re-renders
  const stableOnTogglePin = useStableCallback((messageId: string) => {
    if (onTogglePin) {
      onTogglePin(messageId);
    }
  });

  // Otimização: RAF throttled scroll handler para detectar posição
  // Usa requestAnimationFrame para sincronizar com refresh rate do navegador
  // Fase 2: Agrupa leituras DOM para evitar layout thrashing
  const handleScroll = useRafThrottledCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Agrupar todas as leituras DOM em uma única operação
    scheduleRead(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Considera "perto do fundo" se estiver a menos de 100px
      return distanceFromBottom < 100;
    }).then(nearBottom => {
      setIsNearBottom(nearBottom);
    });
  }, [scheduleRead]);

  // Só faz scroll se uma nova mensagem foi adicionada E usuário está perto do fundo
  // Fase 2: Usa scroll otimizado com batch operations
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && isNearBottom) {
      scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isNearBottom, scrollIntoView]);

  // Otimização: Adiciona passive scroll listener para melhor performance
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Passive listener não bloqueia o scroll
    const options = getEventOptions({ passive: true });
    container.addEventListener('scroll', handleScroll as any, options);

    return () => {
      container.removeEventListener('scroll', handleScroll as any, options as any);
    };
  }, [handleScroll]);

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: 2,
          opacity: 0.85,
        }}
      >
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ maxWidth: 340, fontWeight: 400, fontSize: '1.08rem', mb: 1.5 }}
        >
          Start a conversation with MyIA
        </Typography>
        <Typography
          variant="body2"
          color="text.disabled"
          align="center"
          sx={{ maxWidth: 320, fontWeight: 400, fontSize: '0.98rem' }}
        >
          Ex: "Summarize this article for me"<br />or "What can you do?"
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        pb: `${inputHeight}px`, // Padding dinâmico baseado na altura real do input
        ...scrollbarStyles,
      }}
    >
      {/* Espaçador que empurra mensagens para baixo quando há poucas */}
      <Box sx={{ flex: 1, minHeight: 0 }} />

      <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto', py: 2 }}>
        {/* Fase 3: Renderiza mensagens com callback estável */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDevMode={isDevMode}
            onTogglePin={stableOnTogglePin}
          />
        ))}
        {/* DevConsole aparece logo acima do input, dentro do fluxo do scroll */}
        {devConsole}
        {/* Ref para scroll automático */}
        <div ref={messagesEndRef} style={{ height: 0 }} />
      </Box>
    </Box>
  );
};

// Fase 3: Memoiza componente para evitar re-renders desnecessários
// Só re-renderiza se messages, isDevMode, onTogglePin, inputHeight ou devConsole mudarem
export default memo(MessageList, (prevProps, nextProps) => {
  // Custom comparison para otimizar re-renders
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.isDevMode === nextProps.isDevMode &&
    prevProps.onTogglePin === nextProps.onTogglePin &&
    prevProps.inputHeight === nextProps.inputHeight &&
    prevProps.devConsole === nextProps.devConsole
  );
});
