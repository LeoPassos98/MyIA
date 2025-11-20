import { forwardRef } from 'react';
import { Box, Typography, Fade, alpha } from '@mui/material';
import { 
  AutoAwesome as SparkleIcon,
  Psychology as BrainIcon,
  TipsAndUpdates as IdeaIcon 
} from '@mui/icons-material';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: Message[];
  isDevMode: boolean;
  onViewPrompt: (data: any) => void;
  onViewInspector: (data: any) => void;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isDevMode, onViewPrompt, onViewInspector }, ref) => {
    if (messages.length === 0) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            p: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Gradient Orbs */}
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '10%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'float 6s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-20px)' },
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(118,75,162,0.1) 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'float 8s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />

          <Fade in timeout={600}>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              {/* Logo/Icon */}
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 20px 40px rgba(102,126,234,0.3)',
                  position: 'relative',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { 
                      boxShadow: '0 20px 40px rgba(102,126,234,0.3)',
                      transform: 'scale(1)'
                    },
                    '50%': { 
                      boxShadow: '0 25px 50px rgba(102,126,234,0.4)',
                      transform: 'scale(1.05)'
                    },
                  }
                }}
              >
                <SparkleIcon sx={{ fontSize: 50, color: 'white' }} />
              </Box>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                MyIA
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: '1.1rem',
                  fontWeight: 400
                }}
              >
                Sua assistente inteligente está quase "pronta"
              </Typography>

              {/* Suggestion Cards */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  mt: 4
                }}
              >
                {[
                  { icon: <BrainIcon />, text: 'Faça perguntas complexas' },
                  { icon: <IdeaIcon />, text: 'Explore novas ideias' },
                  { icon: <SparkleIcon />, text: 'Crie algo incrível' }
                ].map((item, index) => (
                  <Fade in timeout={800 + index * 200} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        px: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha('#fff', 0.8),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main',
                          boxShadow: '0 8px 20px rgba(102,126,234,0.15)',
                          bgcolor: alpha('#667eea', 0.05),
                        }
                      }}
                    >
                      <Box sx={{ color: 'primary.main' }}>
                        {item.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {item.text}
                      </Typography>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Fade>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: { xs: 1, sm: 2, md: 3 },
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // Custom Scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: alpha('#000', 0.05),
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#667eea', 0.3),
            borderRadius: '10px',
            '&:hover': {
              background: alpha('#667eea', 0.5),
            }
          }
        }}
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isDevMode={isDevMode}
            onViewPrompt={onViewPrompt}
            onViewInspector={onViewInspector}
          />
        ))}
        <div ref={ref} />
      </Box>
    );
  }
);