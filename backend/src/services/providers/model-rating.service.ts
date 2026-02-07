// backend/src/services/providers/model-rating.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import logger from '../../utils/logger';
import { ProviderFilterService } from './provider-filter.service';
import { Provider, ModelWithRating } from '../../types/providers';

/**
 * Service para listagem de modelos com rating
 * Responsabilidade: Retornar modelos em formato flat com informações de rating
 */
export class ModelRatingService {
  private providerFilter: ProviderFilterService;

  constructor(providerFilter?: ProviderFilterService) {
    this.providerFilter = providerFilter || new ProviderFilterService();
  }

  /**
   * Retorna todos os modelos configurados com rating
   * - Busca providers configurados
   * - Converte para formato flat
   * - Enriquece com certificações e rating
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

    // 1. Buscar providers configurados
    const providers = await this.providerFilter.getConfiguredProviders(userId, requestId);

    logger.debug('Providers configurados obtidos', {
      requestId,
      totalProviders: providers.length
    });

    // 2. Converter para formato flat com rating
    const modelsWithRating = await this.flattenAndEnrichProviders(providers, requestId);

    logger.info('Modelos com rating obtidos', {
      requestId,
      userId,
      totalModels: modelsWithRating.length,
      withRating: modelsWithRating.filter(m => m.rating !== undefined).length
    });

    return modelsWithRating;
  }

  /**
   * Converte providers para formato flat e enriquece com rating
   * 
   * @param providers - Lista de providers
   * @param requestId - ID da requisição
   * @returns Lista de modelos flat com rating
   */
  private async flattenAndEnrichProviders(
    providers: Provider[],
    requestId?: string
  ): Promise<ModelWithRating[]> {
    const modelsWithRating: ModelWithRating[] = [];

    for (const provider of providers) {
      for (const model of provider.models) {
        // Buscar certificação do modelo
        const cert = await prisma.modelCertification.findFirst({
          where: { modelId: model.apiModelId },
          orderBy: { createdAt: 'desc' }
        });

        logger.debug('Processando modelo', {
          requestId,
          modelId: model.apiModelId,
          provider: provider.slug,
          hasCertification: !!cert
        });

        modelsWithRating.push({
          id: model.id,
          name: model.name,
          apiModelId: model.apiModelId,
          provider: provider.slug,
          providerName: provider.name,
          isAvailable: true,
          contextWindow: model.contextWindow,
          capabilities: [],
          // Campos de rating
          rating: cert?.rating ?? undefined,
          badge: cert?.badge ?? undefined,
          metrics: (cert?.metrics as Record<string, unknown>) ?? undefined,
          scores: (cert?.scores as Record<string, unknown>) ?? undefined,
          ratingUpdatedAt: cert?.ratingUpdatedAt?.toISOString() ?? undefined
        });
      }
    }

    return modelsWithRating;
  }
}
