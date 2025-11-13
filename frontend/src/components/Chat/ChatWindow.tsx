import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress, FormControl, Select, MenuItem, Snackbar, Alert, Tooltip, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Message, Provider } from '../../types';
import { chatService } from '../../services/chatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const availableProviders = await chatService.getProviders();
        setProviders(availableProviders);

        const groqProvider = availableProviders.find((p) => p.name === 'groq');
        setSelectedProvider(groqProvider ? 'groq' : availableProviders[0]?.name || '');
      } catch (error) {
        console.error('Erro ao carregar providers:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    loadProviders();
  }, []);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    try {
      // Adicionar mensagem do usuário
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Enviar para API e receber resposta
      const response = await chatService.sendMessage(content, selectedProvider);

      // Adicionar resposta da IA
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContext = async () => {
    try {
      await chatService.clearContext();
      setMessages([]);
    } catch (error) {
      setError('Erro ao limpar contexto. Tente novamente.');
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <MessageList messages={messages} />
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <FormControl fullWidth size="small">
            {isLoadingProviders ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                displayEmpty
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.name} value={provider.name}>
                    {provider.name} ({provider.model})
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>

          <Tooltip title="Limpar Contexto">
            <IconButton
              onClick={handleClearContext}
              disabled={messages.length === 0}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>

        <MessageInput onSend={handleSendMessage} disabled={isLoading || !selectedProvider} />
      </Box>

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
    </Paper>
  );
};

export default ChatWindow;