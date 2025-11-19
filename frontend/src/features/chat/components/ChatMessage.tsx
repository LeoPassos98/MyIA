import { Box, Paper, Typography, IconButton, Chip } from '@mui/material';
import { Code as CodeIcon, DataObject as DataObjectIcon } from '@mui/icons-material';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isDevMode: boolean;
  onViewPrompt?: (data: any) => void;
  onViewInspector?: (data: any) => void;
}

export function ChatMessage({ message, isDevMode, onViewPrompt, onViewInspector }: ChatMessageProps) {
  const handleViewPrompt = () => {
    onViewPrompt?.(message);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        sx={{
          p: 2,
          maxWidth: '70%',
          ml: message.role === 'user' ? 'auto' : 0,
          mr: message.role === 'assistant' ? 'auto' : 0,
          bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
          color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>

        {isDevMode && message.role === 'assistant' && (
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
              flexWrap: 'wrap',
            }}
          >
            {message.sentContext && (
              <>
                <IconButton
                  size="small"
                  onClick={handleViewPrompt}
                  title="Ver Contexto Enviado"
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    color: 'primary.main',
                  }}
                >
                  <CodeIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onViewInspector && onViewInspector(message)}
                  title="Ver JSON Enviado"
                  sx={{
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    color: 'secondary.main',
                  }}
                >
                  <DataObjectIcon fontSize="small" />
                </IconButton>
              </>
            )}
            <Chip label={message.model} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'text.secondary',
              }}
            >
              Input: {message.tokensIn || 0} | Output: {message.tokensOut || 0} | Total: {(message.tokensIn || 0) + (message.tokensOut || 0)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                ml: 'auto',
                color: 'text.secondary',
              }}
            >
              Custo: ${(message.costInUSD || 0).toFixed(6)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
