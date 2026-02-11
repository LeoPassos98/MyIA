// backend/src/services/providers/provider-filter.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { modelCacheService } from '../models/modelCacheService';
import { Provider, Model } from '../../types/providers';

/**
 * Service para filtragem de providers configurados pelo usuário
 * Responsabilidade: Buscar e filtrar providers baseado em configurações do usuário
 * 
 * Refatorado para Clean Slate v2:
 * - Usa prisma.provider (schema v2) em vez de prisma.aIProvider
 * - Usa modelCacheService para obter deployments
 * - Remove dependência de providerCredentialValidation (não existe no schema v2)
 * - Filtra deployments por provider
 */
export class ProviderFilterService {
  /**
   * Busca providers configurados para o usuário
   * - Busca configurações do usuário
   * - Busca providers ativos do banco (schema v2)
   * - Agrupa deployments por provider
   * - Filtra por configuração do usuário (AWS)
   * 
   * Refatorado para Clean Slate v2:
   * - Usa Provider do schema v2
   * - Usa ModelDeployment em vez de AIModel
   * - Remove dependência de providerCredentialValidation
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição (para logging)
   * @returns Lista de providers configurados com seus modelos
   */
  async getConfiguredProviders(userId: string, requestId?: string): Promise<Provider[]> {
    logger.debug('Buscando providers configurados', {
      requestId,
      userId
    });

    // 1. Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // 2. Buscar todos os providers ativos (schema v2)
    const allProviders = await prisma.provider.findMany({
      where: { isActive: true }
    });

    // 3. Buscar deployments ativos do cache
    const deployments = await modelCacheService.getAllActiveDeployments(true, true);

    logger.debug('Providers e deployments encontrados', {
      requestId,
      totalProviders: allProviders.length,
      totalDeployments: deployments.length,
      awsEnabledModels: settings?.awsEnabledModels?.length || 0
    });

    // 4. Agrupar deployments por provider
    const providerDeploymentsMap = new Map<string, typeof deployments>();
    for (const deployment of deployments) {
      const providerId = deployment.providerId;
      if (!providerDeploymentsMap.has(providerId)) {
        providerDeploymentsMap.set(providerId, []);
      }
      providerDeploymentsMap.get(providerId)!.push(deployment);
    }

    // 5. Construir lista de providers com modelos
    const configuredProviders: Provider[] = [];

    for (const provider of allProviders) {
      const providerDeployments = providerDeploymentsMap.get(provider.id) || [];
      
      // Filtrar providers baseado em configuração
      if (provider.slug === 'bedrock') {
        // AWS Bedrock: filtrar por modelos habilitados pelo usuário
        const filteredDeployments = this.filterAWSDeployments(
          providerDeployments,
          settings?.awsEnabledModels || [],
          requestId
        );

        if (filteredDeployments.length === 0) {
          logger.debug('Bedrock excluído: sem modelos habilitados', {
            requestId,
            enabledModelsCount: settings?.awsEnabledModels?.length || 0
          });
          continue;
        }

        configuredProviders.push({
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          isActive: provider.isActive,
          models: this.deploymentsToModels(filteredDeployments)
        });
      } else {
        // Outros providers: incluir todos os deployments
        if (providerDeployments.length > 0) {
          configuredProviders.push({
            id: provider.id,
            name: provider.name,
            slug: provider.slug,
            isActive: provider.isActive,
            models: this.deploymentsToModels(providerDeployments)
          });
        }
      }
    }

    logger.debug('Providers configurados', {
      requestId,
      totalConfigured: configuredProviders.length,
      providerSlugs: configuredProviders.map(p => p.slug)
    });

    return configuredProviders;
  }

  /**
   * Filtra deployments AWS baseado em modelos habilitados pelo usuário
   * 
   * @param deployments - Deployments do provider AWS
   * @param enabledModelIds - IDs de modelos habilitados pelo usuário
   * @param requestId - ID da requisição
   * @returns Deployments filtrados
   */
  private filterAWSDeployments(
    deployments: Awaited<ReturnType<typeof modelCacheService.getAllActiveDeployments>>,
    enabledModelIds: string[],
    requestId?: string
  ): typeof deployments {
    if (enabledModelIds.length === 0) {
      return [];
    }

    const enabledSet = new Set(enabledModelIds);
    const filtered = deployments.filter(d => enabledSet.has(d.deploymentId));

    logger.debug('Deployments AWS filtrados', {
      requestId,
      totalDeployments: deployments.length,
      enabledModels: enabledModelIds.length,
      filteredDeployments: filtered.length
    });

    return filtered;
  }

  /**
   * Converte deployments para formato Model (compatibilidade com interface antiga)
   * 
   * @param deployments - Deployments do cache
   * @returns Lista de modelos no formato antigo
   */
  private deploymentsToModels(
    deployments: Awaited<ReturnType<typeof modelCacheService.getAllActiveDeployments>>
  ): Model[] {
    return deployments.map(deployment => {
      // Extrair contextWindow das capabilities do BaseModel
      const capabilities = deployment.baseModel?.capabilities as {
        maxContextWindow?: number;
      } | undefined;

      // Converter custos de 1M tokens para 1k tokens (compatibilidade)
      const costPer1kInput = deployment.costPer1MInput / 1000;
      const costPer1kOutput = deployment.costPer1MOutput / 1000;

      return {
        id: deployment.id,
        name: deployment.baseModel?.name || deployment.deploymentId,
        apiModelId: deployment.deploymentId,
        contextWindow: capabilities?.maxContextWindow || 0,
        costPer1kInput,
        costPer1kOutput,
        isActive: deployment.isActive,
        providerId: deployment.providerId,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt
      };
    });
  }

  /**
   * Busca um provider específico por slug
   * 
   * @param slug - Slug do provider (ex: 'bedrock', 'openai')
   * @param requestId - ID da requisição
   * @returns Provider encontrado ou null
   */
  async getProviderBySlug(slug: string, requestId?: string) {
    logger.debug('Buscando provider por slug', {
      requestId,
      slug
    });

    const provider = await prisma.provider.findUnique({
      where: { slug }
    });

    if (!provider) {
      logger.warn('Provider não encontrado', {
        requestId,
        slug
      });
    }

    return provider;
  }

  /**
   * Lista todos os providers ativos
   * 
   * @param requestId - ID da requisição
   * @returns Lista de providers ativos
   */
  async getAllActiveProviders(requestId?: string) {
    logger.debug('Buscando todos os providers ativos', {
      requestId
    });

    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    logger.debug('Providers ativos encontrados', {
      requestId,
      count: providers.length
    });

    return providers;
  }
}
