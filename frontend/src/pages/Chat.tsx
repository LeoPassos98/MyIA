import { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Paper, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';
import ChatSidebar from '../components/Chat/ChatSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { chatHistoryService, Chat as ChatType, Message } from '../services/chatHistoryService';

export default function Chat() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatHistory, setChatHistory] = useState<ChatType[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [isLoading, setIsLoading] = useState(false);

  // Proteger rota
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Carregar lista de conversas ao montar
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll ao adicionar mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const chats = await chatHistoryService.getAllChats();
      setChatHistory(chats);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chatMessages = await chatHistoryService.getChatMessages(chatId);
      setMessages(chatMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInputMessage('');
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatHistoryService.deleteChat(chatId);
      if (currentChatId === chatId) {
        handleNewChat();
      }
      await loadChatHistory();
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Adiciona mensagem do usuário otimisticamente
    const tempUserMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatService.sendMessage(userMessage, selectedProvider, currentChatId);
      
      // Atualiza chatId se foi criado um novo chat
      if (response.chatId !== currentChatId) {
        setCurrentChatId(response.chatId);
        await loadChatHistory(); // Atualiza sidebar
      }

      // Adiciona resposta da IA
      const assistantMessage: Message = {
        id: 'temp-ai-' + Date.now(),
        role: 'assistant',
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        // Remove mensagem temporária e adiciona as reais
        const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
        return [...withoutTemp, tempUserMessage, assistantMessage];
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remove mensagem temporária em caso de erro
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Barra Lateral */}
        <ChatSidebar
          chats={chatHistory}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onNewChat={handleNewChat}
        />

        {/* Área de Chat */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Mensagens */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {isLoading && messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Envie uma mensagem para começar
                </Typography>
              </Box>
            ) : (
              messages.map((msg) => (
                <Paper
                  key={msg.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    maxWidth: '70%',
                    ml: msg.role === 'user' ? 'auto' : 0,
                    mr: msg.role === 'assistant' ? 'auto' : 0,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body1">{msg.content}</Typography>
                </Paper>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input com Seletor de Provider */}
          <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Provider de IA</InputLabel>
                <Select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  label="Provider de IA"
                  size="small"
                >
                  <MenuItem value="groq">Groq (LLaMA 3.1 - Gratuito)</MenuItem>
                  <MenuItem value="openai">OpenAI (GPT-3.5/4)</MenuItem>
                  <MenuItem value="claude">Claude (Anthropic)</MenuItem>
                  <MenuItem value="together">Together.ai</MenuItem>
                  <MenuItem value="perplexity">Perplexity</MenuItem>
                  <MenuItem value="mistral">Mistral</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Digite sua mensagem..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
                multiline
                maxRows={4}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Box>
    </MainLayout>
  );
}