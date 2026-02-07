// backend/src/services/providers/vendor-aggregation.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { prisma } from '../../lib/prisma';
import { ModelRegistry } from '../ai/registry';
import logger from '../../utils/logger';
import { ProviderFilterService } from './provider-filter.service';
import { ModelParser } from './utils/model-parser';
import { VendorMapper } from './utils/vendor-mapper';
import { VendorGroup, CertificationInfo } from '../../types/vendors';
import { Provider } from '../../types/providers';

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
   * @param providers - Lista de providers
   * @param requestId - ID da requisição
   * @returns Map de vendors
   */
  private async groupModelsByVendor(
    providers: Provider[],
    requestId?: string
  ): Promise<Map<string, VendorGroup>> {
    const vendorMap = new Map<string, VendorGroup>();

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
        
        // Buscar metadata do registry
        const registryMetadata = ModelRegistry.getModel(model.apiModelId);
        
        if (!existingModel) {
          existingModel = {
            id: model.id,
            name: model.name,
            apiModelId: model.apiModelId,
            contextWindow: model.contextWindow,
            maxOutputTokens: registryMetadata?.capabilities.maxOutputTokens,
            version: this.modelParser.extractVersion(model.apiModelId),
            availableOn: [],
            capabilities: registryMetadata ? {
              supportsVision: registryMetadata.capabilities.vision,
              supportsPromptCache: false, // TODO: adicionar ao registry
              supportsFunctionCalling: registryMetadata.capabilities.functionCalling
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
        
        const hasRegistry = !!registryMetadata;
        
        // Adicionar provider availability
        existingModel.availableOn.push({
          providerSlug: provider.slug,
          providerName: provider.name,
          isConfigured: true,
          hasRegistry,
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
   * @param modelId - ID do modelo
   * @param providerSlug - Slug do provider
   * @param requestId - ID da requisição
   * @returns Informações de certificação ou null
   */
  private async getCertificationForModel(
    modelId: string,
    _providerSlug: string,
    requestId?: string
  ): Promise<CertificationInfo | null> {
    try {
      const cert = await prisma.modelCertification.findFirst({
        where: { modelId: modelId },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!cert) {
        logger.debug('Certificação não encontrada', {
          requestId,
          modelId
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
        modelId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}
