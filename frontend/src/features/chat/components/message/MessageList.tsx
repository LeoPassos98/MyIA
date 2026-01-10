// frontend/src/features/chat/components/message/MessageList.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO


import { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Message } from '../../types';
import ChatMessage from './ChatMessage';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';


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

  // Só faz scroll se uma nova mensagem foi adicionada
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

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
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDevMode={isDevMode}
            onTogglePin={onTogglePin}
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

export default MessageList;
