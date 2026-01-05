// frontend/src/features/chat/components/ChatMessage.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Box, Paper, Typography, IconButton, Chip, Fade, alpha, useTheme } from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  CopyAll as CopyIcon,
  DataObject as DataObjectIcon,
  Timeline as TimelineIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { useAudit } from '../../audit/context/AuditContext';

interface ChatMessageProps {
  message: Message;
  isDevMode?: boolean;
  showDebugInfo?: boolean;
  onTogglePin?: (messageId: string) => void;
}

export default function ChatMessage({
  message,
  isDevMode = false,
  showDebugInfo = false,
  onTogglePin,
}: ChatMessageProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const { openAudit } = useAudit(); 

  const handleViewPayload = () => {
    openAudit({
      messageId: message.id,
      mode: 'payload', // ✅ CORRIGIDO: 'prompt' → 'payload'
      source: 'chat',
    });
  };

  const handleOpenPromptTrace = () => {
    window.open(`/prompt-trace/${message.id}`, '_blank');
  };

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            gap: 1.5,
            width: isUser ? { xs: '90%', sm: '70%', md: '65%' } : '100%',
            maxWidth: isUser ? 600 : '100%',
            alignItems: 'flex-start',
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              mt: 0.5,
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isUser
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.secondary.main, 0.1),
              color: isUser ? 'primary.main' : 'secondary.main',
              flexShrink: 0,
            }}
          >
            {isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
          </Box>

          {/* Balão/Painel */}
          <Paper
            elevation={0}
            sx={{
              p: isUser ? 2 : { xs: 2, sm: 3 },
              borderRadius: isUser ? 2 : 3,
              borderTopRightRadius: isUser ? 0 : 3,
              borderTopLeftRadius: isUser ? 2 : 0,
              bgcolor: isUser
                ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08)
                : alpha(theme.palette.background.paper, 0.95),
              border: isUser
                ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                : 'none',
              boxShadow: isUser ? undefined : `0 2px 16px ${alpha(theme.palette.grey[900], 0.04)}`,
              width: isUser ? '100%' : '100%',
              maxWidth: isUser ? 600 : '100%',
              minWidth: 0,
              overflowX: 'auto',
              '& p': { m: 0 },
              '& pre': { m: 0 },
              transition: 'background 0.2s',
            }}
          >
            {/* Conteúdo */}
            {isUser ? (
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.6 }}
              >
                {message.content}
              </Typography>
            ) : (
              <Box sx={{ color: 'text.primary', fontSize: { xs: 16, sm: 17 }, lineHeight: 1.7 }}>
                <MarkdownRenderer content={message.content} />
              </Box>
            )}

            {/* Rodapé */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 1,
                gap: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {/* Botão de Pin - disponível para todas as mensagens */}
                <IconButton
                  size="small"
                  title={message.isPinned ? "Desafixar mensagem" : "Fixar mensagem"}
                  onClick={() => onTogglePin?.(message.id)}
                  sx={{
                    color: message.isPinned ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    }
                  }}
                >
                  {message.isPinned ? (
                    <PushPinIcon fontSize="inherit" />
                  ) : (
                    <PushPinOutlinedIcon fontSize="inherit" />
                  )}
                </IconButton>

                <IconButton
                  size="small"
                  title="Copiar"
                  onClick={() => navigator.clipboard.writeText(message.content)}
                >
                  <CopyIcon fontSize="inherit" />
                </IconButton>

                {isDevMode && message.role === 'assistant' && (
                  <>
                    <IconButton size="small" title="Abrir Auditoria" onClick={handleViewPayload}>
                      <DataObjectIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" title="Abrir Prompt Trace" onClick={handleOpenPromptTrace}>
                      <TimelineIcon fontSize="inherit" />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>

            {showDebugInfo && message.model && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Chip
                  label={message.model}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1, fontSize: '0.65rem' }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {(message.costInUSD || 0).toFixed(6)} USD
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
}
