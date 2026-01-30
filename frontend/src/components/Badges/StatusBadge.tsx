// frontend/src/components/Badges/StatusBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import React from 'react';
import { Chip, ChipProps } from '@mui/material';

/**
 * Props para o componente StatusBadge
 * 
 * @interface StatusBadgeProps
 * @property {string} label - Texto a ser exibido no badge
 * @property {'success' | 'warning' | 'error' | 'info' | 'default'} status - Status que define a cor do badge
 * @property {React.ReactElement} [icon] - Ícone opcional a ser exibido antes do label
 * @property {'small' | 'medium'} [size='small'] - Tamanho do badge
 * @property {'filled' | 'outlined'} [variant='filled'] - Variante visual do badge
 * @property {() => void} [onClick] - Callback opcional para tornar o badge clicável
 * 
 * @example
 * // Badge de sucesso simples
 * <StatusBadge label="Certificado" status="success" />
 * 
 * @example
 * // Badge de erro com ícone
 * <StatusBadge 
 *   label="Indisponível" 
 *   status="error" 
 *   icon={<ErrorIcon />}
 * />
 * 
 * @example
 * // Badge de aviso clicável
 * <StatusBadge 
 *   label="Configuração Necessária" 
 *   status="warning"
 *   onClick={() => console.log('Badge clicado')}
 * />
 */
export interface StatusBadgeProps {
  label: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  icon?: React.ReactElement;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  onClick?: () => void;
}

/**
 * StatusBadge - Badge genérico para exibição de status
 * 
 * Componente padronizado para exibir status em toda a aplicação.
 * Usa cores do theme.palette para garantir consistência visual.
 * 
 * **Casos de uso:**
 * - Estados de certificação (Certificado, Aviso, Indisponível)
 * - Status de configuração (Configurado, Pendente, Erro)
 * - Avisos e alertas (Atenção, Informação)
 * - Modos de operação (Ativo, Inativo, Manutenção)
 * 
 * **Cores padronizadas:**
 * - success: Verde (operações bem-sucedidas, certificações válidas)
 * - warning: Amarelo (avisos, atenção necessária)
 * - error: Vermelho (erros, falhas, indisponibilidade)
 * - info: Azul (informações, status neutros)
 * - default: Cinza (status padrão, sem classificação específica)
 * 
 * @component
 * @param {StatusBadgeProps} props - Propriedades do componente
 * @returns {JSX.Element} Badge estilizado com status
 * 
 * @example
 * // Badge de certificação bem-sucedida
 * <StatusBadge 
 *   label="Certificado" 
 *   status="success" 
 *   icon={<CheckCircleIcon />}
 *   size="small"
 * />
 * 
 * @example
 * // Badge de aviso de qualidade
 * <StatusBadge 
 *   label="Aviso de Qualidade" 
 *   status="warning"
 *   variant="outlined"
 * />
 * 
 * @example
 * // Badge de erro com ação
 * <StatusBadge 
 *   label="Erro de Configuração" 
 *   status="error"
 *   onClick={() => openConfigDialog()}
 * />
 */
export const StatusBadge = React.memo<StatusBadgeProps>(({
  label,
  status,
  icon,
  size = 'small',
  variant = 'filled',
  onClick
}) => {
  // Mapeamento de status para cores do MUI
  const colorMap: Record<StatusBadgeProps['status'], ChipProps['color']> = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
    default: 'default',
  };

  return (
    <Chip
      label={label}
      color={colorMap[status]}
      size={size}
      variant={variant}
      icon={icon}
      onClick={onClick}
      clickable={!!onClick}
    />
  );
});

StatusBadge.displayName = 'StatusBadge';
