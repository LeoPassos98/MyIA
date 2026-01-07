// frontend/src/features/chat/components/message/UserMessage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Paper, Typography, useTheme } from '@mui/material';
import { Message } from '../../types';
import { MessageActions } from './MessageActions';

interface UserMessageProps {
  message: Message;
  isDevMode: boolean;
  onTogglePin?: (messageId: string) => void;
}

export function UserMessage({ message, isDevMode, onTogglePin }: UserMessageProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        justifyContent: 'flex-end',
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: { xs: '90%', sm: '75%', md: '70%' } }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 7,
            borderTopRightRadius: 0.5,
            bgcolor: theme.palette.mode === 'dark'
              ? 'primary.dark'
              : 'primary.light',
            color: theme.palette.mode === 'dark'
              ? 'primary.contrastText'
              : 'primary.contrastText',
          }}
        >
          {/* Conteúdo */}
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.6,
            }}
          >
            {message.content}
          </Typography>

          {/* Rodapé: Ações à esquerda, Timestamp à direita */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mt: 1,
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <MessageActions
              message={message}
              isDevMode={isDevMode}
              onTogglePin={onTogglePin}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: '0.7rem',
                opacity: 0.8,
              }}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
