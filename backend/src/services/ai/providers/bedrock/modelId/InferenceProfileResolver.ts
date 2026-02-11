// backend/src/services/ai/providers/bedrock/modelId/InferenceProfileResolver.ts

import logger from '../../../../../utils/logger';
import { ModelIdNormalizer } from './ModelIdNormalizer';

/**
 * Prefixos regionais para inference profiles
 */
export type RegionPrefix = 'us' | 'eu' | 'apac';

/**
 * Resolve inference profile IDs para modelos AWS Bedrock
 * 
 * AWS usa prefixos regionais específicos:
 * - us-east-1, us-west-2 → 'us'
 * - eu-central-1, eu-west-1 → 'eu'
 * - ap-southeast-1, ap-northeast-1 → 'apac' (não 'ap'!)
 * 
 * @example
 * ```typescript
 * const resolver = new InferenceProfileResolver(normalizer);
 * 
 * // Modelo que requer inference profile
 * const profileId = await resolver.resolve(
 *   'anthropic.claude-3-5-sonnet-20241022-v2:0',
 *   'us-east-1'
 * );
 * // → 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
 * 
 * // Modelo que já tem prefixo
 * const existing = await resolver.resolve(
 *   'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
 *   'us-east-1'
 * );
 * // → 'us.anthropic.claude-3-5-sonnet-20241022-v2:0' (sem mudança)
 * ```
 */
export class InferenceProfileResolver {
  constructor(private readonly normalizer: ModelIdNormalizer) {}

  /**
   * Resolve inference profile ID para um modelo
   * 
   * @param modelId ID do modelo (pode conter sufixo)
   * @param region Região AWS (ex: 'us-east-1')
   * @returns Inference Profile ID ou modelId original
   */
  async resolve(modelId: string, region: string): Promise<string> {
    // Normalizar antes de processar
    const baseModelId = this.normalizer.normalize(modelId);
    
    // Se já tem prefixo de região, retornar como está
    if (this.hasRegionalPrefix(baseModelId)) {
      logger.info(`🔍 [InferenceProfileResolver] Model already has regional prefix: ${baseModelId}`);
      return baseModelId;
    }
    
    // Verificar se modelo requer Inference Profile
    const requiresProfile = await this.requiresInferenceProfile(baseModelId);
    
    if (!requiresProfile) {
      logger.info(`🔍 [InferenceProfileResolver] No inference profile needed for: ${baseModelId}`);
      return baseModelId;
    }
    
    // Adicionar prefixo regional
    const regionPrefix = this.getRegionPrefix(region);
    const inferenceProfileId = `${regionPrefix}.${baseModelId}`;
    
    logger.info(`🔄 [InferenceProfileResolver] Using Inference Profile: ${inferenceProfileId} (region: ${region})`);
    return inferenceProfileId;
  }

  /**
   * Verifica se um model ID já tem prefixo regional
   */
  hasRegionalPrefix(modelId: string): boolean {
    return modelId.startsWith('us.') || 
           modelId.startsWith('eu.') || 
           modelId.startsWith('apac.');
  }

  /**
   * Extrai prefixo regional para inference profile
   * 
   * @param region Região AWS (ex: 'us-east-1')
   * @returns Prefixo regional (ex: 'us', 'eu', 'apac')
   */
  getRegionPrefix(region: string): RegionPrefix {
    // Tratamento especial para regiões APAC
    if (region.startsWith('ap-')) {
      return 'apac';
    }
    
    // Outras regiões: extrair primeiro segmento
    const prefix = region.split('-')[0];
    
    // Validar prefixo conhecido
    if (prefix === 'us' || prefix === 'eu') {
      return prefix;
    }
    
    // Fallback para 'us' se região desconhecida
    logger.warn(`⚠️ [InferenceProfileResolver] Unknown region prefix: ${prefix}, using 'us' as fallback`);
    return 'us';
  }

  /**
   * Verifica se um modelo requer Inference Profile
   *
   * Schema v2: ModelRegistry foi removido
   * Esta verificação agora é feita pelo BedrockProvider usando deploymentService
   * Este método é mantido para compatibilidade, mas sempre retorna false
   * A lógica real está em BedrockProvider.checkRequiresInferenceProfile()
   */
  private async requiresInferenceProfile(modelId: string): Promise<boolean> {
    // Schema v2: ModelRegistry foi removido
    // A verificação de inference profile agora é feita pelo BedrockProvider
    // usando deploymentService.findByDeploymentId() e verificando inferenceType
    logger.debug(`[InferenceProfileResolver] requiresInferenceProfile called for ${modelId} - delegating to caller`);
    
    // Retornar false - a lógica real está em BedrockProvider
    // Este método é chamado apenas quando o modelo não foi encontrado no banco
    return false;
  }

  /**
   * Remove prefixo regional de um inference profile ID
   * 
   * @param inferenceProfileId Inference Profile ID (ex: 'us.model-id')
   * @returns Model ID sem prefixo (ex: 'model-id')
   */
  removeRegionalPrefix(inferenceProfileId: string): string {
    return inferenceProfileId.replace(/^(us|eu|apac)\./, '');
  }
}
