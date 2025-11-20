import { useEffect, useState } from 'react';
import { 
  Box, Button, List, ListItem, ListItemButton, ListItemText, 
  Typography, Divider, ListItemIcon, Fade, alpha 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Settings as SettingsIcon,
  History as HistoryIcon,
  ChatBubbleOutline as ChatIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, Chat } from '../../../../services/chatHistoryService';
import { useLayout } from '../../../../contexts/LayoutContext';

export default function HistorySidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const { setIsHistoryOpen } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const allChats = await chatHistoryService.getAllChats();
        const sortedChats = allChats.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setChats(sortedChats);
      } catch (error) {
        console.error('Erro ao carregar histórico de chats:', error);
      }
    };

    fetchChats();
  }, []);

  const handleNavigate = (id?: string) => {
    setIsHistoryOpen(false);
    navigate(id ? `/chat/${id}` : '/chat');
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(25,118,210,0.03) 0%, rgba(25,118,210,0) 100%)',
      }}
    >
      {/* Header com botão Novo Chat */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => handleNavigate()}
          sx={{
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }
          }}
        >
          Novo Chat
        </Button>
      </Box>

      <Divider sx={{ opacity: 0.1, mx: 2 }} />

      {/* Lista de Chats */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {chats.length === 0 ? (
          <Fade in timeout={600}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 4,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)',
                }}
              >
                <HistoryIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Sem conversas ainda
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ textAlign: 'center', maxWidth: '80%' }}
              >
                Comece uma nova conversa clicando no botão acima
              </Typography>
            </Box>
          </Fade>
        ) : (
          <List sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
            {chats.map((chat, index) => (
              <Fade in timeout={300 + index * 50} key={chat.id}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigate(chat.id)}
                    selected={location.pathname === `/chat/${chat.id}`}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '3px',
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      },
                      '&:hover': {
                        bgcolor: alpha('#667eea', 0.08),
                        transform: 'translateX(3px)',
                        '&::before': {
                          opacity: 1,
                        }
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha('#667eea', 0.12),
                        '&::before': {
                          opacity: 1,
                        },
                        '&:hover': {
                          bgcolor: alpha('#667eea', 0.16),
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ChatIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={chat.title || `Chat ${chat.id.substring(0, 8)}...`}
                      primaryTypographyProps={{ 
                        noWrap: true, 
                        variant: 'body2', 
                        fontWeight: 500,
                        sx: { fontSize: '0.9rem' }
                      }}
                      secondary={new Date(chat.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      secondaryTypographyProps={{ 
                        variant: 'caption',
                        sx: { opacity: 0.7, fontSize: '0.75rem' }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Fade>
            ))}
          </List>
        )}
      </Box>

      {/* Footer com Configurações */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Divider sx={{ opacity: 0.1, mb: 1 }} />
        <ListItemButton 
          onClick={() => { setIsHistoryOpen(false); navigate('/settings'); }}
          sx={{
            borderRadius: 2,
            py: 1.2,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha('#667eea', 0.08),
              transform: 'translateX(3px)',
            }
          }}
        >
          <ListItemIcon>
            <SettingsIcon sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Configurações" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}