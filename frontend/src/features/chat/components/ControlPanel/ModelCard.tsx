// frontend/src/features/chat/components/ControlPanel/ModelCard.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ModelCard Component
 *
 * Card de modelo com radio button, badges de providers e informações completas.
 * Expande para mostrar dropdown de provider quando selecionado e há múltiplos providers.
 *
 * @module features/chat/components/ControlPanel/ModelCard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Radio,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ImageIcon from '@mui/icons-material/Image';
import CachedIcon from '@mui/icons-material/Cached';
import FunctionsIcon from '@mui/icons-material/Functions';
import { formatTokens } from '../../../../utils/formatters';
import { ProviderBadgeGroup } from './ProviderBadge';
import { ModelRatingStars, ModelBadge, ModelMetricsTooltip } from '../../../../components/ModelRating';
import { useModelRating } from '../../../../hooks/useModelRating';
import type { ModelWithProviders } from '../../../../types/ai';

/**
 * Props do componente ModelCard
 */
export interface ModelCardProps {
  /** Modelo a ser exibido */
  model: ModelWithProviders;
  /** Se o modelo está selecionado */
  isSelected: boolean;
  /** Callback ao selecionar/desselecionar */
  onSelect: () => void;
  /** Provider ativo se modelo selecionado */
  selectedProvider?: string;
  /** Callback ao trocar provider */
  onProviderChange?: (providerSlug: string) => void;
  /** Se o card está desabilitado */
  disabled?: boolean;
  /** Se o card está expandido (accordion controlado) */
  isExpanded?: boolean;
  /** Callback ao alternar expansão */
  onToggleExpand?: () => void;
}

/**
 * Extrai nome resumido do modelo para exibição colapsada
 *
 * @example
 * "anthropic.claude-sonnet-4-5-20250929-v1:0" → "CLAUDE SONNET 4.5"
 * "amazon.titan-text-express-v1" → "TITAN TEXT EXPRESS"
 */
const getShortName = (fullName: string): string => {
  // Remove prefixo do vendor (ex: "anthropic.", "amazon.")
  const withoutVendor = fullName.includes('.')
    ? fullName.split('.')[1]
    : fullName;
  
  // Remove sufixos de versão detalhada (ex: "-20250929-v1:0")
  const withoutDetailedVersion = withoutVendor
    .replace(/-\d{8}-v\d+:\d+$/, '') // Remove "-20250929-v1:0"
    .replace(/-v\d+:\d+$/, '')        // Remove "-v1:0"
    .replace(/-v\d+$/, '');           // Remove "-v1"
  
  // Converte para uppercase e substitui hífens por espaços
  const formatted = withoutDetailedVersion
    .replace(/-/g, ' ')
    .toUpperCase();
  
  // Limita a 4 palavras principais para manter compacto
  const words = formatted.split(' ');
  return words.slice(0, 4).join(' ');
};

/**
 * Card de modelo com radio button, badges de providers e informações completas
 *
 * Exibe um card compacto para cada modelo com radio button, badges de providers,
 * certificação, context window, capabilities e pricing.
 *
 * Suporta modo accordion: colapsado por padrão, expandido ao clicar.
 * Modelo selecionado fica sempre expandido.
 *
 * @example
 * ```tsx
 * <ModelCard
 *   model={model}
 *   isSelected={selectedModel?.id === model.id}
 *   onSelect={() => handleSelectModel(model.id)}
 *   selectedProvider="aws"
 *   onProviderChange={(provider) => handleProviderChange(provider)}
 * />
 * ```
 */
export const ModelCard = React.memo(function ModelCard({
  model,
  isSelected,
  onSelect,
  selectedProvider,
  onProviderChange,
  disabled = false,
  isExpanded: controlledIsExpanded,
  onToggleExpand
}: ModelCardProps) {
  
  // Estado de expansão do accordion (interno ou controlado)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  
  // Hook para buscar rating do modelo
  const { getModelById } = useModelRating();
  const modelWithRating = getModelById(model.apiModelId);
  
  const hasMultipleProviders = model.availableOn.length > 1;
  const showProviderSelector = isSelected && hasMultipleProviders && !!onProviderChange;
  const hasConfiguredProvider = model.availableOn.some(p => p.isConfigured);
  
  // Forçar expansão quando modelo está selecionado
  useEffect(() => {
    if (isSelected && controlledIsExpanded === undefined) {
      setInternalIsExpanded(true);
    }
  }, [isSelected, controlledIsExpanded]);
  
  // Handler para toggle de expansão (clique no card)
  const handleToggleExpand = () => {
    if (!disabled) {
      if (onToggleExpand) {
        onToggleExpand();
      } else {
        setInternalIsExpanded(!internalIsExpanded);
      }
    }
  };
  
  // Handler para seleção (clique no radio)
  const handleRadioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onSelect();
    }
  };
  
  // Edge case: Modelo sem providers configurados
  if (!hasConfiguredProvider) {
    return (
      <Card
        sx={{
          mb: 0.5,
        py: 1.75, px: 1,
          opacity: 0.6,
          pointerEvents: 'none',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: 'warning.main'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <SmartToyIcon fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">
            {model.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="warning.main">
          ⚠️ Este modelo não possui providers configurados. Configure AWS Bedrock ou Azure nas configurações.
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      elevation={isSelected ? 2 : 1}
      sx={{
        mb: 0.5,
        py: 1.75, px: 1,
        cursor: disabled ? 'not-allowed' : 'pointer', 
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        bgcolor: isSelected ? 'backgrounds.secondarySubtle' : 'background.paper',
        opacity: disabled ? 0.6 : 1,
        minHeight: isExpanded ? 'auto' : 64,
        maxHeight: isExpanded ? 'none' : 64,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'fadeIn 0.3s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        '&:hover': disabled ? {} : {
          elevation: 3,
          borderColor: isSelected ? 'primary.main' : 'primary.light',
          transform: 'translateY(-2px)',
          cursor: 'pointer'
        }
      }}
      onClick={handleToggleExpand}
    >
      {/* Estado Colapsado */}
      {!isExpanded && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          height: 32
        }}>
          <Radio
            checked={isSelected}
            disabled={disabled}
            sx={{ p: 0.5, flexShrink: 0 }}
            aria-label={`Selecionar ${model.name}`}
            onClick={handleRadioClick}
          />
          
          <Typography
            variant="caption"
            fontWeight={isSelected ? 800 :  600}
            color={isSelected ? 'primary.main' : 'text.primary'}
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}
          >
            {getShortName(model.name)}
          </Typography>
          
          <Chip
            label={`Context: ${formatTokens(model.contextWindow)}`}
            size="small"
            sx={{ flexShrink: 0, font: 'button', fontSize: '0.7rem' }}
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
          />
        </Box>
      )}
      
      {/* Estado Expandido */}
      {isExpanded && (
        <Box>
          {/* Header: Radio + Nome */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
            <Radio
              checked={isSelected}
              disabled={disabled}
              sx={{ mt: -0.5, p: 0.5, flexShrink: 0 }}
              aria-label={`Selecionar ${model.name}`}
              onClick={handleRadioClick}
            />
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Nome Completo e Versão */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  fontWeight={isSelected ? 800 : 800}
                  color={isSelected ? 'primary.main' : 'text.primary'}
                  sx={{
                    fontSize: '0.95rem',
                    wordBreak: 'break-word',
                    flex: '1 1 auto',
                    minWidth: 0
                  }}
                >
                  {model.name}
                </Typography>
                {model.version && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      bgcolor: 'backgrounds.disabledSubtle',
                      borderRadius: 0.5,
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      flexShrink: 0
                    }}
                  >
                    v{model.version}
                  </Typography>
                )}
                {modelWithRating?.badge && (
                  <ModelBadge badge={modelWithRating.badge} size="sm" showIcon />
                )}
              </Box>
              
              {/* Rating com Tooltip */}
              {modelWithRating?.rating && (
                <Box sx={{ mb: 1 }}>
                  <ModelMetricsTooltip
                    metrics={modelWithRating.metrics!}
                    scores={modelWithRating.scores!}
                  >
                    <ModelRatingStars
                      rating={modelWithRating.rating}
                      size="sm"
                      showValue
                    />
                  </ModelMetricsTooltip>
                </Box>
              )}
              
              {/* Badges de Providers */}
              <Box sx={{ mb: 1.5 }}>
                <ProviderBadgeGroup
                  providers={model.availableOn}
                  modelId={model.apiModelId}
                  showCertification
                  size="small"
                />
              </Box>
              
              {/* Informações em Grid Compacto */}
              <Grid container spacing={1.5} sx={{ mb: 1 }}>
                {/* Coluna 1: Context & Output */}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.5 }}>
                    📝 Context: {formatTokens(model.contextWindow)}
                  </Typography>
                  {model.maxOutputTokens && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      📤 Output: {formatTokens(model.maxOutputTokens)}
                    </Typography>
                  )}
                </Grid>
                
                {/* Coluna 2: Pricing */}
                <Grid item xs={6}>
                  {model.pricing && (
                    <>
                      {model.pricing.inputPer1M !== undefined && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', mb: 0.5 }}>
                          💵 In: ${model.pricing.inputPer1M.toFixed(2)}/1M
                        </Typography>
                      )}
                      {model.pricing.outputPer1M !== undefined && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          💸 Out: ${model.pricing.outputPer1M.toFixed(2)}/1M
                        </Typography>
                      )}
                    </>
                  )}
                </Grid>
              </Grid>
              
              {/* Capabilities Badges */}
              {model.capabilities && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                  {model.capabilities.supportsVision && (
                    <Chip
                      icon={<ImageIcon sx={{ fontSize: 12 }} />}
                      label="Vision"
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', '& .MuiChip-icon': { ml: 0.5 } }}
                      color="info"
                      variant="outlined"
                    />
                  )}
                  {model.capabilities.supportsPromptCache && (
                    <Chip
                      icon={<CachedIcon sx={{ fontSize: 12 }} />}
                      label="Cache"
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', '& .MuiChip-icon': { ml: 0.5 } }}
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {model.capabilities.supportsFunctionCalling && (
                    <Chip
                      icon={<FunctionsIcon sx={{ fontSize: 12 }} />}
                      label="Functions"
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', '& .MuiChip-icon': { ml: 0.5 } }}
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
              
              {/* Cache Pricing (se disponível) */}
              {model.pricing?.cacheReadPer1M !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.65rem' }}>
                  💾 Cache: ${model.pricing.cacheReadPer1M.toFixed(2)}/1M read, ${model.pricing.cacheWritePer1M?.toFixed(2) || '0.00'}/1M write
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Expansão: Seletor de Provider (se múltiplos) */}
      <Collapse in={showProviderSelector} timeout="auto">
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ p: 2, bgcolor: 'backgrounds.disabledSubtle', borderRadius: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id={`provider-select-${model.id}`}>
              Provider Ativo
            </InputLabel>
            <Select
              labelId={`provider-select-${model.id}`}
              value={selectedProvider || model.availableOn[0]?.providerSlug || ''}
              label="Provider Ativo"
              onChange={(e) => {
                e.stopPropagation();
                onProviderChange?.(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {model.availableOn.map((provider) => (
                <MenuItem 
                  key={provider.providerSlug} 
                  value={provider.providerSlug}
                  disabled={!provider.isConfigured}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{provider.providerName}</span>
                    {!provider.isConfigured && (
                      <Typography variant="caption" color="text.secondary">
                        (não configurado)
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.7rem' }}>
            💡 Este modelo está disponível em múltiplos providers. Selecione qual usar.
          </Typography>
        </Box>
      </Collapse>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  return (
    prevProps.model.id === nextProps.model.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedProvider === nextProps.selectedProvider &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});

/**
 * Props do componente ModelCardList
 */
export interface ModelCardListProps {
  /** Lista de modelos a serem exibidos */
  models: ModelWithProviders[];
  /** Modelo atualmente selecionado */
  selectedModel: ModelWithProviders | null;
  /** Callback ao selecionar modelo */
  onSelectModel: (modelId: string) => void;
  /** Provider ativo se modelo selecionado */
  selectedProvider?: string;
  /** Callback ao trocar provider */
  onProviderChange?: (providerSlug: string) => void;
  /** Se a lista está desabilitada */
  disabled?: boolean;
  /** ID do modelo expandido (accordion exclusivo) */
  expandedModelId?: string | null;
  /** Callback ao alternar expansão */
  onToggleExpand?: (modelId: string) => void;
}

/**
 * Lista de ModelCards
 * 
 * Exibe uma lista de modelos em formato de cards, com título e contador.
 * Mostra mensagem quando não há modelos disponíveis.
 * 
 * @example
 * ```tsx
 * <ModelCardList
 *   models={filteredModels}
 *   selectedModel={selectedModel}
 *   onSelectModel={(id) => handleSelectModel(id)}
 *   selectedProvider="aws"
 *   onProviderChange={(provider) => handleProviderChange(provider)}
 * />
 * ```
 */
export const ModelCardList = React.memo(function ModelCardList({
  models,
  selectedModel,
  onSelectModel,
  selectedProvider,
  onProviderChange,
  disabled = false,
  expandedModelId,
  onToggleExpand
}: ModelCardListProps) {
  
  // Empty state melhorado
  if (models.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <SmartToyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: '1rem' }}>
          Nenhum modelo disponível
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Este vendor não possui modelos configurados no momento.
          Configure um provider para ver os modelos disponíveis.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        🤖 Modelos Disponíveis ({models.length})
      </Typography>
      
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.apiModelId === model.apiModelId}
          onSelect={() => onSelectModel(model.apiModelId)}
          selectedProvider={selectedProvider}
          onProviderChange={onProviderChange}
          disabled={disabled}
          isExpanded={expandedModelId !== undefined ? expandedModelId === model.apiModelId : undefined}
          onToggleExpand={onToggleExpand ? () => onToggleExpand(model.apiModelId) : undefined}
        />
      ))}
    </Box>
  );
});
