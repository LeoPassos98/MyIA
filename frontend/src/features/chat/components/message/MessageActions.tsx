// frontend/src/features/chat/components/message/MessageActions.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, IconButton, Tooltip } from '@mui/material';
import {
  CopyAll as CopyIcon,
  DataObject as DataObjectIcon,
  Timeline as TimelineIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import { Message } from '../../types';

interface MessageActionsProps {
  message: Message;
  isDevMode: boolean;
  onTogglePin?: (messageId: string) => void;
  onViewPayload?: () => void;
  onOpenTrace?: () => void;
}

export function MessageActions({
  message,
  isDevMode,
  onTogglePin,
  onViewPayload,
  onOpenTrace,
}: MessageActionsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {/* Pin */}
      <Tooltip title={message.isPinned ? 'Desafixar' : 'Fixar mensagem'}>
        <IconButton
          size="small"
          onClick={() => onTogglePin?.(message.id)}
          sx={{
            color: message.isPinned ? 'primary.main' : 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {message.isPinned ? (
            <PushPinIcon fontSize="small" />
          ) : (
            <PushPinOutlinedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* Copy */}
      <Tooltip title="Copiar mensagem">
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <CopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Debug: Payload */}
      {isDevMode && message.role === 'assistant' && (
        <Tooltip title="Ver Payload">
          <IconButton
            size="small"
            onClick={onViewPayload}
            sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}
          >
            <DataObjectIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Debug: Trace */}
      {isDevMode && message.role === 'assistant' && (
        <Tooltip title="Prompt Trace">
          <IconButton
            size="small"
            onClick={onOpenTrace}
            sx={{ color: 'text.secondary', '&:hover': { color: 'info.main' } }}
          >
            <TimelineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
