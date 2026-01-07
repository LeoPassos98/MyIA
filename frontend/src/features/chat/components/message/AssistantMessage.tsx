// frontend/src/features/chat/components/message/AssistantMessage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Typography } from '@mui/material';
import { Message } from '../../types';
import { MessageActions } from './MessageActions';
import { MessageMetadata } from './MessageMetadata';
import MarkdownRenderer from '../MarkdownRenderer';

interface AssistantMessageProps {
  message: Message;
  isDevMode: boolean;
  onTogglePin?: (messageId: string) => void;
  onViewPayload?: () => void;
  onOpenTrace?: () => void;
}

export function AssistantMessage({
  message,
  isDevMode,
  onTogglePin,
  onViewPayload,
  onOpenTrace,
}: AssistantMessageProps) {

  return (
    <Box
      sx={{
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          gap: 2,
          p: 3,
        }}
      >
        
        {/* Conteúdo */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Markdown Content */}
          <Box
            sx={{
              color: 'text.primary',
              fontSize: 16,
              lineHeight: 1.7,
              '& p': { mb: 1.5 },
              '& p:last-child': { mb: 0 },
            }}
          >
            <MarkdownRenderer content={message.content} />
          </Box>

          {/* Rodapé: Ações à esquerda, Metadata à direita */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 2,
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: 3,
              minWidth: 0,
              flexWrap: 'wrap',
            }}
          >
            {/* Esquerda: Ações */}
            <MessageActions
              message={message}
              isDevMode={isDevMode}
              onTogglePin={onTogglePin}
              onViewPayload={onViewPayload}
              onOpenTrace={onOpenTrace}
            />

            {/* Direita: Metadata (Provider, Modelo, Custo) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MessageMetadata message={message} showDebugInfo={isDevMode} />
              
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.7rem' }}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
