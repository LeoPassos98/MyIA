// frontend/src/components/Badges/MetricBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import React from 'react';
import { Chip } from '@mui/material';

/**
 * Props para o componente MetricBadge
 * 
 * @interface MetricBadgeProps
 * @property {string} label - Label da métrica (ex: "Context", "Latency", "Tokens")
 * @property {string | number} value - Valor da métrica
 * @property {string} [unit] - Unidade opcional (ex: "ms", "K", "MB")
 * @property {'primary' | 'secondary' | 'default'} [color='default'] - Cor do badge
 * @property {'small' | 'medium'} [size='small'] - Tamanho do badge
 * 
 * @example
 * // Métrica simples
 * <MetricBadge label="Context" value="200K" />
 * 
 * @example
 * // Métrica com unidade
 * <MetricBadge label="Latency" value={1234} unit="ms" />
 * 
 * @example
 * // Métrica com cor personalizada
 * <MetricBadge label="Tokens" value={500} color="primary" />
 */
export interface MetricBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
}

/**
 * MetricBadge - Badge para exibição de métricas
 * 
 * Componente padronizado para exibir métricas técnicas em toda a aplicação.
 * Usa variant="outlined" por padrão para diferenciação visual de outros badges.
 * 
 * **Casos de uso:**
 * - Context window de modelos (ex: "Context: 200K")
 * - Contadores de tokens (ex: "Tokens: 1500")
 * - Latência de requisições (ex: "Latency: 1234ms")
 * - Custos de inferência (ex: "Cost: $0.05")
 * - Tamanhos de arquivos (ex: "Size: 2.5MB")
 * - Taxas e percentuais (ex: "Success: 98%")
 * 
 * **Formato de exibição:**
 * - Sem unidade: "Label: Value" (ex: "Context: 200K")
 * - Com unidade: "Label: Value + unit" (ex: "Latency: 1234ms")
 * 
 * **Cores disponíveis:**
 * - primary: Azul (métricas principais)
 * - secondary: Laranja (métricas secundárias)
 * - default: Cinza (métricas neutras)
 * 
 * @component
 * @param {MetricBadgeProps} props - Propriedades do componente
 * @returns {JSX.Element} Badge com métrica estilizado
 * 
 * @example
 * // Context window de modelo
 * <MetricBadge 
 *   label="Context" 
 *   value="200K"
 *   size="small"
 * />
 * // Resultado: "Context: 200K"
 * 
 * @example
 * // Latência com unidade
 * <MetricBadge 
 *   label="Latency" 
 *   value={1234} 
 *   unit="ms"
 *   color="primary"
 * />
 * // Resultado: "Latency: 1234ms"
 * 
 * @example
 * // Custo de inferência
 * <MetricBadge 
 *   label="Cost" 
 *   value="0.05" 
 *   unit="$"
 *   color="secondary"
 * />
 * // Resultado: "Cost: 0.05$"
 * 
 * @example
 * // Taxa de sucesso
 * <MetricBadge 
 *   label="Success" 
 *   value={98} 
 *   unit="%"
 * />
 * // Resultado: "Success: 98%"
 */
export const MetricBadge = React.memo<MetricBadgeProps>(({
  label,
  value,
  unit,
  color = 'default',
  size = 'small'
}) => {
  // Formata o valor com unidade se fornecida
  const displayValue = unit ? `${value}${unit}` : value;
  
  // Combina label com valor formatado
  const displayLabel = `${label}: ${displayValue}`;

  return (
    <Chip
      label={displayLabel}
      color={color}
      size={size}
      variant="outlined"
    />
  );
});

MetricBadge.displayName = 'MetricBadge';
