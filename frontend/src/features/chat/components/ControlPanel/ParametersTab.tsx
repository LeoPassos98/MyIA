import { 
  Box, 
  Typography, 
  Slider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem
} from '@mui/material';
import { useLayout } from '../../../../contexts/LayoutContext';

export function ParametersTab() {
  const { chatConfig, updateChatConfig } = useLayout();

  // Handlers simples para atualizar o contexto global
  const handleChange = (key: keyof typeof chatConfig, value: number | string) => {
    updateChatConfig({ [key]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* 1. Temperatura */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Temperatura (Criatividade)
          </Typography>
          <Typography variant="caption" color="primary.main">
            {chatConfig.temperature}
          </Typography>
        </Box>
        <Slider
          value={chatConfig.temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={(_, val) => handleChange('temperature', val as number)}
          valueLabelDisplay="auto"
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          Valores baixos (0.2) são focados e determinísticos. Altos (0.8+) são criativos e variados.
        </Typography>
      </Box>

      {/* 2. Top K */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Top-K (Amostragem)
          </Typography>
          <Typography variant="caption" color="primary.main">
            {chatConfig.topK}
          </Typography>
        </Box>
        <Slider
          value={chatConfig.topK}
          min={0}
          max={100}
          step={1}
          onChange={(_, val) => handleChange('topK', val as number)}
        />
        <Typography variant="caption" color="text.secondary">
          Limita o vocabulário da IA às K palavras mais prováveis. Reduz alucinações.
        </Typography>
      </Box>

      {/* 3. Janela de Memória (Memória Curta) */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Memória Recente (Mensagens)
          </Typography>
          <Typography variant="caption" color="primary.main">
            {chatConfig.memoryWindow}
          </Typography>
        </Box>
        <Slider
          value={chatConfig.memoryWindow}
          min={2}
          max={50}
          step={2}
          onChange={(_, val) => handleChange('memoryWindow', val as number)}
        />
        <Typography variant="caption" color="text.secondary">
          Quantas mensagens anteriores são enviadas para manter o contexto imediato.
        </Typography>
      </Box>

      {/* 4. Estratégia de Contexto (Opcional - se você usa RAG) */}
      <FormControl fullWidth size="small">
        <InputLabel>Estratégia de Contexto</InputLabel>
        <Select
          value={chatConfig.strategy || 'efficient'}
          label="Estratégia de Contexto"
          onChange={(e) => handleChange('strategy', e.target.value)}
        >
          <MenuItem value="efficient">Híbrido (RAG + Recente)</MenuItem>
          <MenuItem value="fast">Rápido (Apenas Recente)</MenuItem>
        </Select>
      </FormControl>

    </Box>
  );
}
