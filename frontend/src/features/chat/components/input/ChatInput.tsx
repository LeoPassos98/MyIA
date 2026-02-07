// frontend/src/features/chat/components/input/ChatInput.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
// Otimização Fase 2: Layout Optimization - Batch resize measurements
// Fase 3: Memory Optimization - React.memo e useCallback

import { useRef, useEffect, memo } from 'react';
import { Box, Typography, Fade, FormControlLabel, Alert, useTheme, alpha } from '@mui/material';
import { OptimizedSwitch } from '../../../../components/OptimizedSwitch';
import { useChatInput } from '../../hooks/useChatInput';
import { SendButton } from './SendButton';
import { InputTextField } from './InputTextField';
import { useThrottledCallback } from '../../../../hooks/useEventOptimization';
import { useBatchedLayout } from '../../../../hooks/useLayoutOptimization';
import { useMemoryLeakDetection } from '../../../../hooks/memory';

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

function ChatInput({
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

  // Fase 3: Memory leak detection (apenas em dev)
  const memoryTracker = useMemoryLeakDetection('ChatInput');

  // Otimização Fase 2: Batch DOM operations para medições
  const { scheduleRead } = useBatchedLayout();

  // ResizeObserver para detectar mudanças na altura do input
  // Otimização Fase 2: Agrupa leituras DOM para evitar layout thrashing
  const throttledHeightUpdate = useThrottledCallback(
    (height: number) => {
      if (onHeightChange) {
        onHeightChange(height);
      }
    },
    150, // Throttle de 150ms para resize handlers
    [onHeightChange]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onHeightChange) return;

    // Callback para atualizar altura com batch read
    // Fase 2: Agrupa leitura de offsetHeight para evitar forced reflow
    const updateHeight = () => {
      scheduleRead(() => container.offsetHeight).then(height => {
        throttledHeightUpdate(height);
      });
    };

    // Chama ao montar (leitura inicial agrupada)
    scheduleRead(() => container.offsetHeight).then(height => {
      onHeightChange(height);
    });

    // Observa mudanças de tamanho com throttle e batch operations
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    // Fase 3: Rastreia observer para garantir cleanup
    memoryTracker.trackObserver(resizeObserver);
    resizeObserver.observe(container);
    
    return () => {
      memoryTracker.disconnectObserver(resizeObserver);
    };
  }, [onHeightChange, throttledHeightUpdate, scheduleRead, memoryTracker]);

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
              <OptimizedSwitch
                size="small"
                checked={isDevMode}
                onChange={(e) => setIsDevMode(e.target.checked)}
                disabled={isDrawerOpen}
                aria-label="Modo desenvolvedor"
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

// Fase 3: Memoiza componente para evitar re-renders desnecessários
export default memo(ChatInput, (prevProps, nextProps) => {
  return (
    prevProps.inputMessage === nextProps.inputMessage &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isDevMode === nextProps.isDevMode &&
    prevProps.isManualMode === nextProps.isManualMode &&
    prevProps.isDrawerOpen === nextProps.isDrawerOpen &&
    prevProps.onSend === nextProps.onSend &&
    prevProps.onStop === nextProps.onStop &&
    prevProps.setInputMessage === nextProps.setInputMessage &&
    prevProps.setIsDevMode === nextProps.setIsDevMode &&
    prevProps.onHeightChange === nextProps.onHeightChange
  );
});
