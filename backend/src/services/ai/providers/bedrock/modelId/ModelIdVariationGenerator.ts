// backend/src/services/ai/providers/bedrock/modelId/ModelIdVariationGenerator.ts

import logger from '../../../../../utils/logger';
import { ModelIdNormalizer } from './ModelIdNormalizer';
import { InferenceProfileResolver } from './InferenceProfileResolver';

/**
 * Tipo de variação de model ID
 */
export type VariationType = 'inference_profile' | 'normalized' | 'legacy';

/**
 * Variação de model ID para auto-test
 */
export interface ModelIdVariation {
  /** Model ID da variação */
  modelId: string;
  
  /** Tipo da variação */
  type: VariationType;
  
  /** Prioridade (menor = maior prioridade) */
  priority: number;
  
  /** Descrição da variação */
  description: string;
}

/**
 * Gera variações de model ID para auto-test
 * 
 * Sistema de auto-test que tenta múltiplas variações do modelId
 * até encontrar a correta. Isso permite suportar diferentes formatos
 * sem exigir configuração manual.
 * 
 * Variações geradas:
 * 1. **Inference Profile** (us.model-id) - Para modelos que requerem profile
 * 2. **Normalized** (model-id sem sufixo) - Formato padrão
 * 3. **Legacy** (model-id sem "2") - Para modelos nova-2-* → nova-*
 * 
 * @example
 * ```typescript
 * const generator = new ModelIdVariationGenerator(normalizer, resolver);
 * 
 * // Modelo que requer inference profile
 * const variations = await generator.generate(
 *   'anthropic.claude-3-5-sonnet-20241022-v2:0',
 *   true,
 *   'us-east-1'
 * );
 * // → [
 * //   { modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', type: 'inference_profile', priority: 1 }
 * // ]
 * 
 * // Modelo ON_DEMAND
 * const variations2 = await generator.generate(
 *   'amazon.nova-2-lite-v1:0',
 *   false,
 *   'us-east-1'
 * );
 * // → [
 * //   { modelId: 'us.amazon.nova-2-lite-v1:0', type: 'inference_profile', priority: 1 },
 * //   { modelId: 'amazon.nova-2-lite-v1:0', type: 'normalized', priority: 2 },
 * //   { modelId: 'amazon.nova-lite-v1:0', type: 'legacy', priority: 3 }
 * // ]
 * ```
 */
export class ModelIdVariationGenerator {
  constructor(
    private readonly normalizer: ModelIdNormalizer,
    private readonly resolver: InferenceProfileResolver
  ) {}

  /**
   * Gera variações de model ID para auto-test
   * 
   * @param originalModelId Model ID original (pode conter sufixo)
   * @param requiresInferenceProfile Se o modelo requer inference profile
   * @param region Região AWS
   * @returns Lista de variações ordenadas por prioridade
   */
  async generate(
    originalModelId: string,
    requiresInferenceProfile: boolean,
    region: string
  ): Promise<ModelIdVariation[]> {
    // Normalizar model ID
    const normalizedModelId = this.normalizer.normalize(originalModelId);
    
    // Obter inference profile se necessário
    const modelIdWithProfile = await this.resolver.resolve(normalizedModelId, region);
    
    // Log se houve normalização
    if (normalizedModelId !== originalModelId) {
      logger.info(`🔄 [VariationGenerator] Normalized: ${originalModelId} → ${normalizedModelId}`);
    }
    
    // Se requer inference profile, retornar apenas essa variação
    if (requiresInferenceProfile) {
      logger.info(`🔍 [VariationGenerator] Model requires Inference Profile, using only: ${modelIdWithProfile}`);
      return [
        {
          modelId: modelIdWithProfile,
          type: 'inference_profile',
          priority: 1,
          description: 'System-defined inference profile (required)',
        },
      ];
    }
    
    // Modelos ON_DEMAND: gerar múltiplas variações
    const variations: ModelIdVariation[] = [];
    
    // Variação 1: Com inference profile (pode funcionar para alguns modelos)
    variations.push({
      modelId: modelIdWithProfile,
      type: 'inference_profile',
      priority: 1,
      description: 'With inference profile prefix',
    });
    
    // Variação 2: Normalizado (sem sufixo) - formato padrão
    if (normalizedModelId !== modelIdWithProfile) {
      variations.push({
        modelId: normalizedModelId,
        type: 'normalized',
        priority: 2,
        description: 'Normalized without suffix',
      });
    }
    
    // Variação 3: Sem "2" (para modelos nova-2-*)
    if (normalizedModelId.includes('nova-2-')) {
      const legacyModelId = normalizedModelId.replace('nova-2-', 'nova-');
      variations.push({
        modelId: legacyModelId,
        type: 'legacy',
        priority: 3,
        description: 'Legacy format without "2"',
      });
    }
    
    logger.info(`🔍 [VariationGenerator] Generated ${variations.length} variations for: ${originalModelId}`);
    logger.debug(`[VariationGenerator] Variations:`, variations.map(v => v.modelId));
    
    return variations;
  }

  /**
   * Gera apenas a variação principal (maior prioridade)
   * 
   * @param originalModelId Model ID original
   * @param requiresInferenceProfile Se o modelo requer inference profile
   * @param region Região AWS
   * @returns Variação principal
   */
  async generatePrimary(
    originalModelId: string,
    requiresInferenceProfile: boolean,
    region: string
  ): Promise<ModelIdVariation> {
    const variations = await this.generate(originalModelId, requiresInferenceProfile, region);
    return variations[0];
  }

  /**
   * Valida se uma variação é válida
   * 
   * @param variation Variação a validar
   * @returns true se a variação é válida
   */
  isValidVariation(variation: ModelIdVariation): boolean {
    return (
      variation.modelId.length > 0 &&
      variation.priority > 0 &&
      ['inference_profile', 'normalized', 'legacy'].includes(variation.type)
    );
  }
}
