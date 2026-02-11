// backend/src/services/providers/model-rating.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { modelCacheService } from '../models/modelCacheService';
import { ModelWithRating } from '../../types/providers';
import { ProviderFilterService } from './provider-filter.service';

/**
 * Service para listagem de modelos com rating
 * Responsabilidade: Retornar modelos em formato flat com informações de rating
 * 
 * Refatorado para Clean Slate v2:
 * - Usa modelCacheService.getAllActiveDeployments() como fonte primária
 * - Busca certificação por deploymentId (FK) em vez de modelId (string)
 * - Mantém compatibilidade com interface ModelWithRating
 */
export class ModelRatingService {
  // Mantido para compatibilidade com código existente que pode injetar o service
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_providerFilter?: ProviderFilterService) {
    // ProviderFilterService não é mais usado diretamente
    // Agora usamos modelCacheService.getAllActiveDeployments()
  }

  /**
   * Retorna todos os modelos configurados com rating
   * - Busca deployments ativos do cache
   * - Converte para formato flat
   * - Enriquece com certificações e rating
   * 
   * Refatorado para Clean Slate v2:
   * - Usa deployments do banco em vez de providers configurados
   * - Busca certificação por deploymentId (UUID) em vez de modelId (string)
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição (para logging)
   * @returns Lista de modelos com rating
   */
  async getModelsWithRating(
    userId: string,
    requestId?: string
  ): Promise<ModelWithRating[]> {
    logger.info('Iniciando busca de modelos com rating', {
      requestId,
      userId
    });

    // 1. Buscar deployments ativos do cache (Clean Slate v2)
    const deployments = await modelCacheService.getAllActiveDeployments(true, true);

    logger.debug('Deployments ativos obtidos', {
      requestId,
      totalDeployments: deployments.length
    });

    // 2. Converter para formato flat com rating
    const modelsWithRating = await this.flattenAndEnrichDeployments(deployments, requestId);

    logger.info('Modelos com rating obtidos', {
      requestId,
      userId,
      totalModels: modelsWithRating.length,
      withRating: modelsWithRating.filter(m => m.rating !== undefined).length
    });

    return modelsWithRating;
  }

  /**
   * Converte deployments para formato flat e enriquece com rating
   * 
   * Refatorado para Clean Slate v2:
   * - Usa ModelDeployment com BaseModel e Provider
   * - Busca certificação por deploymentId (UUID)
   * 
   * @param deployments - Lista de deployments do cache
   * @param requestId - ID da requisição
   * @returns Lista de modelos flat com rating
   */
  private async flattenAndEnrichDeployments(
    deployments: Awaited<ReturnType<typeof modelCacheService.getAllActiveDeployments>>,
    requestId?: string
  ): Promise<ModelWithRating[]> {
    const modelsWithRating: ModelWithRating[] = [];

    for (const deployment of deployments) {
      // Buscar certificação do deployment por deploymentId (Clean Slate v2)
      // No schema v2, ModelCertification tem FK para deploymentId, não modelId string
      const cert = await prisma.modelCertification.findFirst({
        where: { deploymentId: deployment.id },
        orderBy: { createdAt: 'desc' }
      });

      logger.debug('Processando deployment', {
        requestId,
        deploymentId: deployment.deploymentId,
        internalId: deployment.id,
        provider: deployment.provider?.slug,
        hasCertification: !!cert
      });

      // Extrair capabilities do BaseModel
      const capabilities = deployment.baseModel?.capabilities as {
        streaming?: boolean;
        vision?: boolean;
        functionCalling?: boolean;
        maxContextWindow?: number;
      } | undefined;

      // Construir lista de capabilities como strings
      const capabilitiesList: string[] = [];
      if (capabilities?.streaming) capabilitiesList.push('streaming');
      if (capabilities?.vision) capabilitiesList.push('vision');
      if (capabilities?.functionCalling) capabilitiesList.push('functionCalling');

      modelsWithRating.push({
        id: deployment.id,
        name: deployment.baseModel?.name || deployment.deploymentId,
        apiModelId: deployment.deploymentId,
        provider: deployment.provider?.slug || 'unknown',
        providerName: deployment.provider?.name || 'Unknown Provider',
        isAvailable: deployment.isActive,
        contextWindow: capabilities?.maxContextWindow || 0,
        capabilities: capabilitiesList,
        // Campos de rating do schema v2
        rating: cert?.rating ?? undefined,
        badge: cert?.badge ?? undefined,
        metrics: (cert?.metrics as Record<string, unknown>) ?? undefined,
        scores: (cert?.scores as Record<string, unknown>) ?? undefined,
        ratingUpdatedAt: cert?.ratingUpdatedAt?.toISOString() ?? undefined
      });
    }

    return modelsWithRating;
  }

  /**
   * Busca modelos com rating filtrados por provider
   * 
   * @param userId - ID do usuário
   * @param providerSlug - Slug do provider (ex: 'bedrock', 'openai')
   * @param requestId - ID da requisição
   * @returns Lista de modelos com rating do provider
   */
  async getModelsWithRatingByProvider(
    userId: string,
    providerSlug: string,
    requestId?: string
  ): Promise<ModelWithRating[]> {
    logger.info('Buscando modelos com rating por provider', {
      requestId,
      userId,
      providerSlug
    });

    const allModels = await this.getModelsWithRating(userId, requestId);
    
    const filteredModels = allModels.filter(m => m.provider === providerSlug);

    logger.debug('Modelos filtrados por provider', {
      requestId,
      providerSlug,
      totalModels: allModels.length,
      filteredModels: filteredModels.length
    });

    return filteredModels;
  }

  /**
   * Busca modelos com rating ordenados por rating (melhores primeiro)
   * 
   * @param userId - ID do usuário
   * @param limit - Limite de resultados (padrão: 10)
   * @param requestId - ID da requisição
   * @returns Lista de modelos com rating ordenados
   */
  async getTopRatedModels(
    userId: string,
    limit: number = 10,
    requestId?: string
  ): Promise<ModelWithRating[]> {
    logger.info('Buscando top modelos por rating', {
      requestId,
      userId,
      limit
    });

    const allModels = await this.getModelsWithRating(userId, requestId);
    
    // Filtrar apenas modelos com rating e ordenar
    const ratedModels = allModels
      .filter(m => m.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    logger.debug('Top modelos por rating', {
      requestId,
      totalWithRating: allModels.filter(m => m.rating !== undefined).length,
      returned: ratedModels.length
    });

    return ratedModels;
  }
}
