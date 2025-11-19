import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage'; // Corrigido para named import

interface MessageListProps {
  messages: Message[];
  isDevMode: boolean;
  onViewPrompt: (data: any) => void;
  onViewInspector: (data: any) => void;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isDevMode, onViewPrompt, onViewInspector }, ref) => {
    return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDevMode={isDevMode}
            onViewPrompt={onViewPrompt}
            onViewInspector={onViewInspector}
          />
        ))}
        <div ref={ref} />
      </Box>
    );
  }
);
