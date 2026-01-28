// frontend/src/features/chat/components/ControlPanel/ProviderBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * ProviderBadge Component
 *
 * Badge visual que indica em qual provider um modelo está disponível.
 * Exibe ícone do provider, nome e status de configuração.
 *
 * @module features/chat/components/ControlPanel/ProviderBadge
 */

import { Chip, Tooltip, Box, type ChipProps } from '@mui/material';
import { getProviderIcon } from '../../../../constants/providerIcons';
import { CertificationBadge } from './CertificationBadge';
import { useModelRating } from '../../../../hooks/useModelRating';
import type { ProviderAvailability } from '../../../../types/ai';

/**
 * Props do componente ProviderBadge
 */
export interface ProviderBadgeProps {
  /** Informações de disponibilidade do provider */
  provider: ProviderAvailability;
  /** ID do modelo (para buscar rating) */
  modelId?: string;
  /** Tamanho do badge */
  size?: ChipProps['size'];
  /** Se deve mostrar badge de certificação ao lado */
  showCertification?: boolean;
}

/**
 * Badge que mostra em qual provider um modelo está disponível
 * 
 * Exibe um badge com ícone e nome do provider, indicando se está configurado.
 * Fornece tooltip informativo e opcionalmente mostra badge de certificação.
 * 
 * @example
 * ```tsx
 * // Badge de provider configurado
 * <ProviderBadge
 *   provider={{
 *     providerSlug: 'aws',
 *     providerName: 'AWS Bedrock',
 *     isConfigured: true,
 *     certification: { status: 'certified', successRate: 98 }
 *   }}
 *   showCertification
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Badge de provider não configurado
 * <ProviderBadge
 *   provider={{
 *     providerSlug: 'azure',
 *     providerName: 'Azure',
 *     isConfigured: false,
 *     certification: null
 *   }}
 * />
 * ```
 */
export function ProviderBadge({ 
  provider,
  modelId,
  size = 'small',
  showCertification = false 
}: ProviderBadgeProps) {
  
  // ✅ CORREÇÃO: Buscar rating do modelo para verificar se tem badge
  const { getModelById } = useModelRating();
  const modelWithRating = modelId ? getModelById(modelId) : null;
  const hasBadge = !!modelWithRating?.badge;
  
  // ✅ CORREÇÃO: Não mostrar CertificationBadge "Indisponível" se o modelo tiver badge de rating
  const shouldShowCertification = showCertification && provider.certification && 
    !(provider.certification.status === 'failed' && hasBadge);
  
  /**
   * Conteúdo do tooltip com informações do provider
   */
  const tooltipContent = (
    <Box>
      <div><strong>{provider.providerName}</strong></div>
      <div>Status: {provider.isConfigured ? 'Configurado' : 'Não configurado'}</div>
      {provider.certification && (
        <>
          <div>Certificação: {provider.certification.status}</div>
          {provider.certification.successRate !== undefined && (
            <div>Taxa de sucesso: {provider.certification.successRate}%</div>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={tooltipContent} arrow placement="top">
        <Chip
          icon={
            <Box
              component="img"
              src={getProviderIcon(provider.providerSlug)}
              alt={provider.providerName}
              sx={{ 
                width: 16, 
                height: 16,
                opacity: provider.isConfigured ? 1 : 0.5
              }}
            />
          }
          label={provider.providerName}
          size={size}
          color={provider.isConfigured ? 'primary' : 'default'}
          variant={provider.isConfigured ? 'filled' : 'outlined'}
          sx={{ 
            opacity: provider.isConfigured ? 1 : 0.6,
            cursor: 'help',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              opacity: 1,
              transform: 'scale(1.02)'
            }
          }}
          aria-label={`Disponível em ${provider.providerName}${provider.isConfigured ? ' (configurado)' : ' (não configurado)'}`}
        />
      </Tooltip>
      
      {shouldShowCertification && provider.certification && (
        <CertificationBadge
          status={provider.certification.status as any}
          successRate={provider.certification.successRate}
          lastChecked={provider.certification.lastChecked}
          size={size}
        />
      )}
    </Box>
  );
}

/**
 * Props do componente ProviderBadgeGroup
 */
export interface ProviderBadgeGroupProps {
  /** Lista de providers disponíveis */
  providers: ProviderAvailability[];
  /** ID do modelo (para buscar rating) */
  modelId?: string;
  /** Tamanho dos badges */
  size?: ChipProps['size'];
  /** Se deve mostrar badges de certificação */
  showCertification?: boolean;
}

/**
 * Grupo de badges de providers
 * 
 * Exibe múltiplos badges de providers em um layout flexível.
 * Útil para mostrar todos os providers onde um modelo está disponível.
 * 
 * @example
 * ```tsx
 * <ProviderBadgeGroup
 *   providers={[
 *     { providerSlug: 'aws', providerName: 'AWS Bedrock', isConfigured: true, certification: {...} },
 *     { providerSlug: 'azure', providerName: 'Azure', isConfigured: false, certification: null }
 *   ]}
 *   showCertification
 * />
 * ```
 */
export function ProviderBadgeGroup({ 
  providers,
  modelId,
  size = 'small',
  showCertification = false 
}: ProviderBadgeGroupProps) {
  if (providers.length === 0) return null;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 0.5, 
        flexWrap: 'wrap', 
        alignItems: 'center' 
      }}
    >
      {providers.map((provider) => (
        <ProviderBadge
          key={provider.providerSlug}
          provider={provider}
          modelId={modelId}
          size={size}
          showCertification={showCertification}
        />
      ))}
    </Box>
  );
}
