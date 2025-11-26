import { 
  Box, Typography, FormControlLabel, Switch, Divider, 
  List, ListItemButton, ListItemIcon, Checkbox, ListItemText, 
  TextField, alpha, useTheme 
} from '@mui/material';
import { Psychology as BrainIcon } from '@mui/icons-material';
import { PanelSection } from './PanelSection';
import { useControlPanelLogic } from './useControlPanelLogic';

export const ManualContextTab = () => {
  const theme = useTheme();
  const { manualContext, setManualContext, chatHistorySnapshot, toggleMessageSelection } = useControlPanelLogic();

  return (
    <Box>
      {/* Switch Principal */}
      <PanelSection active={manualContext.hasAdditionalContext}>
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
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {manualContext.hasAdditionalContext 
            ? 'A IA lerá APENAS o que você selecionar abaixo.'
            : 'A IA usará o modo automático (RAG).'}
        </Typography>
      </PanelSection>

      <Divider sx={{ mb: 2 }} />

      {/* Lista de Seleção */}
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
        <span>Histórico Recente</span>
        <Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', px: 1, borderRadius: 1 }}>
          {manualContext.selectedMessageIds.length} selecionadas
        </Typography>
      </Typography>
      
      <PanelSection sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
        <List dense>
          {chatHistorySnapshot.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Nenhuma mensagem carregada no buffer.
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
                      <Typography variant="body2" noWrap sx={{ fontWeight: isSelected ? 600 : 400 }}>
                        {msg.role === 'user' ? '👤 Você' : '🤖 IA'}: {msg.content.substring(0, 40)}...
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })
          )}
        </List>
      </PanelSection>

      {/* Input de System Prompt */}
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <BrainIcon fontSize="small" color="info" /> Instruções Extras (System Prompt)
      </Typography>
      
      <TextField
        multiline
        rows={5}
        placeholder="Ex: 'Responda sempre em formato de lista' ou cole um texto base aqui..."
        value={manualContext.additionalText}
        onChange={(e) => setManualContext({ ...manualContext, additionalText: e.target.value })}
        variant="outlined"
        fullWidth
        sx={{
          bgcolor: 'background.paper',
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'primary.main' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' }
          }
        }}
      />
    </Box>
  );
};
