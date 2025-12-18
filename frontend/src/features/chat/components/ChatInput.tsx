// frontend/src/features/chat/components/ChatInput.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)
import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  Fade,
  Tooltip,
  alpha,
  InputAdornment,
  useTheme,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon, // <--- NOVO ÍCONE
  Code as CodeIcon,
  AttachFile as AttachIcon,
  Mic as MicIcon,
  EmojiEmotions as EmojiIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { useChatInput } from '../hooks/useChatInput';
import { useDevMode } from '../../../contexts/DevModeContext';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
  onStop?: () => void; // <--- NOVA PROP
  isLoading: boolean;
  isDevMode: boolean;
  setIsDevMode: (val: boolean) => void;
  isManualMode: boolean;
  isDrawerOpen: boolean;
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
}: ChatInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Hook que gerencia histórico e enter
  const { handleSend, handleKeyDown } = useChatInput({
    inputMessage,
    setInputMessage,
    onSend,
    isLoading,
    isDrawerOpen
  });

  const canSend = inputMessage.trim().length > 0 && !isLoading && !isDrawerOpen;

  return (
    <Paper
      elevation={0}
      sx={{
        borderTop: '1px solid',
        borderColor: isLoading ? 'primary.main' : 'divider', // Feedback visual na borda se carregando
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* CONTAINER CENTRALIZADO */}
      <Box
        sx={{
          maxWidth: 900,        // 👈 mesmo valor do chat
          mx: 'auto',           // centraliza
          width: '100%',
        }}
      >
        {/* Top Bar with Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isManualMode && (
              <Fade in>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 2, background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)', boxShadow: '0 2px 8px rgba(251,140,0,0.3)' }}>
                  <WarningIcon sx={{ fontSize: 16, color: 'white' }} />
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, letterSpacing: 0.5 }}>MODO MANUAL</Typography>
                </Box>
              </Fade>
            )}
            {isDrawerOpen && (
              <Fade in>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.1), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.3) }}>
                  <WarningIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 500 }}>Editor aberto - Chat pausado</Typography>
                </Box>
              </Fade>
            )}
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={isDevMode}
                onChange={(e) => setIsDevMode(e.target.checked)}
                size="small"
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'primary.main' } }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CodeIcon sx={{ fontSize: 16, color: isDevMode ? 'primary.main' : 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: isDevMode ? 600 : 400, color: isDevMode ? 'primary.main' : 'text.secondary' }}>Dev Mode</Typography>
              </Box>
            }
          />
        </Box>

        {/* Main Input Area */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5, pb: 0.5 }}>
              <Tooltip title="Anexar arquivo"><IconButton size="small" disabled={isDrawerOpen} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', transform: 'scale(1.1)' } }}><AttachIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Emojis"><IconButton size="small" disabled={isDrawerOpen} sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main', transform: 'scale(1.1)' } }}><EmojiIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Entrada por voz"><IconButton size="small" disabled={isDrawerOpen} sx={{ color: 'text.secondary', '&:hover': { color: 'success.main', transform: 'scale(1.1)' } }}><MicIcon fontSize="small" /></IconButton></Tooltip>
            </Box>

            {/* Text Input - NÃO BLOQUEIA MAIS NO LOADING */}
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={isDrawerOpen ? 'Chat pausado...' : isManualMode ? 'Digite sua mensagem (Modo Manual)...' : 'Digite sua mensagem...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isDrawerOpen} // Só bloqueia se o Drawer estiver aberto
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  backgroundColor: isFocused ? alpha(theme.palette.background.paper, 1) : alpha(theme.palette.action.hover, 0.1),
                  '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 1) },
                  '& fieldset': { borderColor: isFocused ? alpha(theme.palette.primary.main, 0.5) : 'divider', borderWidth: isFocused ? 2 : 1 },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 }
                }
              }}
              InputProps={{
                endAdornment: inputMessage.trim() && (
                  <InputAdornment position="end">
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem', px: 1 }}>{inputMessage.trim().length} chars</Typography>
                  </InputAdornment>
                )
              }}
            />

            {/* Send / Stop Button */}
            <Box>
              {isLoading ? (
                // BOTÃO STOP
                <Tooltip title="Cancelar geração">
                  <IconButton
                    onClick={onStop}
                    sx={{
                      background: alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                      width: 48, height: 48,
                      '&:hover': { background: alpha(theme.palette.error.main, 0.2), transform: 'scale(1.05)' }
                    }}
                  >
                    <StopIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                // BOTÃO SEND
                <Tooltip title="Enviar (Enter)">
                  <span>
                    <IconButton
                      onClick={handleSend}
                      disabled={!canSend}
                      sx={{
                        background: canSend
                          ? theme.palette.gradients.primary // <--- Garanta que está assim
                          : 'transparent',
                        color: canSend ? 'white' : 'action.disabled',
                        width: 48, height: 48,
                        boxShadow: canSend ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
                        '&:hover': { transform: canSend ? 'scale(1.05)' : 'none', background: canSend ? theme.palette.gradients?.primary || theme.palette.primary.dark : 'transparent' }
                      }}
                    >
                      <SendIcon sx={{ fontSize: 24 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Helper Text */}
          {(isLoading || isDrawerOpen) && (
            <Fade in>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, ml: 6.5, color: isDrawerOpen ? 'error.main' : 'primary.main', fontWeight: 500 }}>
                {isLoading ? '🤖 Gerando resposta... (Pode digitar a próxima)' : '⚠️ Feche o painel do editor para continuar'}
              </Typography>
            </Fade>
          )}
        </Box>

        {/* Labels técnicos: só aparecem em DevMode */}
        {isDevMode && (
          <Chip 
            label="Debug Mode" 
            size="small" 
            color="warning"
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
          />
        )}
      </Box>
    </Paper>
  );
}