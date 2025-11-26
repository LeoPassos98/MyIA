import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Slider, Divider } from '@mui/material';
import { Dns as ProviderIcon } from '@mui/icons-material';
import { PanelSection } from './PanelSection';
import { useControlPanelLogic } from './useControlPanelLogic';

export const ParametersTab = () => {
  const { chatConfig, updateChatConfig, providerOptions, modelOptions } = useControlPanelLogic();

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
        MODELO & PROVEDOR
      </Typography>

      <PanelSection>
        {/* Provider Selection */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Provedor de IA</InputLabel>
          <Select
            value={chatConfig.provider}
            label="Provedor de IA"
            onChange={(e) => updateChatConfig({ provider: e.target.value })}
          >
            {providerOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProviderIcon fontSize="small" color="action" />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Model Selection */}
        <FormControl fullWidth size="small">
          <InputLabel>Modelo</InputLabel>
          <Select
            value={chatConfig.model}
            label="Modelo"
            onChange={(e) => updateChatConfig({ model: e.target.value })}
          >
            {(modelOptions[chatConfig.provider] || []).map((model) => (
              <MenuItem key={model} value={model}>
                {model}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </PanelSection>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
        COMPORTAMENTO
      </Typography>

      {/* Strategy */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Estratégia de Memória</InputLabel>
          <Select
            value={chatConfig.strategy}
            label="Estratégia de Memória"
            onChange={(e) => updateChatConfig({ strategy: e.target.value as any })}
          >
            <MenuItem value="fast">⚡ Rápido (Últimas msgs)</MenuItem>
            <MenuItem value="efficient">🧠 Inteligente (RAG Híbrido)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Temperature */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Criatividade (Temperatura)</Typography>
          <Typography variant="body2" fontWeight="bold" color="primary">{chatConfig.temperature}</Typography>
        </Box>
        <Slider
          value={chatConfig.temperature}
          min={0}
          max={1}
          step={0.1}
          onChange={(_, val) => updateChatConfig({ temperature: val as number })}
          valueLabelDisplay="auto"
          sx={{ color: 'primary.main' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">Preciso</Typography>
          <Typography variant="caption" color="text.secondary">Aleatório</Typography>
        </Box>
      </Box>

      {/* TopK (RAG) */}
      <Box sx={{ mb: 2, opacity: chatConfig.strategy === 'efficient' ? 1 : 0.5, pointerEvents: chatConfig.strategy === 'efficient' ? 'auto' : 'none' }}>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Profundidade RAG (TopK)</Typography>
          <Typography variant="body2" fontWeight="bold" color="secondary">{chatConfig.topK}</Typography>
        </Box>
        <Slider
          value={chatConfig.topK}
          min={1}
          max={10}
          step={1}
          onChange={(_, val) => updateChatConfig({ topK: val as number })}
          valueLabelDisplay="auto"
          color="secondary"
        />
      </Box>
    </Box>
  );
};
