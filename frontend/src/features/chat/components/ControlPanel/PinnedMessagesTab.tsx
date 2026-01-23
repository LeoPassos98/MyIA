// frontend/src/features/chat/components/ControlPanel/PinnedMessagesTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, Typography, List, ListItem, ListItemText,
  IconButton, Chip, Button
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import DeleteIcon from '@mui/icons-material/Delete';
import { PanelSection } from './PanelSection';
import { HelpTooltip } from './HelpTooltip';
import { useControlPanelLogic } from './useControlPanelLogic';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

export const PinnedMessagesTab = () => {
  const { chatHistorySnapshot, onUnpinMessage } = useControlPanelLogic();
  
  // Filtra apenas mensagens pinadas
  const pinnedMessages = chatHistorySnapshot.filter(msg => msg.isPinned);

  return (
    <Box sx={{ px: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PushPinIcon color="secondary" /> Mensagens Fixadas
          </Typography>
          <HelpTooltip 
            title="Mensagens Fixadas (Pinned)"
            description="Mensagens fixadas são SEMPRE incluídas no contexto enviado à IA, independente do limite de tokens. Têm prioridade máxima sobre RAG e memória recente."
            examples={['Fixe instruções importantes do projeto', 'Preserve decisões técnicas', 'Mantenha contexto crítico sempre visível']}
          />
        </Box>
        <Chip 
          label={`${pinnedMessages.length} pinadas`}
          size="small"
          color="secondary"
          variant="outlined"
        />
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Mensagens fixadas são enviadas obrigatoriamente no contexto de todas as próximas mensagens,
        tendo prioridade sobre o RAG e memória recente.
      </Typography>

      {/* Toolbar de Ações em Lote */}
      {pinnedMessages.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (confirm(`Deseja realmente desafixar todas as ${pinnedMessages.length} mensagens?`)) {
                pinnedMessages.forEach(msg => onUnpinMessage?.(msg.id));
              }
            }}
          >
            Desafixar Todas ({pinnedMessages.length})
          </Button>
        </Box>
      )}

      {/* Lista de Mensagens Pinadas */}
      <PanelSection sx={{ maxHeight: 400, overflow: 'auto', p: 0, ...scrollbarStyles }}>
        <List dense>
          {pinnedMessages.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <PushPinIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nenhuma mensagem fixada.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Use o ícone 📌 nas mensagens do chat para fixá-las aqui.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                Mensagens fixadas têm prioridade máxima no contexto da IA.
              </Typography>
            </Box>
          ) : (
            pinnedMessages.map((msg) => (
              <ListItem
                key={msg.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'backgrounds.secondarySubtle',
                  '&:hover': {
                    bgcolor: 'backgrounds.secondaryHover'
                  }
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    title="Desafixar mensagem"
                    onClick={() => {
                      if (confirm('Deseja realmente desafixar esta mensagem?')) {
                        onUnpinMessage?.(msg.id);
                      }
                    }}
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
            bgcolor: 'backgrounds.infoSubtle',
            borderColor: 'borders.infoSubtle',
            border: '1px solid',
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
