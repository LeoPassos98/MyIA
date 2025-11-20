import { useState, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper, Fade, alpha } from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useChatLogic } from '../features/chat/hooks/useChatLogic';
import { MessageList } from '../features/chat/components/MessageList';
import ChatInput from '../features/chat/components/ChatInput';
import { PromptModal } from '../features/chat/components/Modals/PromptModal';
import { InspectorModal } from '../features/chat/components/Modals/InspectorModal';

export default function Chat() {
  const { chatId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: 'background.default',
        background: 'linear-gradient(180deg, rgba(102,126,234,0.02) 0%, rgba(118,75,162,0.02) 100%)',
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 20px 40px rgba(102,126,234,0.3)',
                  animation: 'rotate 2s linear infinite',
                  '@keyframes rotate': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }}
              >
                <CircularProgress
                  size={50}
                  sx={{
                    color: 'white',
                  }}
                />
              </Box>
              <Typography variant="h6" color="text.secondary">
                Preparando sua experiência...
              </Typography>
            </Box>
          </Fade>
        </Box>
      ) : (
        /* Messages Area */
        <MessageList
          messages={messages}
          isDevMode={isDevMode}
          ref={messagesEndRef}
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

      {/* Dev Mode Debug Console */}
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
              background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid',
              borderColor: alpha('#667eea', 0.2),
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
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
                borderColor: alpha('#fff', 0.1),
                background: alpha('#000', 0.2),
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
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha('#000', 0.3),
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha('#00FF41', 0.3),
                  borderRadius: '3px',
                  '&:hover': {
                    background: alpha('#00FF41', 0.5),
                  }
                }
              }}
            >
              {debugLogs.length === 0 ? (
                <Typography
                  sx={{
                    color: alpha('#00FF41', 0.4),
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    fontStyle: 'italic'
                  }}
                >
                  [SYSTEM] Aguardando eventos...
                </Typography>
              ) : (
                debugLogs.map((log, index) => (
                  <Fade in timeout={200} key={index}>
                    <Box
                      sx={{
                        py: 0.25,
                        '&:hover': {
                          bgcolor: alpha('#00FF41', 0.05),
                          mx: -1,
                          px: 1,
                        }
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: alpha('#00FF41', 0.5),
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          mr: 1
                        }}
                      >
                        [{new Date().toLocaleTimeString('pt-BR')}]
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          color: '#00FF41',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all'
                        }}
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
          bgcolor: alpha('#fff', 0.8),
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
          isDevMode={isDevMode}
          setIsDevMode={setIsDevMode}
          isManualMode={false}
          isDrawerOpen={false}
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
  );
}