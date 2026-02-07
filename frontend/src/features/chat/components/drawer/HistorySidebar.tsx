// frontend/src/features/chat/components/drawer/HistorySidebar.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// Otimização Fase 2: Layout Optimization - Drawer animations com CSS transforms
// Fase 3: Memory Optimization - React.memo em items de lista

// Sidebar de histórico de chats: exibe sessões agrupadas por data, permite navegar entre conversas e iniciar novas
import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import {
  Box, Button, List, ListItem, ListItemButton, ListItemText,
  Typography, Divider, ListItemIcon, useTheme, alpha, ListSubheader, Skeleton, Tooltip,
  TextField, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatHistoryService, ChatSession } from '../../../../services/chatHistoryService';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useTheme as useAppTheme } from '../../../../contexts/ThemeContext';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';
import { useDebounce } from '../../../../hooks/useEventOptimization';
import { useStableCallback } from '../../../../hooks/memory';

// Fase 3: Componente memoizado para item de chat individual
interface ChatItemProps {
  chat: ChatSession;
  isActive: boolean;
  onNavigate: (id: string) => void;
}

const ChatItem = memo(({ chat, isActive, onNavigate }: ChatItemProps) => {
  const theme = useTheme();
  
  const handleClick = useCallback(() => {
    onNavigate(chat.id);
  }, [chat.id, onNavigate]);

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={handleClick}
        selected={isActive}
        sx={{
          borderRadius: 2,
          // Otimização Fase 2: Usar transform para animações GPU-accelerated
          transition: 'background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
          willChange: 'transform',
          '&.Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            paddingLeft: theme.spacing(1.5), // Compensa a borda
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) }
          },
          '&:hover': {
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            // Otimização Fase 2: Transform é GPU-accelerated
            transform: 'translateX(4px)',
          }
        }}
      >
        {/* Ícone de chat */}
        <ListItemIcon sx={{ minWidth: 32, color: isActive ? 'primary.main' : 'text.disabled' }}>
          <ChatBubbleOutlineIcon fontSize="small" />
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
}, (prevProps, nextProps) => {
  // Só re-renderiza se chat, isActive ou onNavigate mudarem
  return (
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.title === nextProps.chat.title &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onNavigate === nextProps.onNavigate
  );
});

ChatItem.displayName = 'ChatItem';

/**
 * Componente Sidebar do Histórico de Chats
 * - Exibe sessões agrupadas por data (Hoje, Ontem, Últimos 7 dias, Antigos)
 * - Permite iniciar novo chat, navegar entre conversas e acessar configurações
 */
function HistorySidebar() {
  // Estado: lista de chats e status de carregamento
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Otimização: Estado de busca com debounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce de 300ms
  
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
   * 2. Filtra chats baseado na busca (com debounce)
   * Otimização: Usa debouncedSearchQuery para evitar filtros excessivos
   */
  const filteredChats = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return chats;
    }
    
    const query = debouncedSearchQuery.toLowerCase();
    return chats.filter(chat =>
      chat.title?.toLowerCase().includes(query)
    );
  }, [chats, debouncedSearchQuery]);

  /**
   * 3. Agrupa chats filtrados por data de criação
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

    filteredChats.forEach(chat => {
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
  }, [filteredChats]);

  /**
   * Navega para o chat selecionado ou inicia novo chat
   * - Fecha o sidebar ao navegar
   * @param id id do chat (opcional)
   */
  // Fase 3: useCallback para estabilizar função e evitar re-renders
  const handleNavigate = useStableCallback((id?: string) => {
    setIsHistoryOpen(false);
    navigate(id ? `/chat/${id}` : '/chat');
  });

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      // Otimização Fase 2: Isolar subtree para evitar reflows externos
      contain: 'layout style paint',
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

      {/* Otimização: Campo de busca com debounce */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Box>

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
        ) : filteredChats.length === 0 ? (
          // Estado vazio: nenhum chat encontrado
          <Box sx={{ textAlign: 'center', mt: 8, px: 2, opacity: 0.6 }}>
            <HistoryIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhum histórico ainda.'}
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
                  {/* Fase 3: Lista de chats usando componente memoizado */}
                  {groupItems.map((chat) => {
                    const isActive = location.pathname === `/chat/${chat.id}`;
                    return (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={isActive}
                        onNavigate={handleNavigate}
                      />
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
              ? <LightModeOutlinedIcon sx={{ fontSize: 20, color: 'warning.main' }} />
              : <DarkModeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            }
          </Button>
        </Tooltip>
      </Box>

    </Box >
  );
}

// Fase 3: Memoiza componente principal
export default memo(HistorySidebar);