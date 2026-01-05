// frontend/src/features/chat/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';

// Layout Global
import MainLayout from '../../components/Layout/MainLayout';
import MainContentWrapper from '../../components/Layout/MainContentWrapper';
import { LoadingScreen } from '../../components/Feedback/LoadingScreen';
import { useLayout } from '../../contexts/LayoutContext';

// Componentes da Feature (Modularizados)
import { useChatLogic } from './hooks/useChatLogic';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { DevConsole } from './components/DevConsole';

export default function ChatPage() {
  const theme = useTheme();
  const { chatId } = useParams();
  const { setOnUnpinMessage } = useLayout();

  // O Hook agora fornece tudo, inclusive o Stop real
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleStop, // <--- O stop real vem daqui agora!
    handleTogglePin,
    isLoading,
    debugLogs,
  } = useChatLogic(chatId);

  // Registra o callback de unpin no contexto global para o ControlPanel
  useEffect(() => {
    setOnUnpinMessage(handleTogglePin);
    return () => setOnUnpinMessage(undefined);
  }, [handleTogglePin, setOnUnpinMessage]);

  // UI States (Modais e Paineis)
  const [isDevMode, setIsDevMode] = useState(false);

  // Placeholders para contextos futuros
  const isDrawerOpen = false; 
  const isManualMode = false; 

  return (
    <MainLayout>
      <MainContentWrapper>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            bgcolor: 'background.default',
            height: '100%',
            pt: '64px',
          }}
        >
          {/* 1. Tela de Carregamento Inicial */}
          <LoadingScreen 
            visible={isLoading && messages.length === 0} 
            message="Iniciando conexão neural..." 
          />

          {/* 2. Área de Mensagens */}
          {(!isLoading || messages.length > 0) && (
            <MessageList
              messages={messages}
              isDevMode={isDevMode}
              onTogglePin={handleTogglePin}
            />
          )}

          {/* 3. Console Hacker (Modularizado) */}
          <DevConsole 
            logs={debugLogs} 
            visible={isDevMode} 
          />

          {/* 4. Input Area (Fixo no rodapé) */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              zIndex: 10,
            }}
          >
            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSend={handleSendMessage}
              onStop={handleStop} // Conectado!
              isLoading={isLoading}
              isDevMode={isDevMode}
              setIsDevMode={setIsDevMode}
              isManualMode={isManualMode}
              isDrawerOpen={isDrawerOpen}
            />
          </Box>

          {/* Removido: Modals Globais de auditoria */}
        </Box>
      </MainContentWrapper>
    </MainLayout>
  );
}
