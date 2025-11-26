import { useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Fade, alpha, useTheme } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

// Layout Global
import MainLayout from '../../components/Layout/MainLayout';
import MainContentWrapper from '../../components/Layout/MainContentWrapper';

// Imports Locais da Feature
import { useChatLogic } from './hooks/useChatLogic';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import PromptModal from './components/Modals/PromptModal';
import InspectorModal from './components/Modals/InspectorModal'; // Corrigido para import named

export default function ChatPage() {
  const theme = useTheme();
  const { chatId } = useParams();

  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isLoading,
    debugLogs,
  } = useChatLogic(chatId);

  const [isDevMode, setIsDevMode] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);

  return (
    <MainLayout>
      <MainContentWrapper>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            bgcolor: 'background.default', // Correção Dark Mode
            height: '100%', // Garante altura total dentro do wrapper
            pt: '64px', // <--- ADICIONADO (Compensa a altura do Header)
          }}
        >
          {/* Loading State */}
          {isLoading && messages.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Fade in timeout={300}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      // Usa o gradiente do tema
                      background: theme.gradients.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                      animation: 'rotate 2s linear infinite',
                      '@keyframes rotate': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      }
                    }}
                  >
                    <CircularProgress
                      size={50}
                      sx={{ color: 'common.white' }}
                    />
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    Iniciando conexão neural...
                  </Typography>
                </Box>
              </Fade>
            </Box>
          ) : (
            /* Messages Area */
            <MessageList
              messages={messages}
              isDevMode={isDevMode}
              onViewPrompt={(data: any) => {
                setSelectedPrompt(data);
                setPromptModalOpen(true);
              }}
              onViewInspector={(data: any) => {
                setInspectorData(data);
                setIsInspectorOpen(true);
              }}
            />
          )}

          {/* Dev Mode Debug Console (Estilo Matrix Mantido) */}
          {isDevMode && (
            <Fade in timeout={400}>
              <Paper
                elevation={8}
                sx={{
                  mx: 2,
                  mb: 1,
                  height: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 2,
                  bgcolor: '#0d1117', // Fundo terminal hacker
                  border: '1px solid',
                  borderColor: alpha('#00FF41', 0.2),
                  boxShadow: `0 8px 32px ${alpha('#000', 0.5)}`,
                }}
              >
                {/* Console Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: alpha('#00FF41', 0.2),
                    bgcolor: alpha('#00FF41', 0.05),
                  }}
                >
                  <TerminalIcon sx={{ fontSize: 18, color: '#00FF41' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      color: '#00FF41',
                      fontWeight: 600,
                      letterSpacing: 1
                    }}
                  >
                    DEBUG CONSOLE
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 'auto',
                      fontFamily: 'monospace',
                      color: alpha('#00FF41', 0.6),
                      fontSize: '0.7rem'
                    }}
                  >
                    {debugLogs.length} logs
                  </Typography>
                </Box>

                {/* Console Content */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 1.5,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    lineHeight: 1.8,
                    color: '#00FF41',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                      background: alpha('#00FF41', 0.3),
                      borderRadius: '3px',
                    }
                  }}
                >
                  {debugLogs.length === 0 ? (
                    <Typography sx={{ color: alpha('#00FF41', 0.4), fontStyle: 'italic', fontSize: 'inherit' }}>
                      [SYSTEM] Aguardando eventos...
                    </Typography>
                  ) : (
                    debugLogs.map((log, index) => (
                      <Fade in timeout={200} key={index}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Typography
                            component="span"
                            sx={{ color: alpha('#00FF41', 0.5), fontSize: '0.7rem', minWidth: 65 }}
                          >
                            [{new Date().toLocaleTimeString('pt-BR')}]
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ color: '#00FF41', wordBreak: 'break-all', fontSize: 'inherit' }}
                          >
                            {log}
                          </Typography>
                        </Box>
                      </Fade>
                    ))
                  )}
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Chat Input - Always at bottom */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              borderTop: '1px solid',
              borderColor: 'divider',
              // Vidro do tema
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              zIndex: 10,
            }}
          >
            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSend={() => handleSendMessage()} // Ajustado para chamar sem argumentos
              isLoading={isLoading}
              isDevMode={isDevMode}
              setIsDevMode={setIsDevMode}
              isManualMode={false} // Conectar com sua lógica se necessário
              isDrawerOpen={false} // Conectar com LayoutContext se necessário
            />
          </Box>

          {/* Modals */}
          <PromptModal
            open={promptModalOpen}
            onClose={() => setPromptModalOpen(false)}
            data={selectedPrompt}
          />
          <InspectorModal
            open={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            data={inspectorData}
          />
        </Box>
      </MainContentWrapper>
    </MainLayout>
  );
}