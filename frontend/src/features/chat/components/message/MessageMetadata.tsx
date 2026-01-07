// frontend/src/features/chat/components/message/MessageMetadata.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Chip, Typography, useTheme } from '@mui/material';
import { Message } from '../../types';

interface MessageMetadataProps {
  message: Message;
  showDebugInfo?: boolean;
}

export function MessageMetadata({ message, showDebugInfo }: MessageMetadataProps) {
  const theme = useTheme();

  // Se não é assistant, não mostra nada (user não tem metadata)
  if (message.role !== 'assistant') return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Modelo */}
      {message.model && (
        <Chip
          label={message.model}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'background.paper' 
              : 'grey.100',
            color: 'text.secondary',
            fontWeight: 500,
          }}
        />
      )}

      {/* Provider (se diferente do modelo) */}
      {message.provider && message.provider !== message.model && (
        <Chip
          label={message.provider}
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        />
      )}

      {/* Tokens (Debug) */}
      {showDebugInfo && (message.tokensIn || message.tokensOut) && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {message.tokensIn || 0}↑ / {message.tokensOut || 0}↓
        </Typography>
      )}

      {/* Custo (Debug) */}
      {showDebugInfo && message.costInUSD !== undefined && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ fontSize: '0.7rem', fontFamily: theme.typography.monospace }}
        >
          ${message.costInUSD.toFixed(6)}
        </Typography>
      )}
    </Box>
  );
}
