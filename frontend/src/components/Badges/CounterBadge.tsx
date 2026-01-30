// frontend/src/components/Badges/CounterBadge.tsx
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import React from 'react';
import { Chip } from '@mui/material';

/**
 * Props para o componente CounterBadge
 * 
 * @interface CounterBadgeProps
 * @property {number} count - Número a ser exibido no contador
 * @property {string} [label] - Label opcional após o número (ex: "modelos", "mensagens")
 * @property {number} [max] - Valor máximo antes de exibir "+" (ex: 99+ para count > max)
 * @property {'primary' | 'secondary' | 'default'} [color='default'] - Cor do badge
 * @property {'small' | 'medium'} [size='small'] - Tamanho do badge
 * 
 * @example
 * // Contador simples
 * <CounterBadge count={5} />
 * 
 * @example
 * // Contador com label
 * <CounterBadge count={5} label="modelos" />
 * 
 * @example
 * // Contador com limite máximo
 * <CounterBadge count={120} label="mensagens" max={99} />
 * // Exibe: "99+ mensagens"
 */
export interface CounterBadgeProps {
  count: number;
  label?: string;
  max?: number;
  color?: 'primary' | 'secondary' | 'default';
  size?: 'small' | 'medium';
}

/**
 * CounterBadge - Badge para exibição de contadores
 * 
 * Componente padronizado para exibir contadores numéricos em toda a aplicação.
 * Suporta limite máximo com indicador "+" para valores grandes.
 * 
 * **Casos de uso:**
 * - Número de modelos disponíveis
 * - Contadores de mensagens
 * - Quantidade de itens selecionados
 * - Totais de registros
 * - Número de notificações
 * 
 * **Comportamento do max:**
 * - Se count <= max: exibe o valor exato (ex: "45 modelos")
 * - Se count > max: exibe "max+" (ex: "99+ mensagens")
 * - Se max não definido: sempre exibe o valor exato
 * 
 * **Cores disponíveis:**
 * - primary: Azul (destaque principal)
 * - secondary: Laranja (destaque secundário)
 * - default: Cinza (neutro)
 * 
 * @component
 * @param {CounterBadgeProps} props - Propriedades do componente
 * @returns {JSX.Element} Badge com contador estilizado
 * 
 * @example
 * // Contador de modelos disponíveis
 * <CounterBadge 
 *   count={5} 
 *   label="modelos disponíveis"
 *   color="primary"
 * />
 * 
 * @example
 * // Contador de mensagens com limite
 * <CounterBadge 
 *   count={120} 
 *   label="mensagens"
 *   max={99}
 *   color="secondary"
 * />
 * // Resultado: "99+ mensagens"
 * 
 * @example
 * // Contador simples sem label
 * <CounterBadge count={42} />
 * // Resultado: "42"
 */
export const CounterBadge = React.memo<CounterBadgeProps>(({
  count,
  label,
  max,
  color = 'default',
  size = 'small'
}) => {
  // Formata o contador com limite máximo se especificado
  const displayCount = max && count > max ? `${max}+` : count.toString();
  
  // Combina contador com label se fornecido
  const displayLabel = label ? `${displayCount} ${label}` : displayCount;

  return (
    <Chip
      label={displayLabel}
      color={color}
      size={size}
      variant="filled"
    />
  );
});

CounterBadge.displayName = 'CounterBadge';
