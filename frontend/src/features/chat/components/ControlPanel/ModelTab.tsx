// frontend/src/features/chat/components/ControlPanel/ModelTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useEffect, useState, useMemo } from 'react';
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
  Button,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TuneIcon from '@mui/icons-material/Tune';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { aiProvidersService } from '../../../../services/aiProvidersService';
import { certificationService } from '../../../../services/certificationService';
import { AIProvider } from '../../../../types/ai';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useModelCapabilities } from '../../../../hooks/useModelCapabilities';
import { useCertificationDetails } from '../../../../hooks/useCertificationDetails';
import { HelpTooltip } from './HelpTooltip';
import { CapabilityBadge } from './CapabilityBadge';
import { CertificationBadge } from './CertificationBadge';
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
  
  // Estado para certificação
  const [certifiedModels, setCertifiedModels] = useState<string[]>([]);
  const [showOnlyCertified, setShowOnlyCertified] = useState(false);

  // O Estado da SELEÇÃO vem do Contexto Global
  const { chatConfig, updateChatConfig } = useLayout();

  // Hook de capabilities do modelo selecionado
  const { capabilities, isLoading: capabilitiesLoading, error: capabilitiesError } = useModelCapabilities(
    chatConfig.provider,
    chatConfig.model
  );

  // Hook de detalhes de certificação do modelo selecionado
  const fullModelId = chatConfig.provider && chatConfig.model
    ? `${chatConfig.provider}:${chatConfig.model}`
    : null;
  const { certificationDetails } = useCertificationDetails(fullModelId);

  // 1. Buscar dados ao carregar
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await aiProvidersService.getConfigured(); // Apenas providers configurados
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

    // 2. Listener para recarregar quando credenciais AWS forem atualizadas
    const handleAWSUpdate = () => {
      console.log('🔄 Credenciais AWS atualizadas, recarregando providers...');
      loadData();
    };

    window.addEventListener('aws-credentials-updated', handleAWSUpdate);

    return () => {
      window.removeEventListener('aws-credentials-updated', handleAWSUpdate);
    };
  }, [chatConfig.provider, updateChatConfig]);

  // Buscar modelos certificados
  useEffect(() => {
    async function loadCertifications() {
      try {
        const certified = await certificationService.getCertifiedModels();
        setCertifiedModels(certified);
      } catch (error) {
        console.error('Erro ao carregar certificações:', error);
      }
    }
    loadCertifications();
  }, []);

  // 2. Handlers
  const handleProviderChange = (event: SelectChangeEvent) => {
    const newSlug = event.target.value;
    const providerData = providers.find(p => p.slug === newSlug);
    const defaultModel = providerData?.models[0]?.apiModelId || '';

    console.log('🔄 [ModelTab] Provider changed:', {
      from: chatConfig.provider,
      to: newSlug,
      defaultModel,
      availableModels: providerData?.models.length || 0
    });

    updateChatConfig({
      provider: newSlug,
      model: defaultModel
    });
  };

  const handleModelChange = (event: SelectChangeEvent) => {
    const selectedModel = activeProvider?.models.find(m => m.apiModelId === event.target.value);
    
    console.log('🤖 [ModelTab] Model changed:', {
      from: chatConfig.model,
      to: event.target.value,
      modelName: selectedModel?.name,
      contextWindow: selectedModel?.contextWindow,
      isCertified: certifiedModels.includes(event.target.value)
    });

    updateChatConfig({ model: event.target.value });
  };

  const handleParamChange = (key: keyof typeof chatConfig, value: number | string) => {
    console.log('⚙️ [ModelTab] Parameter changed:', {
      parameter: key,
      from: chatConfig[key],
      to: value,
      provider: chatConfig.provider,
      model: chatConfig.model
    });

    updateChatConfig({ [key]: value });
  };

  // Computados para UI
  const activeProvider = providers.find(p => p.slug === chatConfig.provider);

  // Filtrar modelos por certificação
  const filteredModels = useMemo(() => {
    if (!activeProvider) return [];
    if (!showOnlyCertified) return activeProvider.models;
    return activeProvider.models.filter(m =>
      certifiedModels.includes(m.apiModelId)
    );
  }, [activeProvider, certifiedModels, showOnlyCertified]);

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
      {/* Loading state para capabilities */}
      {capabilitiesLoading && (
        <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
          Carregando configurações do modelo...
        </Alert>
      )}

      {/* Error state para capabilities */}
      {capabilitiesError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Não foi possível carregar as capabilities do modelo. Usando valores padrão.
        </Alert>
      )}

      {/* === SEÇÃO: Seleção de IA === */}
      <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon fontSize="small" color="secondary" /> Inteligência Artificial
          <HelpTooltip
            title="Provedor de IA"
            description="Escolha qual serviço de IA processará suas mensagens. Cada provedor tem modelos diferentes com capacidades e custos variados."
            examples={['Groq: Rápido e gratuito (limite de tokens)', 'OpenAI: GPT-4, mais capaz, pago']}
          />
        </Typography>

        {/* Filtros de Certificação */}
        {activeProvider?.slug === 'aws' && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant={!showOnlyCertified ? 'contained' : 'outlined'}
              onClick={() => setShowOnlyCertified(false)}
            >
              Todos
            </Button>
            <Button
              size="small"
              variant={showOnlyCertified ? 'contained' : 'outlined'}
              onClick={() => setShowOnlyCertified(true)}
              startIcon={<CheckCircleIcon />}
            >
              Certificados
            </Button>
          </Box>
        )}

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
            {filteredModels.map((model) => (
              <MenuItem key={model.id} value={model.apiModelId}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography>{model.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {certifiedModels.includes(model.apiModelId) && (
                      <Chip
                        label="Certificado"
                        size="small"
                        color="success"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                    {activeProvider?.slug === 'aws' && (
                      <Chip
                        label="AWS Bedrock"
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                    <Chip
                      label={`${Math.round(model.contextWindow / 1024)}k tokens`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Seção de Capabilities do Modelo */}
        {capabilities && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
              Capabilities do Modelo:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              <CapabilityBadge label="Streaming" enabled={capabilities.streaming.enabled} />
              <CapabilityBadge
                label="Vision"
                enabled={capabilities.vision.enabled}
                icon="vision"
                tooltip={capabilities.vision.enabled ? 'Modelo suporta análise de imagens' : 'Modelo não suporta imagens'}
              />
              <CapabilityBadge
                label="Function Calling"
                enabled={capabilities.functionCalling.enabled}
                icon="function"
                tooltip={capabilities.functionCalling.enabled ? 'Modelo suporta chamadas de função' : 'Modelo não suporta function calling'}
              />
              <CapabilityBadge
                label={`Context: ${(capabilities.maxContextWindow / 1000).toFixed(0)}K`}
                enabled={true}
                tooltip={`Janela de contexto: ${capabilities.maxContextWindow.toLocaleString()} tokens`}
              />
            </Box>
          </Box>
        )}

        {/* Badge de Certificação do Modelo */}
        {certificationDetails && (
          <Box sx={{ mt: 2 }}>
            <CertificationBadge
              status={certificationDetails.status || 'not_tested'}
              lastChecked={certificationDetails.lastChecked}
              successRate={certificationDetails.successRate}
              errorCategory={certificationDetails.errorCategory}
              onClick={() => {
                // TODO: Abrir modal de detalhes de certificação
                console.log('Abrir modal de certificação para:', fullModelId);
              }}
            />
          </Box>
        )}
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
              <ThermostatIcon fontSize="small" /> Temperatura
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
            min={capabilities?.temperature.min ?? 0}
            max={capabilities?.temperature.max ?? 2}
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
            disabled={!capabilities?.topK.enabled || capabilitiesLoading}
            value={chatConfig.topK ?? capabilities?.topK.default ?? 40}
            min={capabilities?.topK.min ?? 1}
            max={capabilities?.topK.max ?? 100}
            step={1}
            onChange={(_, val) => handleParamChange('topK', val as number)}
          />
          <Typography variant="caption" color="text.secondary">
            Limita o vocabulário às K palavras mais prováveis. Reduz alucinações.
          </Typography>
        </Box>

        {/* Alert inline para Top-K desabilitado */}
        {capabilities && !capabilities.topK.enabled && capabilities.topP.enabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Este modelo não suporta Top-K. Use <strong>Top-P</strong> abaixo para controlar diversidade.
          </Alert>
        )}

        {/* Top-P (Nucleus Sampling) */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
              Top-P (Nucleus Sampling)
              <HelpTooltip
                title="Top-P (Nucleus Sampling)"
                description="Controla diversidade considerando probabilidade cumulativa. Alternativa ao Top-K. Valores baixos tornam a resposta mais focada, valores altos permitem mais criatividade."
                examples={['0.1: Muito focado', '0.9: Equilíbrio (recomendado)', '1.0: Máxima diversidade']}
              />
            </Typography>
            <Chip
              label={chatConfig.topP ?? capabilities?.topP.default ?? 0.9}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ minWidth: 40, fontWeight: 'bold' }}
            />
          </Box>
          <Slider
            disabled={!capabilities?.topP.enabled || capabilitiesLoading}
            value={chatConfig.topP ?? capabilities?.topP.default ?? 0.9}
            min={capabilities?.topP.min ?? 0}
            max={capabilities?.topP.max ?? 1}
            step={0.01}
            onChange={(_, val) => handleParamChange('topP', val as number)}
            marks={[
              { value: 0, label: '0' },
              { value: 0.5, label: '0.5' },
              { value: 1, label: '1' }
            ]}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary">
            Considera tokens cuja probabilidade cumulativa atinge P. Alternativa ao Top-K.
          </Typography>
        </Box>

        {/* Max Tokens (Limite de Saída) */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
              Max Tokens (Limite de Saída)
              <HelpTooltip
                title="Max Tokens (Limite de Saída)"
                description="Limite máximo de tokens na resposta. Valores maiores permitem respostas mais longas mas custam mais. 1 token ≈ 4 caracteres."
                examples={['512: Respostas curtas', '2048: Equilíbrio (recomendado)', '4096: Respostas longas']}
              />
            </Typography>
            <Chip
              label={chatConfig.maxTokens ?? capabilities?.maxTokens.default ?? 2048}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ minWidth: 40, fontWeight: 'bold' }}
            />
          </Box>
          <Slider
            disabled={!capabilities?.maxTokens.enabled || capabilitiesLoading}
            value={chatConfig.maxTokens ?? capabilities?.maxTokens.default ?? 2048}
            min={capabilities?.maxTokens.min ?? 100}
            max={capabilities?.maxTokens.max ?? 4096}
            step={100}
            onChange={(_, val) => handleParamChange('maxTokens', val as number)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}`}
          />
          <Typography variant="caption" color="text.secondary">
            Limite máximo de tokens que o modelo pode gerar na resposta.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
