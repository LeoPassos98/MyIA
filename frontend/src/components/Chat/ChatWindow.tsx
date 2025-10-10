import { useState } from 'react';
import { Box, Paper, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { chatService } from '../../services/chatService';
import { Message } from '../../types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  messages: Message[];
  onNewMessage: (message: Message) => void;
  onClearMessages: () => void;
}

export default function ChatWindow({ messages, onNewMessage, onClearMessages }: ChatWindowProps) {
  const [error, setError] = useState('');

  const handleSendMessage = async (content: string) => {
    try {
      // Adicionar mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      onNewMessage(userMessage);

      // Enviar para API e receber resposta
      const response = await chatService.sendMessage(content);

      // Adicionar resposta da IA
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      onNewMessage(aiMessage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar mensagem');
    }
  };

  const handleClearContext = async () => {
    try {
      await chatService.clearContext();
      onClearMessages();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao limpar contexto');
    }
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Botão de limpar contexto */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Tooltip title="Limpar conversa">
            <IconButton onClick={handleClearContext} disabled={messages.length === 0}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Lista de mensagens */}
        <MessageList messages={messages} />

        {/* Input de mensagem */}
        <MessageInput onSend={handleSendMessage} />
      </Paper>

      {/* Snackbar de erro */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}