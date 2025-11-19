import { useEffect, useState } from 'react';
import { 
  Box, List, ListItem, ListItemButton, ListItemText, 
  ListItemSecondaryAction, IconButton, Typography, Button, Divider, CircularProgress 
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { chatHistoryService, Chat } from '../../services/chatHistoryService';

interface ChatSidebarProps {
  onClose?: () => void;
}

export default function ChatSidebar({ onClose }: ChatSidebarProps) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const data = await chatHistoryService.getAllChats();
      setChats(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    navigate('/chat');
    onClose?.();
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chat/${id}`);
    onClose?.();
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      try {
        await chatHistoryService.deleteChat(id);
        await loadChats();
        if (chatId === id) {
          navigate('/chat');
        }
      } catch (error) {
        console.error('Erro ao excluir:', error);
      }
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Button 
          variant="contained" 
          fullWidth 
          startIcon={<AddIcon />}
          onClick={handleNewChat}
        >
          Novo Chat
        </Button>
      </Box>
      
      <Divider />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {(chats || []).length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">Nenhuma conversa</Typography>
            </Box>
          ) : (
            (chats || []).map((chat) => (
              <ListItem key={chat.id} disablePadding>
                <ListItemButton 
                  selected={chatId === chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <ChatIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={chat.title || 'Nova Conversa'} 
                    primaryTypographyProps={{ 
                      noWrap: true, 
                      style: { width: '140px' } 
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      )}
    </Box>
  );
}
