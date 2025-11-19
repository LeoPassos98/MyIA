import { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Paper, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip, Switch, FormControlLabel, Modal } from '@mui/material';
import { Send as SendIcon, Code as CodeIcon, DataObject as DataObjectIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { chatService, StreamChunk } from '../services/chatService';
import { chatHistoryService, Message } from '../services/chatHistoryService';
import { useLayout } from '../contexts/LayoutContext';

export default function Chat() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isEditorOpen } = useLayout();
  const { chatId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatProvider, setCurrentChatProvider] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [contextStrategy, setContextStrategy] = useState('fast');

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);

  // ✨ NOVO: Armazenar o chatId criado para navegar depois
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
      setCurrentChatProvider(null);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatMessages = async (id: string) => {
    try {
      setIsLoading(true);
      const chatMessages = await chatHistoryService.getChatMessages(id);
      setMessages(chatMessages);
      
      const chats = await chatHistoryService.getAllChats();
      const selectedChat = chats.find(c => c.id === id);
      if (selectedChat) {
        setCurrentChatProvider(selectedChat.provider);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isSendingRef = useRef(false);
  const chunkBufferRef = useRef<string>('');
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isEditorOpen || isSendingRef.current) {
      return;
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

    // ✨ RESET: Limpar o chatId armazenado
    newChatIdRef.current = null;

    const userMsgId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempAiMsgId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newUserMsg: Message = { id: userMsgId, role: 'user', content: userMsgText, createdAt: new Date().toISOString() };
    const newAiMsg: Message = { id: tempAiMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString(), costInUSD: 0 };

    setMessages(prev => [...prev, newUserMsg, newAiMsg]);

    const flushChunkBuffer = () => {
      if (chunkBufferRef.current.length > 0) {
        const contentToAdd = chunkBufferRef.current;
        chunkBufferRef.current = '';
        
        setMessages(prev => prev.map(msg => 
          msg.id === tempAiMsgId 
            ? { ...msg, content: msg.content + contentToAdd }
            : msg
        ));
      }
    };

    try {
      const providerToUse = currentChatProvider || selectedProvider;

      await chatService.streamChat(
        userMsgText,
        providerToUse,
        chatId || null,
        contextStrategy,
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
              setDebugLogs(prevLogs => [...prevLogs, chunk.log]);
              
            } else if (chunk.type === 'telemetry') {
              flushChunkBuffer();
              
              // ✨ CORREÇÃO: Apenas armazenar o chatId, não navegar ainda
              if (!chatId && chunk.metrics.chatId) {
                console.log(`[V46] Chat criado: ${chunk.metrics.chatId} - Navegação será feita após stream`);
                newChatIdRef.current = chunk.metrics.chatId;
                
                if (chunk.metrics.provider) {
                  setCurrentChatProvider(chunk.metrics.provider);
                }
              }
              
              setMessages(prev => prev.map(msg => {
                if (msg.id !== tempAiMsgId) return msg;
                
                return {
                  ...msg,
                  costInUSD: chunk.metrics.costInUSD,
                  model: chunk.metrics.model,
                  provider: chunk.metrics.provider,
                  tokensIn: chunk.metrics.tokensIn,
                  tokensOut: chunk.metrics.tokensOut,
                  sentContext: chunk.metrics.sentContext || msg.sentContext
                };
              }));
            }
          } catch (err) {
            console.error('Erro no onChunk:', err);
          }
        },
        () => { 
          flushChunkBuffer();
          isSendingRef.current = false;
          setIsLoading(false);
          
          // ✨ CORREÇÃO: Navegar APENAS após o stream terminar
          if (newChatIdRef.current && !chatId) {
            console.log(`[V46] Stream finalizado, navegando para: ${newChatIdRef.current}`);
            navigate(`/chat/${newChatIdRef.current}`, { replace: true });
            newChatIdRef.current = null;
          }
        },
        (err) => { 
          console.error('streamChat.onError', err);
          flushChunkBuffer();
          setMessages(prev => prev.map(msg => msg.id === tempAiMsgId ? { ...msg, content: msg.content + "\n[Erro]" } : msg));
          isSendingRef.current = false;
          setIsLoading(false);
        }
      );
      
    } catch (error) {
      console.error("Erro Fatal:", error);
    } finally {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    }
  };

  const renderPromptModal = () => {
    if (!selectedPrompt) return null;

    const isRagReport = selectedPrompt && selectedPrompt.finalContext;
    const isFastMode = Array.isArray(selectedPrompt);

    let relevantMessages_RAW: Message[] = [];
    let recentMessages_RAW: Message[] = [];
    let finalContext_V12: Message[] = [];

    if (isRagReport) {
      relevantMessages_RAW = selectedPrompt.relevantMessages || [];
      recentMessages_RAW = selectedPrompt.recentMessages || [];
      finalContext_V12 = selectedPrompt.finalContext || [];
    } else if (isFastMode) {
      finalContext_V12 = selectedPrompt;
    }

    const finalContextIDs = new Set(finalContext_V12.map(msg => msg.id));

    const recentMessages_FILTERED = recentMessages_RAW.filter(msg =>
      finalContextIDs.has(msg.id)
    );
    const recentMessages_FILTERED_IDs = new Set(recentMessages_FILTERED.map(msg => msg.id));

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

  const providerContextLimits: Record<string, number> = {
    'groq': 4000,
    'openai': 126000,
    'claude': 198000,
    'together': 129072,
    'perplexity': 125000,
    'mistral': 30000,
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${Math.round(tokens / 1000)}k`;
    }
    return tokens.toString();
  };

  const activeProvider = currentChatProvider || selectedProvider;
  const contextLimit = providerContextLimits[activeProvider] || 4000;
  const formattedLimit = formatTokens(contextLimit);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>

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
                    
                    {msg.sentContext && msg.sentContext.length > 0 && (
                      <IconButton 
                        size="small"
                        onClick={() => {
                          let parsed: any = msg.sentContext;
                          if (typeof msg.sentContext === 'string') {
                            try {
                              const trimmed = msg.sentContext.trim();
                              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                                parsed = JSON.parse(msg.sentContext);
                              } else {
                                alert('O contexto enviado não está em formato JSON. Conteúdo:\n\n' + msg.sentContext);
                                return;
                              }
                            } catch (e) {
                              alert('Erro ao decodificar o contexto enviado: ' + e + '\n\nConteúdo:\n' + msg.sentContext);
                              return;
                            }
                          }
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

                    {msg.sentContext && msg.sentContext.length > 0 && (
                      <IconButton 
                        size="small"
                        onClick={() => {
                          let parsed: any = msg.sentContext;
                          if (typeof msg.sentContext === 'string') {
                            try {
                              const trimmed = msg.sentContext.trim();
                              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                                parsed = JSON.parse(msg.sentContext);
                              } else {
                                alert('O contexto enviado não está em formato JSON. Conteúdo:\n\n' + msg.sentContext);
                                return;
                              }
                            } catch (e) {
                              alert('Erro ao decodificar o contexto enviado: ' + e + '\n\nConteúdo:\n' + msg.sentContext);
                              return;
                            }
                          }
                          
                          setInspectorData(parsed?.payloadSent_V23 || parsed);
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

                    <Chip 
                      label={msg.model} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />

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

      <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
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
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || isEditorOpen}
            helperText={isEditorOpen ? "Feche o painel do editor para enviar." : ""}
            multiline
            maxRows={4}
          />
          <IconButton
            color="primary"
            onClick={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            disabled={!inputMessage.trim() || isLoading || isEditorOpen}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>

      {renderPromptModal()}
      {renderJsonInspectorModal()}
    </Box>
  );
}