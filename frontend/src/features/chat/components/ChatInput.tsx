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
  useTheme
} from '@mui/material';
import { 
  Send as SendIcon,
  Code as CodeIcon,
  AttachFile as AttachIcon,
  Mic as MicIcon,
  EmojiEmotions as EmojiIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSend: () => void;
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
  isLoading,
  isDevMode,
  setIsDevMode,
  isManualMode,
  isDrawerOpen,
}: ChatInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const canSend = inputMessage.trim() && !isLoading && !isDrawerOpen;

  const handleSend = () => {
    if (canSend) {
      onSend();
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderTop: '1px solid',
        borderColor: 'divider',
        // Usa a cor do papel com transparência para suportar Dark Mode + Blur
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top Bar with Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Left side - Mode indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isManualMode && (
            <Fade in>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  // Mantém laranja para warning, mas usa tokens se possível
                  background: 'linear-gradient(135deg, #FFA726 0%, #FB8C00 100%)',
                  boxShadow: '0 2px 8px rgba(251,140,0,0.3)',
                }}
              >
                <WarningIcon sx={{ fontSize: 16, color: 'white' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    letterSpacing: 0.5
                  }}
                >
                  MODO MANUAL
                </Typography>
              </Box>
            </Fade>
          )}
          
          {isDrawerOpen && (
            <Fade in>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.error.main, 0.3),
                }}
              >
                <WarningIcon sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'error.main',
                    fontWeight: 500
                  }}
                >
                  Editor aberto - Chat pausado
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>

        {/* Right side - Dev Mode Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={isDevMode}
              onChange={(e) => setIsDevMode(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'primary.main',
                },
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CodeIcon sx={{ fontSize: 16, color: isDevMode ? 'primary.main' : 'text.secondary' }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: isDevMode ? 600 : 400,
                  color: isDevMode ? 'primary.main' : 'text.secondary'
                }}
              >
                Dev Mode
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Main Input Area */}
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1.5,
            alignItems: 'flex-end',
          }}
        >
          {/* Additional Action Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5, pb: 0.5 }}>
            <Tooltip title="Anexar arquivo">
              <IconButton
                size="small"
                disabled={isDrawerOpen}
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                    transform: 'scale(1.1)',
                  },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <AttachIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Emojis">
              <IconButton
                size="small"
                disabled={isDrawerOpen}
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'warning.main',
                    transform: 'scale(1.1)',
                  },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <EmojiIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Entrada por voz">
              <IconButton
                size="small"
                disabled={isDrawerOpen}
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'success.main',
                    transform: 'scale(1.1)',
                  },
                  '&.Mui-disabled': { opacity: 0.3 }
                }}
              >
                <MicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Text Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              isDrawerOpen 
                ? 'Chat pausado - feche o editor para continuar...' 
                : isManualMode 
                  ? 'Digite sua mensagem (Modo Manual ativo)...'
                  : 'Digite sua mensagem...'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading || isDrawerOpen}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                transition: 'all 0.3s ease',
                // Cor de fundo adaptativa (Claro: Cinza claro / Escuro: Cinza escuro)
                backgroundColor: isFocused 
                  ? alpha(theme.palette.background.paper, 1)
                  : alpha(theme.palette.action.hover, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 1),
                },
                '& fieldset': {
                  borderColor: isFocused 
                    ? alpha(theme.palette.primary.main, 0.5)
                    : 'divider',
                  borderWidth: isFocused ? 2 : 1,
                  transition: 'all 0.3s ease',
                },
                '&:hover fieldset': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.action.disabledBackground, 0.1),
                  '& fieldset': {
                    borderColor: 'divider',
                  }
                }
              },
              '& .MuiInputBase-input': {
                fontSize: '0.95rem',
                lineHeight: 1.6,
                '&::placeholder': {
                  color: isDrawerOpen ? 'error.main' : 'text.secondary',
                  opacity: 0.7,
                }
              }
            }}
            InputProps={{
              endAdornment: inputMessage.trim() && (
                <InputAdornment position="end">
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      px: 1
                    }}
                  >
                    {inputMessage.trim().length} chars
                  </Typography>
                </InputAdornment>
              )
            }}
          />

          {/* Send Button */}
          <Tooltip title={isDrawerOpen ? 'Feche o editor primeiro' : 'Enviar mensagem (Enter)'}>
            <span>
              <IconButton
                onClick={handleSend}
                disabled={!canSend}
                sx={{
                  // Usa o gradiente do Design System
                  background: canSend
                    ? theme.gradients.primary
                    : 'transparent',
                  color: canSend ? 'white' : 'action.disabled',
                  width: 48,
                  height: 48,
                  transition: 'all 0.3s ease',
                  boxShadow: canSend
                    ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`
                    : 'none',
                  '&:hover': {
                    transform: canSend ? 'scale(1.05)' : 'none',
                    boxShadow: canSend
                      ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`
                      : 'none',
                    background: canSend
                      ? theme.gradients.primary
                      : 'transparent',
                  },
                  '&:active': {
                    transform: canSend ? 'scale(0.95)' : 'none',
                  },
                  '&.Mui-disabled': {
                    background: alpha(theme.palette.action.disabledBackground, 0.1),
                  }
                }}
              >
                <SendIcon 
                  sx={{ 
                    fontSize: 24,
                    transform: isLoading ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.3s ease',
                  }} 
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Helper Text */}
        {(isLoading || isDrawerOpen) && (
          <Fade in>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                ml: 6.5,
                color: isDrawerOpen ? 'error.main' : 'primary.main',
                fontWeight: 500,
              }}
            >
              {isLoading ? '🤖 Processando sua mensagem...' : '⚠️ Feche o painel do editor para continuar'}
            </Typography>
          </Fade>
        )}
      </Box>
    </Paper>
  );
}