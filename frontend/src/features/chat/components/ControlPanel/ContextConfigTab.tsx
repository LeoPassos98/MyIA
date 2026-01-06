// frontend/src/features/chat/components/ControlPanel/ContextConfigTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import {
  Box, Typography, Switch, FormControlLabel, Slider, TextField,
  Divider, Chip, alpha, useTheme, Tooltip, IconButton
} from '@mui/material';
import {
  Psychology as BrainIcon,
  PushPin as PinIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Token as TokenIcon,
  Info as InfoIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { PanelSection } from './PanelSection';
import { useLayout } from '../../../../contexts/LayoutContext';

const DEFAULT_CONFIG = {
  systemPrompt: 'Você é uma IA útil e direta.',
  useCustomSystemPrompt: false,
  pinnedEnabled: true,
  recentEnabled: true,
  recentCount: 10,
  ragEnabled: true,
  ragTopK: 5,
  maxContextTokens: 6000,
};

export const ContextConfigTab = () => {
  const theme = useTheme();
  const { contextConfig, updateContextConfig, chatHistorySnapshot } = useLayout();

  // Estatísticas
  const pinnedCount = chatHistorySnapshot.filter(msg => msg.isPinned).length;
  const totalMessages = chatHistorySnapshot.length;

  const handleReset = () => {
    updateContextConfig(DEFAULT_CONFIG);
  };

  return (
    <Box>
      {/* Header com Reset */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BrainIcon color="primary" /> Pipeline de Contexto
        </Typography>
        <Tooltip title="Restaurar padrões">
          <IconButton size="small" onClick={handleReset}>
            <ResetIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Configure como o contexto é construído e enviado para a IA.
        A ordem de prioridade é: System → Pinned → Recentes → RAG
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* 1. System Prompt */}
      <PanelSection active={contextConfig.useCustomSystemPrompt}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrainIcon fontSize="small" color="info" /> System Prompt
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={contextConfig.useCustomSystemPrompt}
                onChange={(e) => updateContextConfig({ useCustomSystemPrompt: e.target.checked })}
                size="small"
                color="info"
              />
            }
            label={<Typography variant="caption">Personalizado</Typography>}
            labelPlacement="start"
          />
        </Box>
        <TextField
          multiline
          rows={3}
          placeholder="Instruções para a IA..."
          value={contextConfig.systemPrompt}
          onChange={(e) => updateContextConfig({ systemPrompt: e.target.value })}
          disabled={!contextConfig.useCustomSystemPrompt}
          variant="outlined"
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }
          }}
        />
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 2. Mensagens Pinadas */}
      <PanelSection active={contextConfig.pinnedEnabled}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PinIcon fontSize="small" color="warning" />
            <Typography variant="subtitle2" fontWeight="bold">Mensagens Fixadas</Typography>
            <Chip 
              label={`${pinnedCount} pinned`} 
              size="small" 
              color={pinnedCount > 0 ? 'warning' : 'default'}
              variant="outlined"
            />
          </Box>
          <Switch
            checked={contextConfig.pinnedEnabled}
            onChange={(e) => updateContextConfig({ pinnedEnabled: e.target.checked })}
            size="small"
            color="warning"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Sempre incluídas no contexto com prioridade máxima.
        </Typography>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 3. Mensagens Recentes */}
      <PanelSection active={contextConfig.recentEnabled}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon fontSize="small" color="success" />
            <Typography variant="subtitle2" fontWeight="bold">Memória Recente</Typography>
            <Chip 
              label={`${Math.min(contextConfig.recentCount, totalMessages)}/${totalMessages}`} 
              size="small" 
              color="success"
              variant="outlined"
            />
          </Box>
          <Switch
            checked={contextConfig.recentEnabled}
            onChange={(e) => updateContextConfig({ recentEnabled: e.target.checked })}
            size="small"
            color="success"
          />
        </Box>
        
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Últimas mensagens: {contextConfig.recentCount}
          </Typography>
          <Slider
            value={contextConfig.recentCount}
            onChange={(_, value) => updateContextConfig({ recentCount: value as number })}
            disabled={!contextConfig.recentEnabled}
            min={1}
            max={50}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
            valueLabelDisplay="auto"
            color="success"
            size="small"
          />
        </Box>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 4. RAG (Busca Semântica) */}
      <PanelSection active={contextConfig.ragEnabled}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon fontSize="small" color="secondary" />
            <Typography variant="subtitle2" fontWeight="bold">RAG (Busca Semântica)</Typography>
            <Tooltip title="Busca mensagens similares ao que você está perguntando">
              <InfoIcon fontSize="small" sx={{ opacity: 0.5, cursor: 'help' }} />
            </Tooltip>
          </Box>
          <Switch
            checked={contextConfig.ragEnabled}
            onChange={(e) => updateContextConfig({ ragEnabled: e.target.checked })}
            size="small"
            color="secondary"
          />
        </Box>
        
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Mensagens similares a buscar: {contextConfig.ragTopK}
          </Typography>
          <Slider
            value={contextConfig.ragTopK}
            onChange={(_, value) => updateContextConfig({ ragTopK: value as number })}
            disabled={!contextConfig.ragEnabled}
            min={1}
            max={20}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            valueLabelDisplay="auto"
            color="secondary"
            size="small"
          />
        </Box>
      </PanelSection>

      <Divider sx={{ my: 2 }} />

      {/* 5. Limite de Tokens */}
      <PanelSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TokenIcon fontSize="small" color="error" />
          <Typography variant="subtitle2" fontWeight="bold">Budget de Tokens</Typography>
          <Chip 
            label={`${contextConfig.maxContextTokens.toLocaleString()} max`} 
            size="small" 
            color="error"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Limite máximo de tokens para o contexto
          </Typography>
          <Slider
            value={contextConfig.maxContextTokens}
            onChange={(_, value) => updateContextConfig({ maxContextTokens: value as number })}
            min={1000}
            max={8000}
            step={500}
            marks={[
              { value: 1000, label: '1K' },
              { value: 2000, label: '2K' },
              { value: 4000, label: '4K' },
              { value: 6000, label: '6K' },
              { value: 8000, label: '8K' },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v / 1000).toFixed(1)}K`}
            color="error"
            size="small"
          />
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
            ⚠️ Groq (plano gratuito) tem limite de ~12K TPM. Mantenha ≤4K para evitar erros.
          </Typography>
        </Box>
      </PanelSection>

      {/* Preview do Pipeline */}
      <Box sx={{ 
        mt: 3, 
        p: 2, 
        bgcolor: alpha(theme.palette.primary.main, 0.05), 
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Typography variant="caption" fontWeight="bold" color="primary.main" gutterBottom>
          📋 Ordem do Pipeline Ativo:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          <Chip label="1. System" size="small" color="info" variant="filled" />
          {contextConfig.pinnedEnabled && (
            <Chip label={`2. Pinned (${pinnedCount})`} size="small" color="warning" variant="filled" />
          )}
          {contextConfig.recentEnabled && (
            <Chip label={`3. Recentes (${contextConfig.recentCount})`} size="small" color="success" variant="filled" />
          )}
          {contextConfig.ragEnabled && (
            <Chip label={`4. RAG (top ${contextConfig.ragTopK})`} size="small" color="secondary" variant="filled" />
          )}
        </Box>
      </Box>
    </Box>
  );
};
