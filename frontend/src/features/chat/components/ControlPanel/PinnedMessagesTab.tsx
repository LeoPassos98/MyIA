// frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { 
  Box, Typography, List, ListItem, ListItemText, 
  IconButton, alpha, useTheme, Chip
} from '@mui/material';
import { 
  PushPin as PushPinIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { PanelSection } from './PanelSection';
import { useControlPanelLogic } from './useControlPanelLogic';

export const PinnedMessagesTab = () => {
  const theme = useTheme();
  const { chatHistorySnapshot, onUnpinMessage } = useControlPanelLogic();
  
  // Filtra apenas mensagens pinadas
  const pinnedMessages = chatHistorySnapshot.filter(msg => msg.isPinned);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PushPinIcon color="primary" /> Mensagens Fixadas
        </Typography>
        <Chip 
          label={`${pinnedMessages.length} pinadas`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Mensagens fixadas são enviadas obrigatoriamente no contexto de todas as próximas mensagens, 
        tendo prioridade sobre o RAG e memória recente.
      </Typography>

      {/* Lista de Mensagens Pinadas */}
      <PanelSection sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
        <List dense>
          {pinnedMessages.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <PushPinIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhuma mensagem fixada.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Use o ícone 📌 nas mensagens do chat para fixá-las.
              </Typography>
            </Box>
          ) : (
            pinnedMessages.map((msg) => (
              <ListItem
                key={msg.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.1) 
                  }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small"
                    title="Desafixar mensagem"
                    onClick={() => onUnpinMessage?.(msg.id)}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={msg.role === 'user' ? '👤 Você' : '🤖 IA'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 0.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {msg.content}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </PanelSection>

      {/* Aviso de Prioridade */}
      {pinnedMessages.length > 0 && (
        <Box 
          sx={{ 
            mt: 2, 
            p: 2, 
            borderRadius: 1,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
          }}
        >
          <Typography variant="caption" color="info.main" fontWeight="bold">
            📌 Prioridade de Contexto
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            1. Mensagens Pinadas (obrigatórias) → 2. RAG Semântico → 3. Memória Recente
          </Typography>
        </Box>
      )}
    </Box>
  );
};
