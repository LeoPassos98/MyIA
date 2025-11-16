import { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Paper, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip, Switch, FormControlLabel, Modal } from '@mui/material';
import { Send as SendIcon, Code as CodeIcon, DataObject as DataObjectIcon } from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';
import ChatSidebar from '../components/Chat/ChatSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { chatService, StreamChunk } from '../services/chatService';
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
  const [currentChatProvider, setCurrentChatProvider] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [contextStrategy, setContextStrategy] = useState('fast'); // Padrão: rápido

  // --- Novos Estados para Modal de Contexto ---
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  // [V22] selectedPrompt pode ser relatório ou lista
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  // --- O "INSPETOR" V26 ---
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);

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

      // --- A LÓGICA DE TRAVAMENTO ---
      const selectedChat = chatHistory.find(c => c.id === chatId);
      if (selectedChat) {
        setCurrentChatProvider(selectedChat.provider);
      }
      // --- FIM DA LÓGICA ---
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
    setCurrentChatProvider(null);
    setDebugLogs([]); // Limpa monitor de debug
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

    // Prossegue normalmente
    setInputMessage('');
    setIsLoading(true);

    console.log('🐛 Estado antes de enviar:', {
      currentChatId,
      currentChatProvider,
      selectedProvider
    });

    // 1. Mensagem do usuário (optimista)
    const userMsgId = `temp-user-${Date.now()}`;
    const tempUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // 2. Bolha vazia do assistente
    const assistantMsgId = `temp-assistant-${Date.now()}`;
    const tempAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempAssistantMessage]);

    // 3. Inicia o Stream (definir providerToUse aqui)
    const providerToUse = currentChatProvider || selectedProvider;
    let newChatId: string | null = null;
    let newProvider: string | null = null;

    await chatService.streamChat(
      userMessage,
      providerToUse,
      currentChatId,
      contextStrategy,
      (chunk: StreamChunk) => {
        if (chunk.type === 'chunk') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + chunk.content }
                : msg
            )
          );
        } else if (chunk.type === 'telemetry') {
          const hasChatId = !!chunk.metrics.chatId && typeof chunk.metrics.chatId === 'string';

          if (hasChatId) {
            newChatId = chunk.metrics.chatId || null;
            newProvider = chunk.metrics.provider;
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    provider: chunk.metrics.provider,
                    model: chunk.metrics.model,
                    tokensIn: chunk.metrics.tokensIn,
                    tokensOut: chunk.metrics.tokensOut,
                    costInUSD: chunk.metrics.costInUSD,
                    sentContext: chunk.metrics.sentContext
                  }
                : msg
            )
          );

          if (chunk.metrics.provider) {
            newProvider = chunk.metrics.provider;
          }
        } else if (chunk.type === 'error') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: `❌ Erro: ${chunk.error}` }
                : msg
            )
          );
          setDebugLogs((prev) => [...prev, `❌ ERRO: ${chunk.error}`]);
        } else if (chunk.type === 'debug') {
          setDebugLogs((prev) => [...prev, chunk.log]);

          // --- Fallback V20.2: Extrair chatId e provider do log ---
          try {
            const log = chunk.log || '';
            const chatIdMatch = log.match(/Chat criado:\s*([0-9a-fA-F-]{36})/i);
            if (chatIdMatch) {
              const parsedId = chatIdMatch[1];
              if (!newChatId || newChatId !== parsedId) {
                newChatId = parsedId;
              }
            }
            const providerMatch = log.match(/\(provider:\s*([a-z0-9_-]+)\)/i);
            if (providerMatch) {
              const parsedProvider = providerMatch[1];
              if (!newProvider) {
                newProvider = parsedProvider;
              }
            }
          } catch {
            // noop
          }
        }
      },

      () => {
        setIsLoading(false);
        setCurrentChatId((prevChatId) => {
          if (newChatId && newChatId !== prevChatId) {
            if (newProvider && !currentChatProvider) {
              setCurrentChatProvider(newProvider);
            }
            loadChatHistory();
            return newChatId;
          }
          return prevChatId;
        });
      },

      (error: string) => {
        console.error('Erro fatal:', error);
        setIsLoading(false);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        alert(`Erro: ${error}`);
      }
    );
  };

  // --- Modal do Visualizador de Prompt ---
  // [V25] Modal de-duplicado pelo finalContext (V12)
  const renderPromptModal = () => {
    if (!selectedPrompt) return null;

    const isRagReport = selectedPrompt && selectedPrompt.finalContext;
    const isFastMode = Array.isArray(selectedPrompt);

    let relevantMessages_RAW: Message[] = []; // RAG (matéria-prima)
    let recentMessages_RAW: Message[] = [];   // V7 (matéria-prima)
    let finalContext_V12: Message[] = [];     // O "corte" V12 (fonte da verdade)

    if (isRagReport) {
      relevantMessages_RAW = selectedPrompt.relevantMessages || [];
      recentMessages_RAW = selectedPrompt.recentMessages || [];
      finalContext_V12 = selectedPrompt.finalContext || [];
    } else if (isFastMode) {
      finalContext_V12 = selectedPrompt;
    }

    // --- FILTRO V25: finalContext é a fonte da verdade + de-duplicação ---
    const finalContextIDs = new Set(finalContext_V12.map(msg => msg.id));

    // V7 filtrado pelo V12
    const recentMessages_FILTERED = recentMessages_RAW.filter(msg =>
      finalContextIDs.has(msg.id)
    );
    const recentMessages_FILTERED_IDs = new Set(recentMessages_FILTERED.map(msg => msg.id));

    // RAG filtrado pelo V12 e removendo duplicatas presentes no V7
    const relevantMessages_FILTERED = relevantMessages_RAW.filter(msg =>
      finalContextIDs.has(msg.id) && !recentMessages_FILTERED_IDs.has(msg.id)
    );

    const renderList = (messages: Message[]) =>
      messages.length === 0 ? (
        <Typography
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            color: '#888',
            fontSize: '12px',
            lineHeight: 1.6,
            fontStyle: 'italic',
            mb: 2
          }}
        >
          (Nenhuma mensagem única encontrada nesta categoria)
        </Typography>
      ) : (
        messages.map((msg, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Chip
              label={msg.role.toUpperCase()}
              color={msg.role === 'user' ? 'primary' : 'secondary'}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                color: '#00FF00',
                fontSize: '12px',
                lineHeight: 1.6
              }}
            >
              {msg.content}
            </Typography>
          </Box>
        ))
      );

    return (
      <Modal
        open={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper
          sx={{
            maxWidth: '80vw',
            maxHeight: '80vh',
            overflow: 'auto',
            p: 3,
            backgroundColor: 'background.paper'
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CodeIcon /> Contexto Enviado (V25 - De-duplicado)
          </Typography>

          <Box
            sx={{
              maxHeight: '60vh',
              overflow: 'auto',
              backgroundColor: '#1E1E1E',
              borderRadius: 1,
              p: 2
            }}
          >
            {/* RAG e V7 (apenas no relatório estruturado) */}
            {isRagReport && (
              <>
                <Chip
                  label={`🧠 Memória Relevante (RAG V9.4) - ${relevantMessages_FILTERED.length} msgs`}
                  sx={{ mb: 2, backgroundColor: 'secondary.main', color: 'white' }}
                  size="small"
                />
                {renderList(relevantMessages_FILTERED)}

                <Chip
                  label={`⚡ Memória Recente (V7) - ${recentMessages_FILTERED.length} msgs`}
                  sx={{ mb: 2, mt: 2, backgroundColor: 'primary.main', color: 'white' }}
                  size="small"
                />
                {renderList(recentMessages_FILTERED)}
              </>
            )}

            {/* Modo Rápido (V7) */}
            {isFastMode && (
              <>
                <Chip
                  label={`⚡ Contexto Rápido (V7) - ${finalContext_V12.length} msgs`}
                  sx={{ mb: 2, backgroundColor: 'primary.main', color: 'white' }}
                  size="small"
                />
                {renderList(finalContext_V12)}
              </>
            )}
          </Box>

          <Chip
            label={`Total Enviado (V12): ${finalContext_V12.length} msgs`}
            size="small"
            variant="outlined"
            sx={{ mt: 2, float: 'right' }}
          />
        </Paper>
      </Modal>
    );
  };

  // --- O "INSPETOR" V26 (O NOVO MODAL) ---
  const renderJsonInspectorModal = () => (
    <Modal
      open={isInspectorOpen}
      onClose={() => setIsInspectorOpen(false)}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper sx={{ 
        maxWidth: '80vw', 
        maxHeight: '80vh', 
        overflow: 'auto',
        p: 3,
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DataObjectIcon /> Inspetor de JSON (V26 - Bruto)
        </Typography>

        <Box sx={{ 
          backgroundColor: '#1E1E1E',
          borderRadius: 1,
          p: 2,
          maxHeight: '60vh', 
          overflow: 'auto', 
        }}>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'monospace', 
            color: '#00FF00',
            fontSize: '12px',
            lineHeight: 1.6
          }}>
            {inspectorData 
              ? JSON.stringify(inspectorData, null, 2) 
              : '(Nenhum dado selecionado)'}
          </pre>
        </Box>
      </Paper>
    </Modal>
  );

  // Mapa de limites de contexto por provider
  const providerContextLimits: Record<string, number> = {
    'groq': 4000,
    'openai': 126000,
    'claude': 198000,
    'together': 129072,
    'perplexity': 125000,
    'mistral': 30000,
  };

  // Função para formatar número com k/M
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${Math.round(tokens / 1000)}k`;
    }
    return tokens.toString();
  };

  // Pegar limite do provider atual
  const activeProvider = currentChatProvider || selectedProvider;
  const contextLimit = providerContextLimits[activeProvider] || 4000;
  const formattedLimit = formatTokens(contextLimit);

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
                <Box key={msg.id} sx={{ mb: 2 }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      ml: msg.role === 'user' ? 'auto' : 0,
                      mr: msg.role === 'assistant' ? 'auto' : 0,
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                      color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    {/* Conteúdo da mensagem */}
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>

                    {/* --- O "Rodapé" V14 (Telemetria Detalhada - APENAS EM MODO DEV) --- */}
                    {isDevMode && msg.role === 'assistant' && msg.model && (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          mt: 2, 
                          pt: 1,
                          borderTop: 1,
                          borderColor: 'divider',
                          opacity: 0.7,
                          flexWrap: 'wrap'
                        }}
                      >
                        
                        {/* 1. O Botão "Caixa Preta" (V25 - O Visual) */}
                        {msg.sentContext && msg.sentContext.length > 0 && (
                          <IconButton 
                            size="small"
                            onClick={() => {
                              const parsed = typeof msg.sentContext === 'string' 
                                ? JSON.parse(msg.sentContext) 
                                : msg.sentContext;
                              
                              // [A CURA V30]
                              setSelectedPrompt(parsed.debugReport_V22);
                              setPromptModalOpen(true);
                            }}
                            title="Ver Contexto Enviado (V25 - Visual)"
                            sx={{ 
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                              color: 'primary.main'
                            }}
                          >
                            <CodeIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* 2. Botão "JSON Enviado" (Bruto V26) */}
                        {msg.sentContext && msg.sentContext.length > 0 && (
                          <IconButton 
                            size="small"
                            onClick={() => {
                              const parsed = typeof msg.sentContext === 'string' 
                                ? JSON.parse(msg.sentContext) 
                                : msg.sentContext;
                              
                              // [A CURA V30]
                              setInspectorData(parsed.payloadSent_V23);
                              setIsInspectorOpen(true);
                            }}
                            title="Ver JSON Enviado (V26 - Bruto)"
                            sx={{ 
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                              color: 'secondary.main'
                            }}
                          >
                            <DataObjectIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* 3. Botão "JSON Recebido" (Bruto V26) */}
                        <IconButton 
                          size="small"
                          onClick={() => {
                            const { sentContext, ...msgSemContexto } = msg;
                            setInspectorData(msgSemContexto);
                            setIsInspectorOpen(true);
                          }}
                          title="Ver JSON Recebido (V26 - Bruto)"
                          sx={{ 
                            opacity: 0.7,
                            '&:hover': { opacity: 1 },
                            color: 'secondary.main',
                            ml: -1 
                          }}
                        >
                          <DataObjectIcon fontSize="small" />
                        </IconButton>

                        {/* 4. O Modelo (V14) */}
                        <Chip 
                          label={msg.model} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />

                        {/* 5. A Telemetria Detalhada (V14) */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.7rem',
                            color: 'text.secondary'
                          }}
                        >
                          Input: {msg.tokensIn || 0} | 
                          Output: {msg.tokensOut || 0} | 
                          Total: {(msg.tokensIn || 0) + (msg.tokensOut || 0)}
                        </Typography>

                        {/* 6. O Custo */}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.7rem', 
                            ml: 'auto',
                            color: 'text.secondary'
                          }}
                        >
                          Custo: ${(msg.costInUSD || 0).toFixed(6)}
                        </Typography>
                        
                      </Box>
                    )}
                  </Paper>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Monitor de Debug (Terminal) */}
          {isDevMode && (
            <Paper
              elevation={4}
              sx={{
                height: '200px',
                overflowY: 'auto',
                backgroundColor: '#1E1E1E',
                color: '#00FF00',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: 1,
                marginX: 2,
                marginBottom: 1,
              }}
            >
              {debugLogs.length === 0 ? (
                <Typography sx={{ color: '#666', fontFamily: 'monospace' }}>
                  Aguardando logs de debug...
                </Typography>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index}>
                    {`[${new Date().toLocaleTimeString()}] ${log}`}
                  </div>
                ))
              )}
            </Paper>
          )}

          {/* Input com Seletores */}
          <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              {/* Seletor de Provider */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Provider de IA</InputLabel>
                <Select
                  value={currentChatProvider || selectedProvider}
                  onChange={(e) => {
                    if (!currentChatProvider) {
                      setSelectedProvider(e.target.value);
                    }
                  }}
                  label="Provider de IA"
                  size="small"
                  disabled={!!currentChatProvider}
                >
                  <MenuItem value="groq">Groq (LLaMA 3.1 - Gratuito)</MenuItem>
                  <MenuItem value="openai">OpenAI (GPT-3.5/4)</MenuItem>
                  <MenuItem value="claude">Claude (Anthropic)</MenuItem>
                  <MenuItem value="together">Together.ai</MenuItem>
                  <MenuItem value="perplexity">Perplexity</MenuItem>
                  <MenuItem value="mistral">Mistral</MenuItem>
                </Select>
              </FormControl>

              {/* Seletor de Estratégia de Contexto */}
              <FormControl sx={{ minWidth: 250 }} size="small">
                <InputLabel id="strategy-label">Estratégia de Contexto</InputLabel>
                <Select
                  labelId="strategy-label"
                  value={contextStrategy}
                  label="Estratégia de Contexto"
                  onChange={(e) => setContextStrategy(e.target.value)}
                >
                  <MenuItem value="fast">
                    ⚡ Rápido (Últimas 10)
                  </MenuItem>
                  <MenuItem value="efficient">
                    🧠 Inteligente ({formattedLimit} tokens)
                  </MenuItem>
                </Select>
              </FormControl>

              {currentChatProvider && (
                <Chip 
                  label={`Provider: ${currentChatProvider.toUpperCase()}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}

              <Box sx={{ marginLeft: 'auto' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDevMode}
                      onChange={(e) => setIsDevMode(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Modo Dev"
                />
              </Box>
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

      {/* Renderizar Modal de Contexto (V25) */}
      {renderPromptModal()}

      {/* Renderizar Modal de Inspeção (V26) */}
      {renderJsonInspectorModal()}
    </MainLayout>
  );
}