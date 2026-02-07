// frontend/src/features/chat/components/ControlPanel/ModelCard/utils/modelValidators.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Model Validation Utilities
 * 
 * Utilitários puros para validação de modelos e providers.
 * 
 * @module features/chat/components/ControlPanel/ModelCard/utils
 */

import type { ModelWithProviders } from '@/types/ai';

/**
 * Verifica se o modelo possui pelo menos um provider configurado
 * 
 * @param model - Modelo a ser validado
 * @returns true se houver pelo menos um provider configurado
 * 
 * @example
 * ```typescript
 * const model = { availableOn: [{ isConfigured: true }, { isConfigured: false }] };
 * hasConfiguredProvider(model); // → true
 * ```
 */
export function hasConfiguredProvider(model: ModelWithProviders): boolean {
  return model.availableOn.some(p => p.isConfigured);
}

/**
 * Verifica se o modelo está disponível em múltiplos providers
 * 
 * @param model - Modelo a ser validado
 * @returns true se houver mais de um provider
 * 
 * @example
 * ```typescript
 * const model = { availableOn: [{ ... }, { ... }] };
 * hasMultipleProviders(model); // → true
 * ```
 */
export function hasMultipleProviders(model: ModelWithProviders): boolean {
  return model.availableOn.length > 1;
}

/**
 * Determina se o seletor de provider deve ser exibido
 * 
 * Exibe o seletor apenas quando:
 * - Modelo está selecionado
 * - Modelo tem múltiplos providers
 * - Callback de mudança de provider está disponível
 * 
 * @param model - Modelo a ser validado
 * @param isSelected - Se o modelo está selecionado
 * @param onProviderChange - Callback de mudança de provider
 * @returns true se o seletor deve ser exibido
 * 
 * @example
 * ```typescript
 * shouldShowProviderSelector(model, true, handleChange); // → true
 * shouldShowProviderSelector(model, false, handleChange); // → false
 * ```
 */
export function shouldShowProviderSelector(
  model: ModelWithProviders,
  isSelected: boolean,
  onProviderChange?: (slug: string) => void
): boolean {
  return isSelected && hasMultipleProviders(model) && !!onProviderChange;
}

/**
 * Obtém o provider padrão (primeiro configurado)
 * 
 * @param model - Modelo a ser validado
 * @returns Slug do primeiro provider configurado ou undefined
 * 
 * @example
 * ```typescript
 * const model = {
 *   availableOn: [
 *     { providerSlug: 'aws', isConfigured: false },
 *     { providerSlug: 'azure', isConfigured: true }
 *   ]
 * };
 * getDefaultProvider(model); // → "azure"
 * ```
 */
export function getDefaultProvider(model: ModelWithProviders): string | undefined {
  return model.availableOn.find(p => p.isConfigured)?.providerSlug;
}
