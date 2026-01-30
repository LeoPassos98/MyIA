// frontend/src/features/chat/components/ControlPanel/CapabilityBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * CapabilityBadge Component
 *
 * Badge visual para indicar capabilities de modelos (Vision, Function Calling, etc).
 * Exibe ícones diferentes baseados no tipo de capability e status (enabled/disabled).
 *
 * ✅ FASE 2 - PADRONIZAÇÃO VISUAL DE BADGES
 * - Tamanhos de ícones padronizados: 14px (small), 16px (medium)
 * - Uso de cores do theme.palette (via MUI color props)
 * - Suporte a size prop para consistência com outros badges
 * - Mantém funcionalidade existente 100% compatível
 *
 * @module features/chat/components/ControlPanel/CapabilityBadge
 */

import { Chip, Tooltip, type ChipProps } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FunctionsIcon from '@mui/icons-material/Functions';

interface CapabilityBadgeProps {
  label: string;
  enabled: boolean;
  tooltip?: string;
  icon?: 'check' | 'vision' | 'function';
  /** Tamanho do badge (padrão: small) */
  size?: ChipProps['size'];
}

export function CapabilityBadge({
  label,
  enabled,
  tooltip,
  icon = 'check',
  size = 'small'
}: CapabilityBadgeProps) {
  
  // ✅ PADRONIZAÇÃO: Tamanhos de ícones baseados no size prop
  // small = 14px, medium = 16px (conforme especificação do plano)
  const iconSize = size === 'small' ? 14 : 16;
  
  /**
   * Obtém o ícone apropriado baseado no tipo e status
   * ✅ PADRONIZAÇÃO: Tamanho de ícone dinâmico
   */
  const getIcon = () => {
    if (!enabled) {
      return <CancelIcon sx={{ fontSize: iconSize }} aria-label="Recurso não disponível" />;
    }
    
    switch (icon) {
      case 'vision':
        return <VisibilityIcon sx={{ fontSize: iconSize }} aria-label="Suporte a visão computacional" />;
      case 'function':
        return <FunctionsIcon sx={{ fontSize: iconSize }} aria-label="Suporte a chamadas de função" />;
      default:
        return <CheckCircleIcon sx={{ fontSize: iconSize }} aria-label="Recurso disponível" />;
    }
  };

  const badge = (
    <Chip
      label={label}
      size={size}
      // ✅ PADRONIZAÇÃO: Cores via theme.palette (usando MUI color props)
      color={enabled ? 'success' : 'default'}
      icon={getIcon()}
      sx={{ mr: 1, mb: 1 }}
      aria-label={`${label}: ${enabled ? 'disponível' : 'não disponível'}`}
    />
  );

  return tooltip ? <Tooltip title={tooltip}>{badge}</Tooltip> : badge;
}
