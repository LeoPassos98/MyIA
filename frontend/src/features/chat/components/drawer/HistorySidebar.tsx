import { useEffect, useState } from 'react';
import { Box, Button, List, ListItem, ListItemButton, ListItemText, Typography, Divider, ListItemIcon, useTheme, alpha } from '@mui/material';
import { Add as AddIcon, ChatBubbleOutline, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, ChatSession } from '../../../../services/chatHistoryService';
import { useLayout } from '../../../../contexts/LayoutContext';

export default function HistorySidebar() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const { setIsHistoryOpen } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Cabeçalho do Drawer */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleNavigate()}
          sx={{ 
            background: theme.gradients.primary,
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 14px 0 rgba(0,118,255,0.2)'
          }}
        >
          Novo Chat
        </Button>
      </Box>

      <Divider />

      {/* Lista de Chats com Scroll */}
      <List sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {chats.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Nenhum histórico encontrado.
            </Typography>
          </Box>
        ) : (
          chats.map((chat) => {
            const isActive = location.pathname === `/chat/${chat.id}`;
            return (
              <ListItem key={chat.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(chat.id)}
                  selected={isActive}
                  sx={{ 
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.text.primary, 0.05)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                    <ChatBubbleOutline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={chat.title || `Conversa iniciada em...`}
                    primaryTypographyProps={{ 
                      noWrap: true, 
                      variant: 'body2', 
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'text.primary' : 'text.secondary'
                    }}
                    secondary={new Date(chat.createdAt).toLocaleDateString('pt-BR')}
                    secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </List>
      
      {/* Rodapé Fixo - Configurações */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton 
          onClick={() => { setIsHistoryOpen(false); navigate('/settings'); }}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </ListItemButton>
      </Box>
    </Box>
  );
}