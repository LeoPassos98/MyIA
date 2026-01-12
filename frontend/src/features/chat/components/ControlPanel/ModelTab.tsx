// frontend/src/features/chat/components/ControlPanel/ModelTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  SelectChangeEvent,
  Chip,
  Alert,
  Slider,
  Divider,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Thermostat as TempIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { aiProvidersService } from '../../../../services/aiProvidersService';
import { AIProvider } from '../../../../types/ai';
import { useLayout } from '../../../../contexts/LayoutContext';
import { HelpTooltip } from './HelpTooltip';
import GroqLogo from '../../../../assets/providers/groq.svg';
import OpenAILogo from '../../../../assets/providers/openai.svg';
import DefaultLogo from '../../../../assets/providers/default.svg';

const providerIcons: Record<string, string> = {
  groq: GroqLogo,
  openai: OpenAILogo,
  default: DefaultLogo,
};

export function ModelTab() {

  // Estado apenas para a LISTA de opções (o dado que vem do backend)
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O Estado da SELEÇÃO vem do Contexto Global
  const { chatConfig, updateChatConfig } = useLayout();

  // 1. Buscar dados ao carregar
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await aiProvidersService.getAll();
        setProviders(data);

        // Lógica de Auto-seleção Inteligente
        const currentProviderValid = data.find(p => p.slug === chatConfig.provider);

        if (!chatConfig.provider || !currentProviderValid) {
          if (data.length > 0) {
            const firstProvider = data[0];
            const firstModel = firstProvider.models[0]?.apiModelId || '';

            updateChatConfig({
              provider: firstProvider.slug,
              model: firstModel
            });
          }
        }
      } catch (err) {
        setError('Não foi possível carregar a lista de IAs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Handlers
  const handleProviderChange = (event: SelectChangeEvent) => {
    const newSlug = event.target.value;
    const providerData = providers.find(p => p.slug === newSlug);
    const defaultModel = providerData?.models[0]?.apiModelId || '';

    updateChatConfig({
      provider: newSlug,
      model: defaultModel
    });
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    updateChatConfig({ model: event.target.value });
  };

  const handleParamChange = (key: keyof typeof chatConfig, value: number | string) => {
    updateChatConfig({ [key]: value });
  };

  // Computados para UI
  const activeProvider = providers.find(p => p.slug === chatConfig.provider);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: 2 }}>

      {/* === SEÇÃO: Seleção de IA === */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BotIcon fontSize="small" color="secondary" /> Inteligência Artificial
          <HelpTooltip
            title="Provedor de IA"
            description="Escolha qual serviço de IA processará suas mensagens. Cada provedor tem modelos diferentes com capacidades e custos variados."
            examples={['Groq: Rápido e gratuito (limite de tokens)', 'OpenAI: GPT-4, mais capaz, pago']}
          />
        </Typography>

        {/* Seletor de Provedor */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="provider-select-label">Provedor</InputLabel>
          <Select
            labelId="provider-select-label"
            value={chatConfig.provider || ''}
            label="Provedor"
            onChange={handleProviderChange}
            startAdornment={
              <Box
                component="img"
                src={providerIcons[chatConfig.provider] || providerIcons.default}
                alt={chatConfig.provider}
                sx={{ width: 24, height: 24, mr: 1, borderRadius: '50%' }}
              />
            }
          >
            {providers.map((provider) => (
              <MenuItem key={provider.id} value={provider.slug}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Seletor de Modelo */}
        <FormControl fullWidth disabled={!chatConfig.provider}>
          <InputLabel id="model-select-label">Modelo</InputLabel>
          <Select
            labelId="model-select-label"
            value={chatConfig.model || ''}
            label="Modelo"
            onChange={handleModelChange}
          >
            {activeProvider?.models.map((model) => (
              <MenuItem key={model.id} value={model.apiModelId}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography>{model.name}</Typography>
                  <Chip
                    label={`${Math.round(model.contextWindow / 1024)}k tokens`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem', ml: 1 }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider />

      {/* === SEÇÃO: Parâmetros da IA === */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TuneIcon fontSize="small" color="secondary" /> Parâmetros de Geração
        </Typography>

        {/* Temperatura */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TempIcon fontSize="small" /> Temperatura
              <HelpTooltip
                title="Temperatura (Criatividade)"
                description="Controla a aleatoriedade das respostas. Valores baixos geram respostas mais previsíveis e focadas. Valores altos geram respostas mais criativas e variadas."
                examples={['0.2: Respostas técnicas, código', '0.7: Conversação natural', '1.2: Escrita criativa, brainstorm']}
              />
            </Typography>
            <Chip
              label={chatConfig.temperature}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ minWidth: 40, fontWeight: 'bold' }}
            />
          </Box>
          <Slider
            value={chatConfig.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(_, val) => handleParamChange('temperature', val as number)}
            valueLabelDisplay="auto"
            sx={{ mb: 0.5 }}
          />
          <Typography variant="caption" color="text.secondary">
            Baixo (0.2) = Focado e preciso. Alto (1.0+) = Criativo e variado.
          </Typography>
        </Box>

        {/* Top-K */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
              Top-K (Vocabulário)
              <HelpTooltip
                title="Top-K (Limitação de Vocabulário)"
                description="Limita quantas palavras a IA considera ao gerar cada token. Valores baixos tornam a resposta mais focada e previsível. Valores altos permitem mais variedade."
                examples={['10: Muito focado, menos criativo', '40: Equilíbrio (recomendado)', '100: Máxima variedade']}
              />
            </Typography>
            <Chip
              label={chatConfig.topK}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ minWidth: 40, fontWeight: 'bold' }}
            />
          </Box>
          <Slider
            value={chatConfig.topK}
            min={1}
            max={100}
            step={1}
            onChange={(_, val) => handleParamChange('topK', val as number)}
          />
          <Typography variant="caption" color="text.secondary">
            Limita o vocabulário às K palavras mais prováveis. Reduz alucinações.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
