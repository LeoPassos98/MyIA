// frontend/src/components/Badges/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Badges - Componentes padronizados de badges
 * 
 * Este módulo exporta componentes wrapper padronizados para badges,
 * garantindo consistência visual em toda a aplicação MyIA.
 * 
 * **Componentes disponíveis:**
 * 
 * 1. **StatusBadge** - Badge genérico para status
 *    - Casos de uso: certificação, configuração, avisos, modos de operação
 *    - Cores: success, warning, error, info, default
 *    - Variantes: filled (padrão), outlined
 * 
 * 2. **CounterBadge** - Badge para contadores
 *    - Casos de uso: número de modelos, mensagens, itens, notificações
 *    - Suporta limite máximo com indicador "+" (ex: 99+)
 *    - Cores: primary, secondary, default
 * 
 * 3. **MetricBadge** - Badge para métricas técnicas
 *    - Casos de uso: context window, tokens, latência, custos
 *    - Suporta unidades (ms, K, MB, %, $)
 *    - Variante: outlined (padrão)
 * 
 * **Padrões de design:**
 * - Todos os badges usam cores do theme.palette
 * - Tamanhos padronizados: small (padrão), medium
 * - Componentes memoizados com React.memo para performance
 * - JSDoc completo para documentação inline
 * 
 * @module Badges
 * @see {@link StatusBadge} - Badge de status
 * @see {@link CounterBadge} - Badge de contador
 * @see {@link MetricBadge} - Badge de métrica
 * 
 * @example
 * // Importação individual
 * import { StatusBadge } from '@/components/Badges';
 * 
 * @example
 * // Importação múltipla
 * import { StatusBadge, CounterBadge, MetricBadge } from '@/components/Badges';
 * 
 * @example
 * // Uso básico
 * <StatusBadge label="Certificado" status="success" />
 * <CounterBadge count={5} label="modelos" />
 * <MetricBadge label="Context" value="200K" />
 */

export { StatusBadge } from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

export { CounterBadge } from './CounterBadge';
export type { CounterBadgeProps } from './CounterBadge';

export { MetricBadge } from './MetricBadge';
export type { MetricBadgeProps } from './MetricBadge';
