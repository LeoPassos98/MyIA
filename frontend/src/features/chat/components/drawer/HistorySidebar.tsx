import { useEffect, useState } from 'react';
import { Box, Button, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, Chat } from '../../../../services/chatHistoryService'; // Corrigido para usar Chat
import { useLayout } from '../../../../contexts/LayoutContext';

export default function HistorySidebar() {
  const [chats, setChats] = useState<Chat[]>([]); // Atualizado para usar Chat
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleNavigate()}
        sx={{ mb: 2 }}
      >
        Novo Chat
      </Button>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {chats.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            Nenhum histórico encontrado.
          </Typography>
        ) : (
          chats.map((chat) => (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(chat.id)}
                selected={location.pathname === `/chat/${chat.id}`}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText
                  primary={chat.title || `Chat ${chat.id.substring(0, 8)}...`}
                  primaryTypographyProps={{ noWrap: true, variant: 'body2', fontWeight: 'medium' }}
                  secondary={new Date(chat.createdAt).toLocaleDateString('pt-BR')}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}
