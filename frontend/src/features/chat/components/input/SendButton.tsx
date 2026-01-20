// frontend/src/features/chat/components/input/SendButton.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { IconButton, Tooltip, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';

interface SendButtonProps {
  isLoading: boolean;
  canSend: boolean;
  onSend: () => void;
  onStop?: () => void;
}

export function SendButton({ isLoading, canSend, onSend, onStop }: SendButtonProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Tooltip title="Cancelar geração">
        <IconButton
          onClick={onStop}
          sx={{
            bgcolor: theme.palette.mode === 'dark' 
              ? 'error.dark' 
              : 'error.light',
            color: 'error.contrastText',
            width: 48,
            height: 48,
            '&:hover': {
              bgcolor: 'error.main',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s',
          }}
        >
          <StopIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Enviar (Enter)">
      <span>
        <IconButton
          onClick={onSend}
          disabled={!canSend}
          sx={{
            background: canSend
              ? theme.palette.gradients.primary
              : 'transparent',
            color: canSend ? 'white' : 'action.disabled',
            width: 48,
            height: 48,
            boxShadow: canSend ? 3 : 'none',
            '&:hover': {
              transform: canSend ? 'scale(1.05)' : 'none',
              background: canSend
                ? theme.palette.gradients.primary
                : 'transparent',
            },
            '&:disabled': {
              background: 'transparent',
              color: 'action.disabled',
            },
            transition: 'all 0.2s',
          }}
        >
          <SendIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
