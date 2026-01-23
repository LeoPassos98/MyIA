// frontend/src/features/chat/components/ControlPanel/ModelTab.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Slider,
  Chip,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TuneIcon from '@mui/icons-material/Tune';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { HelpTooltip } from './HelpTooltip';
import { VendorSelector } from './VendorSelector';
import { ModelCardList } from './ModelCard';
import { useModelTabLogic } from './useModelTabLogic';
import { useModelCapabilities } from '../../../../hooks/useModelCapabilities';
import { useLayout } from '../../../../contexts/LayoutContext';

/**
 * ModelTab - Aba de seleção de modelo refatorada (Vendor-First)
 * 
 * Arquitetura:
 * 1. Usuário seleciona vendor (Anthropic, Amazon, Cohere)
 * 2. Exibe modelos disponíveis do vendor
 * 3. Cada modelo mostra badges de providers onde está disponível
 * 4. Ao selecionar modelo com múltiplos providers, permite trocar provider
 * 5. Parâmetros de geração (temperatura, topK, etc.) compactos em 2 colunas
 * 
 * @example
 * ```tsx
 * <ModelTab />
 * ```
 */
export function ModelTab() {
  const { chatConfig, updateChatConfig } = useLayout();
  
  // Estado de accordion exclusivo
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  
  // Hook de lógica (vendor-first)
  const {
    vendors,
    selectedVendor,
    filteredModels,
    selectedModel,
    selectedProvider,
    isLoading,
    error,
    handleSelectVendor,
    handleSelectModel,
    handleChangeProvider
  } = useModelTabLogic();

  // Hook de capabilities do modelo selecionado
  const { capabilities, isLoading: capabilitiesLoading } = useModelCapabilities(
    chatConfig.provider,
    chatConfig.model
  );
  
  /**
   * Handler: Toggle de expansão do accordion
   * Se o modelo clicado já está expandido, colapsa. Senão, expande e colapsa os outros.
   */
  const handleToggleExpand = (modelId: string) => {
    setExpandedModelId(prev => prev === modelId ? null : modelId);
  };

  /**
   * Handler: Atualizar parâmetro de geração
   */
  const handleParamChange = (key: keyof typeof chatConfig, value: number | string | boolean) => {
    updateChatConfig({ [key]: value });
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state melhorado
  if (error) {
    return (
      <Box sx={{ p: 1.5 }}>
        <Alert
          severity="error"
          sx={{
            animation: 'shake 0.5s',
            '@keyframes shake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '25%': { transform: 'translateX(-8px)' },
              '75%': { transform: 'translateX(8px)' }
            }
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Erro ao carregar modelos
          </Typography>
          <Typography variant="caption">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1.5 }}>
      
      {/* === SEÇÃO 1: Header === */}
      <Box>
        <Typography 
          variant="subtitle2" 
          fontWeight="bold" 
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
        >
          <SmartToyIcon fontSize="small" color="secondary" /> 
          Inteligência Artificial
          <HelpTooltip
            title="Seleção de Modelo por Vendor"
            description="Escolha primeiro o vendor (empresa criadora do modelo) e depois o modelo específico. Cada modelo pode estar disponível em múltiplos providers (AWS, Azure, etc.)."
            examples={[
              'Anthropic: Claude 4 Sonnet, Claude 3.7',
              'Amazon: Titan Text, Nova',
              'Cohere: Command R+, Embed'
            ]}
          />
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
          Selecione o vendor e depois o modelo. Modelos podem estar disponíveis em múltiplos providers.
        </Typography>
      </Box>

      {/* === SEÇÃO 2: Vendor Selector === */}
      <VendorSelector
        vendors={vendors}
        selectedVendor={selectedVendor?.slug || null}
        onSelect={handleSelectVendor}
        isLoading={isLoading}
      />

      {/* === SEÇÃO 3: Model List === */}
      {selectedVendor && (
        <Box
          sx={{
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <ModelCardList
            models={filteredModels}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            selectedProvider={selectedProvider || undefined}
            onProviderChange={handleChangeProvider}
            expandedModelId={expandedModelId}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      )}

      {/* === SEÇÃO 4: Divider === */}
      <Divider sx={{ my: 0.5 }} />

      {/* === SEÇÃO 5: Parâmetros de Geração (2 Colunas) === */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TuneIcon fontSize="small" color="secondary" />
            Parâmetros de Geração
          </Typography>
          
          {/* ✅ Switch Auto/Manual */}
          <FormControlLabel
            control={
              <Switch
                checked={chatConfig.isAutoMode ?? true}
                onChange={(e) => handleParamChange('isAutoMode', e.target.checked)}
                color="secondary"
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight={600}>
                  {chatConfig.isAutoMode ? 'Auto' : 'Manual'}
                </Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.65rem' }}>
          {chatConfig.isAutoMode
            ? '🎯 Modo Auto: Parâmetros otimizados automaticamente para cada modelo'
            : '⚙️ Modo Manual: Controle total sobre os parâmetros de geração'}
        </Typography>

        <Grid container spacing={2}>
          {/* Temperatura */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  fontWeight={600} 
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}
                >
                  <ThermostatIcon sx={{ fontSize: 16 }} /> Temperatura
                  <HelpTooltip
                    title="Temperatura (Criatividade)"
                    description="Controla a aleatoriedade das respostas. Valores baixos geram respostas mais previsíveis e focadas. Valores altos geram respostas mais criativas e variadas."
                    examples={[
                      '0.2: Respostas técnicas, código',
                      '0.7: Conversação natural',
                      '1.2: Escrita criativa, brainstorm'
                    ]}
                  />
                </Typography>
                <Chip
                  label={chatConfig.temperature}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ minWidth: 36, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
              </Box>
              <Slider
                value={chatConfig.temperature}
                min={capabilities?.temperature.min ?? 0}
                max={capabilities?.temperature.max ?? 2}
                step={0.1}
                onChange={(_, val) => handleParamChange('temperature', val as number)}
                valueLabelDisplay="auto"
                disabled={capabilitiesLoading || (chatConfig.isAutoMode ?? true)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Baixo = Focado. Alto = Criativo.
              </Typography>
            </Box>
          </Grid>

          {/* Top-K */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                  Top-K
                  <HelpTooltip
                    title="Top-K (Limitação de Vocabulário)"
                    description="Limita quantas palavras a IA considera ao gerar cada token. Valores baixos tornam a resposta mais focada e previsível. Valores altos permitem mais variedade."
                    examples={[
                      '10: Muito focado, menos criativo',
                      '40: Equilíbrio (recomendado)',
                      '100: Máxima variedade'
                    ]}
                  />
                </Typography>
                <Chip
                  label={chatConfig.topK ?? capabilities?.topK.default ?? 40}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ minWidth: 36, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
              </Box>
              <Slider
                disabled={!capabilities?.topK.enabled || capabilitiesLoading || (chatConfig.isAutoMode ?? true)}
                value={chatConfig.topK ?? capabilities?.topK.default ?? 40}
                min={capabilities?.topK.min ?? 1}
                max={capabilities?.topK.max ?? 100}
                step={1}
                onChange={(_, val) => handleParamChange('topK', val as number)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Limita vocabulário às K palavras.
              </Typography>
            </Box>
          </Grid>

          {/* Top-P */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                  Top-P
                  <HelpTooltip
                    title="Top-P (Nucleus Sampling)"
                    description="Controla diversidade considerando probabilidade cumulativa. Alternativa ao Top-K. Valores baixos tornam a resposta mais focada, valores altos permitem mais criatividade."
                    examples={[
                      '0.1: Muito focado',
                      '0.9: Equilíbrio (recomendado)',
                      '1.0: Máxima diversidade'
                    ]}
                  />
                </Typography>
                <Chip
                  label={chatConfig.topP ?? capabilities?.topP.default ?? 0.9}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ minWidth: 36, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
              </Box>
              <Slider
                disabled={!capabilities?.topP.enabled || capabilitiesLoading || (chatConfig.isAutoMode ?? true)}
                value={chatConfig.topP ?? capabilities?.topP.default ?? 0.9}
                min={capabilities?.topP.min ?? 0}
                max={capabilities?.topP.max ?? 1}
                step={0.01}
                onChange={(_, val) => handleParamChange('topP', val as number)}
                valueLabelDisplay="auto"
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Probabilidade cumulativa. Alt. ao Top-K.
              </Typography>
            </Box>
          </Grid>

          {/* Max Tokens */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                  Max Tokens
                  <HelpTooltip
                    title="Max Tokens (Limite de Saída)"
                    description="Limite máximo de tokens na resposta. Valores maiores permitem respostas mais longas mas custam mais. 1 token ≈ 4 caracteres."
                    examples={[
                      '512: Respostas curtas',
                      '2048: Equilíbrio (recomendado)',
                      '4096: Respostas longas'
                    ]}
                  />
                </Typography>
                <Chip
                  label={chatConfig.maxTokens ?? capabilities?.maxTokens.default ?? 2048}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ minWidth: 36, height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                />
              </Box>
              <Slider
                disabled={!capabilities?.maxTokens.enabled || capabilitiesLoading || (chatConfig.isAutoMode ?? true)}
                value={chatConfig.maxTokens ?? capabilities?.maxTokens.default ?? 2048}
                min={capabilities?.maxTokens.min ?? 100}
                max={capabilities?.maxTokens.max ?? 4096}
                step={100}
                onChange={(_, val) => handleParamChange('maxTokens', val as number)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}`}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Limite máximo de tokens gerados.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
