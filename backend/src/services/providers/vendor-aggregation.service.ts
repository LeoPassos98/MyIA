// backend/src/services/providers/vendor-aggregation.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import logger from '../../utils/logger';
import { VendorGroup, CertificationInfo } from '../../types/vendors';
import { Provider } from '../../types/providers';
import { modelCacheService } from '../models/modelCacheService';
import { ProviderFilterService } from './provider-filter.service';
import { ModelParser } from './utils/model-parser';
import { VendorMapper } from './utils/vendor-mapper';

/**
 * Service para agrupamento de modelos por vendor
 * Responsabilidade: Agrupar modelos por vendor com multi-provider support
 */
export class VendorAggregationService {
  private providerFilter: ProviderFilterService;
  private modelParser: ModelParser;
  private vendorMapper: VendorMapper;

  constructor(
    providerFilter?: ProviderFilterService,
    modelParser?: ModelParser,
    vendorMapper?: VendorMapper
  ) {
    this.providerFilter = providerFilter || new ProviderFilterService();
    this.modelParser = modelParser || new ModelParser();
    this.vendorMapper = vendorMapper || new VendorMapper();
  }

  /**
   * Retorna modelos agrupados por vendor
   * - Busca providers configurados
   * - Agrupa modelos por vendor
   * - Enriquece com certificações
   * - Enriquece com metadata do registry
   * 
   * @param userId - ID do usuário
   * @param requestId - ID da requisição (para logging)
   * @returns Lista de vendors com modelos
   */
  async getVendorsWithModels(
    userId: string,
    requestId?: string
  ): Promise<VendorGroup[]> {
    logger.info('Iniciando busca de vendors', {
      requestId,
      userId
    });

    // 1. Buscar providers configurados
    const providers = await this.providerFilter.getConfiguredProviders(userId, requestId);

    logger.debug('Providers configurados obtidos', {
      requestId,
      totalProviders: providers.length,
      providerSlugs: providers.map(p => p.slug)
    });

    // 2. Agrupar modelos por vendor
    const vendorMap = await this.groupModelsByVendor(providers, requestId);

    // 3. Enriquece com certificações
    await this.enrichWithCertifications(vendorMap, requestId);

    // 4. Converter Map para Array e ordenar
    const vendors = Array.from(vendorMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    logger.info('Vendors obtidos com sucesso', {
      requestId,
      userId,
      totalVendors: vendors.length,
      totalProviders: providers.length,
      vendorNames: vendors.map(v => v.name)
    });

    return vendors;
  }

  /**
   * Agrupa modelos por vendor
   *
   * Clean Slate v2:
   * - Usa modelCacheService para buscar metadados dos deployments
   *
   * @param providers - Lista de providers
   * @param requestId - ID da requisição
   * @returns Map de vendors
   */
  private async groupModelsByVendor(
    providers: Provider[],
    requestId?: string
  ): Promise<Map<string, VendorGroup>> {
    const vendorMap = new Map<string, VendorGroup>();
    
    // Buscar deployments do cache para metadados
    const cachedDeployments = await modelCacheService.getAllActiveDeployments(true, true);
    const deploymentsMap = new Map(
      cachedDeployments.map(d => [d.deploymentId, d])
    );

    for (const provider of providers) {
      for (const model of provider.models) {
        // Extrair vendor do apiModelId
        const vendor = this.modelParser.extractVendor(model.apiModelId);
        
        // Criar vendor group se não existir
        if (!vendorMap.has(vendor)) {
          vendorMap.set(vendor, {
            id: vendor,
            name: this.vendorMapper.getVendorName(vendor),
            slug: vendor,
            logo: this.vendorMapper.getVendorLogo(vendor),
            models: []
          });
        }
        
        const vendorGroup = vendorMap.get(vendor)!;
        
        // Verificar se modelo já existe no grupo
        let existingModel = vendorGroup.models.find(m => m.apiModelId === model.apiModelId);
        
        // Buscar metadata do cache de deployments (Clean Slate v2)
        const deployment = deploymentsMap.get(model.apiModelId);
        const baseModelCapabilities = deployment?.baseModel?.capabilities as {
          maxContextWindow?: number;
          maxOutputTokens?: number;
          vision?: boolean;
          functionCalling?: boolean;
        } | undefined;
        
        if (!existingModel) {
          existingModel = {
            id: model.id,
            name: model.name,
            apiModelId: model.apiModelId,
            contextWindow: model.contextWindow,
            maxOutputTokens: baseModelCapabilities?.maxOutputTokens,
            version: this.modelParser.extractVersion(model.apiModelId),
            availableOn: [],
            capabilities: baseModelCapabilities ? {
              supportsVision: baseModelCapabilities.vision,
              supportsPromptCache: false,
              supportsFunctionCalling: baseModelCapabilities.functionCalling
            } : undefined,
            pricing: {
              inputPer1M: model.costPer1kInput * 1000,
              outputPer1M: model.costPer1kOutput * 1000,
              cacheReadPer1M: undefined,
              cacheWritePer1M: undefined
            }
          };
          vendorGroup.models.push(existingModel);
        }
        
        // Buscar certificação do modelo
        const certification = await this.getCertificationForModel(
          model.apiModelId,
          provider.slug,
          requestId
        );
        
        const isInDatabase = !!deployment;
        
        // Adicionar provider availability
        existingModel.availableOn.push({
          providerSlug: provider.slug,
          providerName: provider.name,
          isConfigured: true,
          hasRegistry: isInDatabase,  // Agora indica se está no banco
          certification
        });
      }
    }

    logger.debug('Modelos agrupados por vendor', {
      requestId,
      totalVendors: vendorMap.size,
      vendors: Array.from(vendorMap.keys())
    });

    return vendorMap;
  }

  /**
   * Enriquece vendor groups com certificações
   * (Placeholder para futuras otimizações)
   * 
   * @param vendorGroups - Map de vendor groups
   * @param requestId - ID da requisição
   */
  private async enrichWithCertifications(
    vendorGroups: Map<string, VendorGroup>,
    requestId?: string
  ): Promise<void> {
    // Certificações já são buscadas em groupModelsByVendor
    // Este método existe para futuras otimizações (batch queries)
    logger.debug('Certificações já enriquecidas', {
      requestId,
      totalVendors: vendorGroups.size
    });
  }

  /**
   * Busca certificação do modelo em um provider específico
   *
   * Clean Slate v2:
   * - Busca deployment pelo deploymentId (string do provider)
   * - Busca certificação pelo UUID do deployment
   *
   * @param apiModelId - ID do modelo no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
   * @param _providerSlug - Slug do provider (não usado atualmente)
   * @param requestId - ID da requisição
   * @returns Informações de certificação ou null
   */
  private async getCertificationForModel(
    apiModelId: string,
    _providerSlug: string,
    requestId?: string
  ): Promise<CertificationInfo | null> {
    try {
      // Buscar deployment pelo deploymentId (string do provider)
      const deployment = await prisma.modelDeployment.findFirst({
        where: { deploymentId: apiModelId }
      });
      
      if (!deployment) {
        logger.debug('Deployment não encontrado para certificação', {
          requestId,
          apiModelId
        });
        return null;
      }
      
      // Buscar certificação pelo UUID do deployment
      const cert = await prisma.modelCertification.findFirst({
        where: { deploymentId: deployment.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!cert) {
        logger.debug('Certificação não encontrada', {
          requestId,
          apiModelId,
          deploymentId: deployment.id
        });
        return null;
      }
      
      return {
        status: cert.status,
        successRate: cert.successRate,
        lastChecked: cert.createdAt.toISOString(),
        rating: cert.rating ?? undefined,
        badge: cert.badge ?? undefined,
        metrics: (cert.metrics as Record<string, unknown>) ?? undefined,
        scores: (cert.scores as Record<string, unknown>) ?? undefined,
        ratingUpdatedAt: cert.ratingUpdatedAt?.toISOString() ?? undefined
      };
    } catch (error) {
      logger.warn('Erro ao buscar certificação', {
        requestId,
        apiModelId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}
