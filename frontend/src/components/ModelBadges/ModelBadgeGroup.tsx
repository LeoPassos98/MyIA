// frontend/src/components/ModelBadges/ModelBadgeGroup.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Chip, Stack, useTheme } from '@mui/material';
import { ModelBadge } from '../ModelRating';
import { useModelBadges } from '../../hooks/useModelBadges';
import { CertificationDetails } from '../../types/ai';

// Ícones MUI para badges de status
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Interface para props do componente ModelBadgeGroup
 */
export interface ModelBadgeGroupProps {
  /** Modelo com ID e possível erro */
  model: {
    apiModelId: string;
    error?: string;
    /** Dados de certificação em tempo real (opcional) - sobrescreve cache */
    certificationResult?: CertificationDetails;
  };
  /** Tamanho dos badges */
  size?: 'sm' | 'md';
  /** Espaçamento entre badges */
  spacing?: number;
}

/**
 * Componente que renderiza grupo de badges de um modelo
 * Centraliza toda a lógica de exibição de badges
 *
 * ✅ Características:
 * - Usa hook useModelBadges para decisões de exibição
 * - Suporta 6 tipos de badges diferentes
 * - Layout flexível com wrap automático
 * - Tamanhos do theme (theme.components.badge.sizes)
 *
 * ✅ Badges Suportados:
 * 1. Badge de Rating (PREMIUM, RECOMENDADO, etc) - com ícones MUI
 * 2. Badge Certificado (CheckCircleIcon Certificado)
 * 3. Badge de Qualidade (WarningIcon Qualidade)
 * 4. Badge Rate Limit (PauseCircleIcon Não Testado)
 * 5. Badge Indisponível (CancelIcon Indisponível)
 * 6. Badge Não Testado (Não Testado)
 *
 * @example
 * <ModelBadgeGroup
 *   model={{ apiModelId: 'claude-3-opus' }}
 *   size="sm"
 *   spacing={1}
 * />
 */
export function ModelBadgeGroup({
  model,
  size = 'sm',
  spacing = 1
}: ModelBadgeGroupProps) {
  const theme = useTheme();
  const badges = useModelBadges(model);
  
  // Obter tamanhos do theme
  const badgeSizes = (theme.components as any)?.badge?.sizes || {
    sm: { height: 18, fontSize: '0.65rem' },
    md: { height: 20, fontSize: '0.7rem' },
  };
  
  const chipHeight = badgeSizes[size].height;
  const fontSize = badgeSizes[size].fontSize;
  
  // Tamanho dos ícones baseado no size
  const iconSize = size === 'sm' ? 14 : 16;
  
  return (
    <Stack direction="row" spacing={spacing} flexWrap="wrap" gap={spacing} alignItems="center">
      {/* Badge de Rating - usa ícones MUI via ModelBadge */}
      {badges.shouldShowRatingBadge && badges.badge && (
        <ModelBadge badge={badges.badge} size={size} showIcon />
      )}
      
      {/* Badge Certificado - CheckCircleIcon */}
      {badges.shouldShowCertifiedBadge && (
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: iconSize }} />}
          label="Certificado"
          size="small"
          color="success"
          sx={{ height: chipHeight, fontSize }}
        />
      )}
      
      {/* Badge Qualidade - WarningIcon */}
      {badges.shouldShowQualityBadge && (
        <Chip
          icon={<WarningIcon sx={{ fontSize: iconSize }} />}
          label="Qualidade"
          size="small"
          color="warning"
          sx={{ height: chipHeight, fontSize }}
        />
      )}
      
      {/* Badge Rate Limit - PauseCircleIcon */}
      {badges.shouldShowRateLimitBadge && (
        <Chip
          icon={<PauseCircleIcon sx={{ fontSize: iconSize }} />}
          label="Não Testado"
          size="small"
          color="default"
          sx={{ height: chipHeight, fontSize }}
        />
      )}
      
      {/* Badge Indisponível - CancelIcon */}
      {badges.shouldShowUnavailableBadge && (
        <Chip
          icon={<CancelIcon sx={{ fontSize: iconSize }} />}
          label="Indisponível"
          size="small"
          color="error"
          sx={{ height: chipHeight, fontSize }}
        />
      )}
      
      {/* Badge Não Testado - sem ícone */}
      {badges.shouldShowNotTestedBadge && (
        <Chip
          label="Não Testado"
          size="small"
          color="default"
          sx={{ height: chipHeight, fontSize }}
        />
      )}
    </Stack>
  );
}
