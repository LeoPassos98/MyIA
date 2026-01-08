// frontend/src/features/chat/index.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';

// Layout Global
import { LoadingScreen } from '../../components/Feedback/LoadingScreen';
import { useLayout } from '../../contexts/LayoutContext';

// Componentes da Feature (Modularizados)
import { useChatLogic } from './hooks/useChatLogic';
import { MessageList } from './components/message';
import { ChatInput } from './components/input';
import { DevConsole } from './components/DevConsole';

export default function ChatPage() {
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
  const [inputHeight, setInputHeight] = useState(180); // Altura padrão do input

  // Placeholders para contextos futuros
  const isDrawerOpen = false; 
  const isManualMode = false; 

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: 'background.default',
        height: '100%',
        minHeight: 0, // Importante para flex shrink funcionar
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
          inputHeight={inputHeight}
          devConsole={
            <DevConsole
              logs={debugLogs}
              visible={isDevMode}
            />
          }
        />
      )}

      {/* 4. Input Area (Fixed Bottom - Glassmorphism) */}
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSend={handleSendMessage}
        onStop={handleStop}
        isLoading={isLoading}
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
        isManualMode={isManualMode}
        isDrawerOpen={isDrawerOpen}
        onHeightChange={setInputHeight}
      />

      {/* Removido: Modals Globais de auditoria */}
    </Box>
  );
}
