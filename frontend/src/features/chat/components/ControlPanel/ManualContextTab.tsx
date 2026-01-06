// frontend/src/features/chat/components/ControlPanel/ManualContextTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { 
  Box, Typography, FormControlLabel, Switch, Divider, 
  List, ListItemButton, ListItemIcon, Checkbox, ListItemText, 
  alpha, useTheme, Alert, Chip
} from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { PanelSection } from './PanelSection';
import { HelpTooltip } from './HelpTooltip';
import { useControlPanelLogic } from './useControlPanelLogic';
import { scrollbarStyles } from '../../../../theme/scrollbarStyles';

export const ManualContextTab = () => {
  const theme = useTheme();
  const { manualContext, setManualContext, chatHistorySnapshot, toggleMessageSelection } = useControlPanelLogic();

  const selectedCount = manualContext.selectedMessageIds.length;
  const isActive = manualContext.hasAdditionalContext && selectedCount > 0;

  return (
    <Box>
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
              <Typography fontWeight="bold" color={manualContext.hasAdditionalContext ? 'warning.main' : 'text.primary'}>
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
        <Chip 
          icon={selectedCount > 0 ? <CheckIcon /> : undefined}
          label={`${selectedCount} selecionadas`} 
          size="small"
          color={selectedCount > 0 ? 'warning' : 'default'}
          variant="outlined"
        />
      </Box>
      
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
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.warning.main, 0.15),
                      '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.25) }
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
                        <Chip 
                          label={msg.role === 'user' ? '👤' : '🤖'} 
                          size="small" 
                          sx={{ height: 20, fontSize: '0.7rem' }}
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
