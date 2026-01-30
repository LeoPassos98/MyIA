// frontend/src/features/chat/components/ControlPanel/CertificationBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * CertificationBadge Component
 *
 * Badge visual para mostrar o status de certificação de um modelo.
 * Exibe cores diferentes baseadas no status e fornece tooltips informativos.
 *
 * ✅ FASE 2 - PADRONIZAÇÃO VISUAL DE BADGES
 * - Tamanhos de ícones padronizados: 14px (small), 16px (medium)
 * - Uso de cores do theme.palette (via MUI color props)
 * - Mantém funcionalidade existente 100% compatível
 *
 * @module features/chat/components/ControlPanel/CertificationBadge
 */

import { Chip, Tooltip, type ChipProps } from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  HelpOutline
} from '@mui/icons-material';
import type { CertificationStatus, ErrorCategory } from '../../../../types/ai';
import { formatRelativeDate } from '../../../../utils/formatters';

/**
 * Props do componente CertificationBadge
 */
export interface CertificationBadgeProps {
  /** Status de certificação do modelo */
  status: CertificationStatus | 'not_tested';
  /** Data da última verificação (ISO string) */
  lastChecked?: string;
  /** Taxa de sucesso (0-100) */
  successRate?: number;
  /** Categoria de erro (se houver) */
  errorCategory?: ErrorCategory;
  /** Callback ao clicar no badge */
  onClick?: () => void;
  /** Tamanho do badge */
  size?: ChipProps['size'];
}

/**
 * Configuração visual para cada status de certificação
 */
interface BadgeConfig {
  color: ChipProps['color'];
  icon: React.ReactElement;
  label: string;
  tooltip: string;
}

/**
 * Componente de badge de certificação
 * 
 * Exibe um badge colorido com ícone indicando o status de certificação do modelo.
 * Fornece tooltips informativos e suporta clique para abrir detalhes.
 * 
 * @example
 * ```tsx
 * // Badge de modelo certificado
 * <CertificationBadge
 *   status="certified"
 *   lastChecked="2026-01-21T10:00:00Z"
 *   successRate={98}
 *   onClick={() => setShowModal(true)}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Badge de modelo com warning
 * <CertificationBadge
 *   status="quality_warning"
 *   successRate={75}
 *   errorCategory="QUALITY_ISSUE"
 *   onClick={() => setShowModal(true)}
 * />
 * ```
 */
export function CertificationBadge({
  status,
  lastChecked,
  successRate,
  errorCategory,
  onClick,
  size = 'small'
}: CertificationBadgeProps) {
  
  // ✅ PADRONIZAÇÃO: Tamanhos de ícones baseados no size prop
  // small = 14px, medium = 16px (conforme especificação do plano)
  const iconSize = size === 'small' ? 14 : 16;
  
  /**
   * Obtém a configuração visual baseada no status
   * ✅ PADRONIZAÇÃO: Cores via theme.palette (usando MUI color props)
   */
  const getBadgeConfig = (): BadgeConfig => {
    switch (status) {
      case 'certified':
        return {
          color: 'success',
          // ✅ PADRONIZAÇÃO: Tamanho de ícone dinâmico baseado no size prop
          icon: <CheckCircle sx={{ fontSize: iconSize }} />,
          label: successRate !== undefined ? `Certificado (${successRate}%)` : 'Certificado',
          tooltip: lastChecked
            ? `Testado em ${formatRelativeDate(lastChecked)}. Taxa de sucesso: ${successRate || 100}%`
            : 'Modelo certificado e funcionando corretamente'
        };
      
      case 'quality_warning':
        return {
          color: 'warning',
          // ✅ PADRONIZAÇÃO: Tamanho de ícone dinâmico baseado no size prop
          icon: <Warning sx={{ fontSize: iconSize }} />,
          label: 'Aviso de Qualidade',
          tooltip: errorCategory
            ? `${formatErrorCategory(errorCategory)} - Taxa de sucesso: ${successRate || 0}%`
            : `Taxa de sucesso abaixo do esperado: ${successRate || 0}%`
        };
      
      case 'failed':
      case 'configuration_required':
      case 'permission_required':
        return {
          color: 'error',
          // ✅ PADRONIZAÇÃO: Tamanho de ícone dinâmico baseado no size prop
          icon: <ErrorIcon sx={{ fontSize: iconSize }} />,
          label: status === 'configuration_required' ? 'Configuração Necessária' :
                 status === 'permission_required' ? 'Permissão Necessária' :
                 'Indisponível',
          tooltip: errorCategory
            ? `Modelo não está respondendo. Erro: ${formatErrorCategory(errorCategory)}`
            : 'Modelo não está disponível no momento'
        };
      
      default:
        return {
          color: 'default',
          // ✅ PADRONIZAÇÃO: Tamanho de ícone dinâmico baseado no size prop
          icon: <HelpOutline sx={{ fontSize: iconSize }} />,
          label: 'Não Testado',
          tooltip: 'Este modelo ainda não foi certificado. Clique para certificar.'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Tooltip 
      title={config.tooltip}
      arrow
      placement="top"
    >
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        onClick={onClick}
        size={size}
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          fontWeight: 500,
          '&:hover': onClick ? {
            opacity: 0.8,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease-in-out'
          } : {}
        }}
      />
    </Tooltip>
  );
}

/**
 * Formata a categoria de erro para exibição amigável
 */
function formatErrorCategory(category: ErrorCategory): string {
  const categoryMap: Record<ErrorCategory, string> = {
    UNAVAILABLE: 'Modelo Indisponível',
    PERMISSION_ERROR: 'Erro de Permissão',
    AUTHENTICATION_ERROR: 'Erro de Autenticação',
    RATE_LIMIT: 'Limite de Taxa Excedido',
    TIMEOUT: 'Tempo Esgotado',
    CONFIGURATION_ERROR: 'Erro de Configuração',
    QUALITY_ISSUE: 'Problema de Qualidade',
    NETWORK_ERROR: 'Erro de Rede',
    UNKNOWN_ERROR: 'Erro Desconhecido'
  };
  
  return categoryMap[category] || category;
}

/**
 * Componente auxiliar para exibir múltiplos badges de certificação
 * 
 * @example
 * ```tsx
 * <CertificationBadgeGroup
 *   badges={[
 *     { status: 'certified', successRate: 98 },
 *     { status: 'quality_warning', successRate: 75 }
 *   ]}
 * />
 * ```
 */
export interface CertificationBadgeGroupProps {
  badges: CertificationBadgeProps[];
}

export function CertificationBadgeGroup({ badges }: CertificationBadgeGroupProps) {
  if (badges.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {badges.map((badge, index) => (
        <CertificationBadge
          key={`${badge.status}-${badge.lastChecked || index}`}
          {...badge}
        />
      ))}
    </div>
  );
}
