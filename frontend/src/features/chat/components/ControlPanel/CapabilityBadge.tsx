// frontend/src/features/chat/components/ControlPanel/CapabilityBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

import { Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FunctionsIcon from '@mui/icons-material/Functions';

interface CapabilityBadgeProps {
  label: string;
  enabled: boolean;
  tooltip?: string;
  icon?: 'check' | 'vision' | 'function';
}

export function CapabilityBadge({ label, enabled, tooltip, icon = 'check' }: CapabilityBadgeProps) {
  const getIcon = () => {
    if (!enabled) {
      return <CancelIcon aria-label="Recurso não disponível" />;
    }
    
    switch (icon) {
      case 'vision':
        return <VisibilityIcon aria-label="Suporte a visão computacional" />;
      case 'function':
        return <FunctionsIcon aria-label="Suporte a chamadas de função" />;
      default:
        return <CheckCircleIcon aria-label="Recurso disponível" />;
    }
  };

  const badge = (
    <Chip
      label={label}
      size="small"
      color={enabled ? 'success' : 'default'}
      icon={getIcon()}
      sx={{ mr: 1, mb: 1 }}
      aria-label={`${label}: ${enabled ? 'disponível' : 'não disponível'}`}
    />
  );

  return tooltip ? <Tooltip title={tooltip}>{badge}</Tooltip> : badge;
}
