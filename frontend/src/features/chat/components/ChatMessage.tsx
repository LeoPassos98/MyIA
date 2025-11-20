import { Box, Paper, Typography, IconButton, Chip, Fade, alpha } from '@mui/material';
import { 
  Code as CodeIcon, 
  DataObject as DataObjectIcon,
  Person as PersonIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isDevMode: boolean;
  onViewPrompt?: (data: any) => void;
  onViewInspector?: (data: any) => void;
}

export function ChatMessage({ message, isDevMode, onViewPrompt, onViewInspector }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <Fade in timeout={400}>
      <Box 
        sx={{ 
          mb: 2,
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          px: { xs: 1, sm: 2 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            gap: 1.5,
            maxWidth: { xs: '90%', sm: '75%', md: '70%' },
            alignItems: 'flex-start'
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: isUser 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {isUser ? (
              <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
            ) : (
              <BotIcon sx={{ color: 'white', fontSize: 20 }} />
            )}
          </Box>

          {/* Message Content */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              background: isUser
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'white',
              color: isUser ? 'white' : 'black',
              border: isUser ? 'none' : '1px solid',
              borderColor: 'divider',
              position: 'relative',
              boxShadow: isUser 
                ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: isUser 
                  ? '0 6px 20px rgba(102, 126, 234, 0.4)'
                  : '0 4px 12px rgba(0,0,0,0.12)',
              }
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}
            >
              {message.content}
            </Typography>

            {/* Dev Mode Info */}
            {isDevMode && message.role === 'assistant' && (
              <Fade in timeout={600}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 2,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: alpha('#000', 0.08),
                  }}
                >
                  {/* Action Buttons */}
                  {message.sentContext && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => onViewPrompt?.(message)}
                        sx={{
                          bgcolor: alpha('#667eea', 0.1),
                          color: '#667eea',
                          width: 28,
                          height: 28,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha('#667eea', 0.2),
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <CodeIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onViewInspector?.(message)}
                        sx={{
                          bgcolor: alpha('#764ba2', 0.1),
                          color: '#764ba2',
                          width: 28,
                          height: 28,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha('#764ba2', 0.2),
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <DataObjectIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}

                  {/* Model Chip */}
                  <Chip 
                    label={message.model} 
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                    }}
                  />

                  {/* Tokens Info */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      gap: 1,
                      flexWrap: 'wrap',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: 'text.secondary',
                        bgcolor: alpha('#000', 0.04),
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                      }}
                    >
                      🔤 {message.tokensIn || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: 'text.secondary',
                        bgcolor: alpha('#000', 0.04),
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                      }}
                    >
                      ✍️ {message.tokensOut || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                        bgcolor: alpha('#000', 0.04),
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                      }}
                    >
                      Σ {(message.tokensIn || 0) + (message.tokensOut || 0)}
                    </Typography>
                  </Box>

                  {/* Cost */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#4CAF50',
                      bgcolor: alpha('#4CAF50', 0.1),
                      px: 1,
                      py: 0.3,
                      borderRadius: 1,
                      ml: 'auto'
                    }}
                  >
                    💰 ${(message.costInUSD || 0).toFixed(6)}
                  </Typography>
                </Box>
              </Fade>
            )}
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
}