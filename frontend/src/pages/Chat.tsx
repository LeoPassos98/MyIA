import { useState, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSend={handleSendMessage}
        isLoading={isLoading}
        isDevMode={isDevMode}
        setIsDevMode={setIsDevMode}
        isManualMode={false} // Ajuste conforme necessário
        isDrawerOpen={false} // Ajuste conforme necessário
      />

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