// frontend/src/features/chat/components/drawer/HistorySidebar.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

// Sidebar de histórico de chats: exibe sessões agrupadas por data, permite navegar entre conversas e iniciar novas
import { useEffect, useState, useMemo } from 'react';
import {
  Box, Button, List, ListItem, ListItemButton, ListItemText,
  Typography, Divider, ListItemIcon, useTheme, alpha, ListSubheader, Skeleton, Tooltip,

} from '@mui/material';
import { Add as AddIcon, ChatBubbleOutline, Settings as SettingsIcon, History as HistoryIcon, LightModeOutlined as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, ChatSession } from '../../../../services/chatHistoryService';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTheme as useAppTheme } from '../../../../contexts/ThemeContext';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

/**
 * Componente Sidebar do Histórico de Chats
 * - Exibe sessões agrupadas por data (Hoje, Ontem, Últimos 7 dias, Antigos)
 * - Permite iniciar novo chat, navegar entre conversas e acessar configurações
 */
export default function HistorySidebar() {
  // Estado: lista de chats e status de carregamento
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Contexto do layout para controlar abertura do sidebar
  const { setIsHistoryOpen } = useLayout();
  // Navegação do React Router
  const navigate = useNavigate();
  const location = useLocation();
  // Tema MUI para estilização
  const theme = useTheme();
  const appTheme = useAppTheme();

  // 1. Carrega os chats do serviço ao montar o componente
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        // ✅ Agora 'allChats' é realmente um Chat[] (Array puro)
        const allChats = await chatHistoryService.getAllChats();

        const sortedChats = [...allChats].sort((a, b) =>
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

  /**
   * 2. Agrupa chats por data de criação
   * - Hoje: chats do dia
   * - Ontem: chats do dia anterior
   * - Últimos 7 dias: chats da última semana
   * - Antigos: chats anteriores a 7 dias
   */
  const groupedChats = useMemo(() => {
    const groups: Record<string, ChatSession[]> = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Antigos': []
    };

    // Datas de referência
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

  /**
   * Navega para o chat selecionado ou inicia novo chat
   * - Fecha o sidebar ao navegar
   * @param id id do chat (opcional)
   */
  const handleNavigate = (id?: string) => {
    setIsHistoryOpen(false);
    navigate(id ? `/chat/${id}` : '/chat');
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Botão para iniciar novo chat */}
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

      {/* Lista de chats agrupados por data */}
      <List sx={{ flex: 1, overflow: 'auto', px: 1, pt: 0, ...scrollbarStyles }}>
        {isLoading ? (
          // Estado de carregamento: esqueletos animados
          [1, 2, 3].map((i) => (
            <Box key={i} sx={{ p: 1 }}>
              <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={45} sx={{ borderRadius: 2 }} />
            </Box>
          ))
        ) : chats.length === 0 ? (
          // Estado vazio: nenhum chat encontrado
          <Box sx={{ textAlign: 'center', mt: 8, px: 2, opacity: 0.6 }}>
            <HistoryIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              Nenhum histórico ainda.
            </Typography>
          </Box>
        ) : (
          // Renderiza grupos de chats
          Object.entries(groupedChats).map(([groupName, groupItems]) => {
            if (groupItems.length === 0) return null;

            return (
              <li key={groupName}>
                <ul style={{ padding: 0 }}>
                  {/* Cabeçalho do grupo (Hoje, Ontem, etc) */}
                  <ListSubheader sx={{
                    bgcolor: 'background.paper',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 1
                  }}>
                    {groupName}
                  </ListSubheader>
                  {/* Lista de chats do grupo */}
                  {groupItems.map((chat) => {
                    // Detecta se o chat está ativo (selecionado)
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
                              paddingLeft: theme.spacing(1.5), // Compensa a borda
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                            },
                            '&:hover': {
                              bgcolor: alpha(theme.palette.text.primary, 0.05),
                              transform: 'translateX(4px)' // Pequena animação
                            }
                          }}
                        >
                          {/* Ícone de chat */}
                          <ListItemIcon sx={{ minWidth: 32, color: isActive ? 'primary.main' : 'text.disabled' }}>
                            <ChatBubbleOutline fontSize="small" />
                          </ListItemIcon>
                          {/* Título do chat */}
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
      {/* Rodapé: botão para configurações */}
      <Divider />

      <Box sx={{ width: '100%', px: 1, py: 1, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Abrir configurações">
          <Button
            variant="text"
            startIcon={<SettingsIcon />}
            onClick={() => { setIsHistoryOpen(false); navigate('/settings'); }}
            sx={{ borderRadius: 2, color: 'text.secondary', minWidth: 120, justifyContent: 'center', alignItems: 'center', display: 'flex' }}
          >
            Configurações
          </Button>
        </Tooltip>
        <Tooltip title={appTheme.mode === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}>
          <Button
            variant="text"
            onClick={appTheme.toggleTheme}
            sx={{
              minWidth: 40,
              color: 'text.secondary',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              '&:hover': {
                color: appTheme.mode === 'dark' ? 'primary.main' : 'warning.main',
                transform: 'scale(1.1)',
              }
            }}
          >
            {appTheme.mode === 'dark'
              ? <LightModeIcon sx={{ fontSize: 20, color: 'warning.main' }} />
              : <DarkModeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            }
          </Button>
        </Tooltip>
      </Box>

    </Box >
  );
}