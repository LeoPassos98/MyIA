// frontend/src/components/ModelBadges/index.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Sistema Centralizado de Badges
 * 
 * Componentes e hooks para gerenciar badges de modelos de IA de forma centralizada.
 * Elimina duplicação de código e padroniza a exibição de badges em toda a aplicação.
 * 
 * @example
 * import { ModelBadgeGroup } from '@/components/ModelBadges';
 * 
 * <ModelBadgeGroup 
 *   model={{ apiModelId: 'claude-3-opus' }} 
 *   size="sm" 
 * />
 */

export { ModelBadgeGroup } from './ModelBadgeGroup';
export type { ModelBadgeGroupProps } from './ModelBadgeGroup';
