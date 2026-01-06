// frontend/src/features/chat/components/drawer/HistorySidebar.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useEffect, useState, useMemo } from 'react';
import { 
  Box, Button, List, ListItem, ListItemButton, ListItemText, 
  Typography, Divider, ListItemIcon, useTheme, alpha, ListSubheader, Skeleton
} from '@mui/material';
import { Add as AddIcon, ChatBubbleOutline, Settings as SettingsIcon, History as HistoryIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, ChatSession } from '../../../../services/chatHistoryService';
import { useLayout } from '../../../../contexts/LayoutContext';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

export default function HistorySidebar() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsHistoryOpen } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // 1. Carrega os chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const allChats = await chatHistoryService.getAllChats();
        // Garante ordenação do mais novo para o mais antigo
        const sortedChats = allChats.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setChats(sortedChats);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  // 2. Lógica de Agrupamento (Smart Grouping)
  const groupedChats = useMemo(() => {
    const groups: Record<string, ChatSession[]> = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Antigos': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    chats.forEach(chat => {
      const chatDate = new Date(chat.createdAt);
      // Zera hora para comparar apenas dias
      const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDateOnly.getTime() === today.getTime()) {
        groups['Hoje'].push(chat);
      } else if (chatDateOnly.getTime() === yesterday.getTime()) {
        groups['Ontem'].push(chat);
      } else if (chatDateOnly > lastWeek) {
        groups['Últimos 7 dias'].push(chat);
      } else {
        groups['Antigos'].push(chat);
      }
    });

    return groups;
  }, [chats]);

  const handleNavigate = (id?: string) => {
    setIsHistoryOpen(false);
    navigate(id ? `/chat/${id}` : '/chat');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      
      {/* Botão Novo Chat */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => handleNavigate()}
          sx={{ 
            background: theme.palette.gradients.primary,
            color: 'white',
            fontWeight: 'bold',
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
            '&:hover': {
              background: theme.palette.gradients.secondary, // Efeito sutil
            }
          }}
        >
          Novo Chat
        </Button>
      </Box>

      <Divider />

      {/* Lista com Grupos */}
      <List sx={{ flex: 1, overflow: 'auto', px: 1, pt: 0, ...scrollbarStyles }}>
        {isLoading ? (
          // Loading Skeletons
          [1, 2, 3].map((i) => (
            <Box key={i} sx={{ p: 1 }}>
              <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={45} sx={{ borderRadius: 2 }} />
            </Box>
          ))
        ) : chats.length === 0 ? (
          // Empty State
          <Box sx={{ textAlign: 'center', mt: 8, px: 2, opacity: 0.6 }}>
            <HistoryIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              Nenhum histórico ainda.
            </Typography>
          </Box>
        ) : (
          // Renderização dos Grupos
          Object.entries(groupedChats).map(([groupName, groupItems]) => {
            if (groupItems.length === 0) return null;

            return (
              <li key={groupName}>
                <ul style={{ padding: 0 }}>
                  <ListSubheader sx={{ 
                    bgcolor: 'background.paper', 
                    fontWeight: 'bold', 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    mt: 1
                  }}>
                    {groupName}
                  </ListSubheader>
                  
                  {groupItems.map((chat) => {
                    const isActive = location.pathname === `/chat/${chat.id}`;
                    return (
                      <ListItem key={chat.id} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleNavigate(chat.id)}
                          selected={isActive}
                          sx={{ 
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderLeft: `4px solid ${theme.palette.primary.main}`,
                              paddingLeft: '12px', // Compensa a borda
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                            },
                            '&:hover': {
                              bgcolor: alpha(theme.palette.text.primary, 0.05),
                              transform: 'translateX(4px)' // Pequena animação
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: isActive ? 'primary.main' : 'text.disabled' }}>
                            <ChatBubbleOutline fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={chat.title || "Nova Conversa"}
                            primaryTypographyProps={{ 
                              noWrap: true, 
                              variant: 'body2', 
                              fontWeight: isActive ? 600 : 400,
                              color: isActive ? 'text.primary' : 'text.secondary'
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </ul>
              </li>
            );
          })
        )}
      </List>
      
      {/* Rodapé */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton 
          onClick={() => { setIsHistoryOpen(false); navigate('/settings'); }}
          sx={{ borderRadius: 2, color: 'text.secondary' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </ListItemButton>
      </Box>
    </Box>
  );
}