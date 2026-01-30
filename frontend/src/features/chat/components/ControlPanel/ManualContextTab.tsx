// frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO
// MIGRATED: Fase 3 - Padronização Visual

import {
  Box, Typography, FormControlLabel, Switch, Divider,
  List, ListItemButton, ListItemIcon, Checkbox, ListItemText,
  Alert, Button, Tooltip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { CounterBadge, StatusBadge } from '@/components/Badges';
import { PanelSection } from './PanelSection';
import { HelpTooltip } from './HelpTooltip';
import { useControlPanelLogic } from './useControlPanelLogic';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

export const ManualContextTab = () => {
  const { manualContext, setManualContext, chatHistorySnapshot, toggleMessageSelection } = useControlPanelLogic();

  const selectedCount = manualContext.selectedMessageIds.length;
  const isActive = manualContext.hasAdditionalContext && selectedCount > 0;

  return (
    <Box sx={{ px: 2 }}>
      {/* Aviso do Modo */}
      <Alert 
        severity={isActive ? 'warning' : 'info'} 
        icon={isActive ? <WarningIcon /> : undefined}
        sx={{ mb: 2 }}
      >
        {isActive 
          ? `Modo Manual ativo! A IA usará APENAS ${selectedCount} mensagem(ns) selecionada(s).`
          : 'Ative o modo manual para controlar exatamente quais mensagens a IA verá.'}
      </Alert>

      {/* Switch Principal */}
      <PanelSection active={manualContext.hasAdditionalContext}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={manualContext.hasAdditionalContext}
                onChange={(e) => setManualContext({ ...manualContext, hasAdditionalContext: e.target.checked })}
                color="warning"
              />
            }
            label={
              <Typography fontWeight="bold" color={manualContext.hasAdditionalContext ? 'warning.main' : 'secondary.main'}>
                Modo de Injeção Manual
              </Typography>
            }
          />
          <HelpTooltip 
            title="Modo de Injeção Manual"
            description="Desativa o pipeline automático (RAG, Recentes, Pinned) e permite que você escolha EXATAMENTE quais mensagens a IA verá. Útil para debugging ou conversas específicas."
            examples={['Testar resposta com contexto específico', 'Ignorar mensagens irrelevantes', 'Simular conversação anterior']}
          />
        </Box>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Sobrescreve o pipeline automático (RAG + Recentes + Pinned).
        </Typography>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* Lista de Seleção */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Selecione as Mensagens
          </Typography>
          <HelpTooltip 
            title="Seleção de Mensagens"
            description="Clique nas mensagens que deseja incluir no contexto. Apenas as mensagens marcadas serão enviadas para a IA quando o modo manual estiver ativo."
            examples={['Selecione perguntas anteriores relevantes', 'Inclua respostas importantes da IA', 'Marque instruções que deu antes']}
          />
        </Box>
        <Tooltip title={selectedCount > 0 ? `${selectedCount} mensagens serão enviadas para a IA` : 'Nenhuma mensagem selecionada'}>
          <CounterBadge
            count={selectedCount}
            label="selecionadas"
            color={selectedCount > 0 ? 'secondary' : 'default'}
          />
        </Tooltip>
      </Box>

      {/* Toolbar de Ações em Lote */}
      {chatHistorySnapshot.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const allIds = chatHistorySnapshot.map(msg => msg.id);
              setManualContext({
                ...manualContext,
                selectedMessageIds: allIds
              });
            }}
            disabled={selectedCount === chatHistorySnapshot.length}
          >
            Selecionar Todas ({chatHistorySnapshot.length})
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => {
              setManualContext({
                ...manualContext,
                selectedMessageIds: []
              });
            }}
            disabled={selectedCount === 0}
          >
            Limpar Seleção
          </Button>
        </Box>
      )}
      
      <PanelSection sx={{ maxHeight: 350, overflow: 'auto', p: 0, ...scrollbarStyles }}>
        <List dense>
          {chatHistorySnapshot.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Nenhuma mensagem no chat atual.
              </Typography>
            </Box>
          ) : (
            chatHistorySnapshot.map((msg) => {
              const isSelected = manualContext.selectedMessageIds.includes(msg.id);
              return (
                <ListItemButton
                  key={msg.id}
                  onClick={() => toggleMessageSelection(msg.id)}
                  selected={isSelected}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    borderLeft: isSelected ? '3px solid' : 'none',
                    borderLeftColor: 'warning.main',
                    '&.Mui-selected': {
                      bgcolor: 'backgrounds.warningSubtle',
                      '&:hover': { bgcolor: 'backgrounds.warningHover' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                      color="warning"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusBadge
                          label={msg.role === 'user' ? '👤' : '🤖'}
                          status="default"
                        />
                        <Typography variant="body2" noWrap sx={{ fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                          {msg.content.substring(0, 50)}...
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                        {msg.isPinned && ' 📌'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })
          )}
        </List>
      </PanelSection>

      {/* Dica */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        💡 Use a aba <strong>Contexto</strong> para configurar o System Prompt.
      </Typography>
    </Box>
  );
};
