// frontend/src/features/chat/components/MessageList.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useRef, useEffect } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isDevMode: boolean;
}

export default function MessageList({
  messages,
  isDevMode,
}: MessageListProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          opacity: 0.8,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: theme.palette.gradients.shimmer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: `0 8px 32px ${alpha(
              theme.palette.primary.main,
              0.1
            )}`,
          }}
        >
          <BrainIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>

        <Typography variant="h5" fontWeight="bold">
          MyIA V47
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ maxWidth: 400 }}
        >
          Seu assistente pessoal inteligente.
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
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 900, py: 2 }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDevMode={isDevMode}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
}
