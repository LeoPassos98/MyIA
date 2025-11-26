import { useRef, useEffect } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isDevMode: boolean;
  onViewPrompt: (data: any) => void;
  onViewInspector: (data: any) => void;
}

export default function MessageList({ 
  messages, 
  isDevMode, 
  onViewPrompt, 
  onViewInspector 
}: MessageListProps) {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll sempre que chegar mensagem nova
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Se não houver mensagens, mostra o EMPTY STATE (Tela de Boas Vindas)
  if (messages.length === 0) {
    return (
      <Box 
        sx={{ 
          flex: 1, // Ocupa todo o espaço vertical
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column', 
          p: 2,
          opacity: 0.8
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: theme.gradients.shimmer, // Gradiente do Design System
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <BrainIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
          MyIA V47
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
          Seu assistente pessoal inteligente. Selecione um chat no histórico ou comece a digitar abaixo.
        </Typography>
      </Box>
    );
  }

  // Lista de Mensagens Padrão
  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      {messages.map((msg, index) => (
        <ChatMessage 
          key={msg.id || index} 
          message={msg} 
          isDevMode={isDevMode}
          onViewPrompt={onViewPrompt}
          onViewInspector={onViewInspector}
        />
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
}