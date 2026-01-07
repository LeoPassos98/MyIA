// frontend/src/features/chat/components/input/ChatInput.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { useRef, useEffect } from 'react';
import { Box, Typography, Fade, Switch, FormControlLabel, Alert, useTheme, alpha } from '@mui/material';
import { useChatInput } from '../../hooks/useChatInput';
import { SendButton } from './SendButton';
import { InputTextField } from './InputTextField';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading: boolean;
  isDevMode: boolean;
  setIsDevMode: (val: boolean) => void;
  isManualMode: boolean;
  isDrawerOpen: boolean;
  onHeightChange?: (height: number) => void;
}

export default function ChatInput({
  inputMessage,
  setInputMessage,
  onSend,
  onStop,
  isLoading,
  isDevMode,
  setIsDevMode,
  isManualMode,
  isDrawerOpen,
  onHeightChange,
}: ChatInputProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver para detectar mudanças na altura do input
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onHeightChange) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        onHeightChange(height + 32); // +32px para margem extra
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [onHeightChange]);

  const { handleSend, handleKeyDown } = useChatInput({
    inputMessage,
    setInputMessage,
    onSend,
    isLoading,
    isDrawerOpen,
  });

  const canSend = inputMessage.trim().length > 0 && !isLoading && !isDrawerOpen;

  const placeholder = isDrawerOpen
    ? 'Chat pausado...'
    : isManualMode
    ? 'Digite sua mensagem (Modo Manual)...'
    : 'Digite sua mensagem...';

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: alpha(theme.palette.background.default, 0.85),
        backdropFilter: 'blur(2px)',
        borderTop: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          width: '100%',
          px: 2,
          py: 3,
          position: 'relative',
        }}
      >
      {/* Status Bar Flutuante (aparece acima do input) */}
      {(isManualMode || isDrawerOpen) && (
        <Fade in>
          <Alert
            severity={isDrawerOpen ? 'error' : 'warning'}
            sx={{
              mb: 1.5,
              borderRadius: 2,
            }}
          >
            {isDrawerOpen
              ? 'Chat pausado - Feche o painel do editor para continuar'
              : 'Modo Manual ativo - Histórico não será usado automaticamente'}
          </Alert>
        </Fade>
      )}

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {/* Dev Mode Toggle (esquerda, alinhado) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 64,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isDevMode}
                onChange={(e) => setIsDevMode(e.target.checked)}
                disabled={isDrawerOpen}
              />
            }
            label={
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                }}
              >
                Dev
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>

        {/* Text Input */}
        <InputTextField
          value={inputMessage}
          onChange={setInputMessage}
          onKeyDown={handleKeyDown}
          disabled={isDrawerOpen}
          placeholder={placeholder}
        />

        {/* Send / Stop Button */}
        <SendButton
          isLoading={isLoading}
          canSend={canSend}
          onSend={handleSend}
          onStop={onStop}
        />
      </Box>

      {/* Helper Text */}
      {isLoading && (
        <Fade in>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              ml: 8,
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            Gerando resposta...
          </Typography>
        </Fade>
      )}
      </Box>
    </Box>
  );
}
