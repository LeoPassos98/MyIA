// backend/src/services/ai/adapters/adapter-params.service.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * @file adapter-params.service.ts
 * @description Serviço para buscar parâmetros e capabilities de modelos do banco de dados
 * @module services/ai/adapters
 * 
 * CRIADO: Para resolver dependências circulares entre adapter-factory.ts e os adapters
 * 
 * Este serviço contém a lógica de busca de parâmetros que antes estava em AdapterFactory,
 * permitindo que os adapters importem este serviço sem criar dependência circular.
 */

import { InferenceType } from '../types';
import { logger } from '../../../utils/logger';
import { modelCacheService } from '../../models';
import { prisma } from '../../../lib/prisma';

/**
 * Tipo para parâmetros recomendados de modelo
 */
export interface RecommendedParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Tipo para capabilities de modelo
 */
export interface ModelCapabilities {
  streaming?: boolean;
  vision?: boolean;
  functionCalling?: boolean;
  maxContextWindow?: number;
  maxOutputTokens?: number;
}

/**
 * Tipo para informações de deployment
 */
export interface DeploymentInfo {
  id: string;
  deploymentId: string;
  inferenceType: InferenceType;
  baseModel: {
    id: string;
    name: string;
    vendor: string;
    capabilities: Record<string, unknown>;
    defaultParams: Record<string, unknown> | null;
  };
  provider: {
    id: string;
    slug: string;
  };
}

/**
 * Serviço para buscar parâmetros e capabilities de modelos
 * 
 * Este serviço é independente dos adapters e pode ser importado por eles
 * sem criar dependência circular.
 */
export class AdapterParamsService {
  /**
   * Busca informações de deployment do banco de dados
   * 
   * Este método busca o deployment pelo deploymentId (string do provider)
   * e retorna informações completas incluindo baseModel e capabilities.
   * 
   * @param deploymentId - ID do deployment no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
   * @returns Deployment com baseModel ou null se não encontrado
   */
  async getDeploymentInfo(deploymentId: string): Promise<DeploymentInfo | null> {
    // Buscar provider padrão (bedrock)
    const provider = await prisma.provider.findUnique({
      where: { slug: 'bedrock' }
    });

    if (!provider) {
      logger.warn('[AdapterParamsService] Default provider (bedrock) not found');
      return null;
    }

    // Buscar deployment do cache ou banco usando modelCacheService
    const deployment = await modelCacheService.getDeploymentByDeploymentId(
      provider.id,
      deploymentId,
      true, // includeBaseModel
      true, // includeProvider
      false // includeCertifications
    );

    if (!deployment) {
      logger.debug('[AdapterParamsService] Deployment not found in database', { deploymentId });
      return null;
    }

    // Formatar resultado
    const result: DeploymentInfo = {
      id: deployment.id,
      deploymentId: deployment.deploymentId,
      inferenceType: deployment.inferenceType as InferenceType,
      baseModel: {
        id: deployment.baseModel.id,
        name: deployment.baseModel.name,
        vendor: deployment.baseModel.vendor,
        capabilities: deployment.baseModel.capabilities as Record<string, unknown>,
        defaultParams: deployment.baseModel.defaultParams as Record<string, unknown> | null,
      },
      provider: {
        id: deployment.provider.id,
        slug: deployment.provider.slug,
      },
    };

    logger.info('[AdapterParamsService] Deployment loaded from database', {
      deploymentId,
      baseModelName: result.baseModel.name,
      vendor: result.baseModel.vendor,
    });

    return result;
  }

  /**
   * Busca parâmetros recomendados para um modelo
   *
   * Prioridade:
   * 1. Banco de dados (deployment.baseModel.defaultParams)
   * 2. Valores hardcoded padrão por vendor
   *
   * @param modelId - ID do modelo (deploymentId)
   * @param vendor - Vendor do modelo (opcional, para fallback)
   * @returns Parâmetros recomendados
   */
  async getRecommendedParams(modelId: string, vendor?: string): Promise<RecommendedParams> {
    // 1. Tentar buscar do banco
    const deployment = await this.getDeploymentInfo(modelId);
    if (deployment?.baseModel.defaultParams) {
      logger.debug('[AdapterParamsService] Using params from database', { modelId });
      return deployment.baseModel.defaultParams as RecommendedParams;
    }

    // 2. Valores padrão hardcoded por vendor
    const detectedVendor = vendor || this.detectVendorFromModelId(modelId);
    logger.debug('[AdapterParamsService] Using default hardcoded params', { modelId, vendor: detectedVendor });
    
    // Valores padrão específicos por vendor
    switch (detectedVendor?.toLowerCase()) {
      case 'anthropic':
        return {
          temperature: 1.0,
          topP: 0.999,
          maxTokens: 4096,
        };
      case 'cohere':
        return {
          temperature: 0.3,
          topP: 0.75,
          maxTokens: 2048,
        };
      case 'amazon':
      default:
        return {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 2048,
        };
    }
  }

  /**
   * Busca capabilities de um modelo
   *
   * Prioridade:
   * 1. Banco de dados (deployment.baseModel.capabilities)
   * 2. Valores padrão hardcoded
   *
   * @param modelId - ID do modelo (deploymentId)
   * @returns Capabilities do modelo ou null se não encontrado
   */
  async getModelCapabilities(modelId: string): Promise<ModelCapabilities | null> {
    // 1. Tentar buscar do banco
    const deployment = await this.getDeploymentInfo(modelId);
    if (deployment?.baseModel.capabilities) {
      logger.debug('[AdapterParamsService] Using capabilities from database', { modelId });
      return deployment.baseModel.capabilities as ModelCapabilities;
    }

    // 2. Valores padrão hardcoded (capabilities básicas)
    logger.debug('[AdapterParamsService] Using default hardcoded capabilities', { modelId });
    return {
      streaming: true,
      vision: false,
      functionCalling: false,
      maxContextWindow: 128000,
      maxOutputTokens: 4096,
    };
  }

  /**
   * Verifica se um modelo requer Inference Profile
   *
   * @param modelId - ID do modelo
   * @returns true se requer Inference Profile
   */
  async requiresInferenceProfile(modelId: string): Promise<boolean> {
    // 1. Verificar formato do modelId primeiro (mais rápido)
    if (/^(us|eu|apac)\.[a-z]+\./i.test(modelId)) {
      return true;
    }

    // 2. Verificar padrão de modelo (Claude 4.x requer Inference Profile)
    if (/anthropic\.claude-(sonnet|opus|haiku)-4/i.test(modelId)) {
      return true;
    }

    // 3. Buscar do banco
    const deployment = await this.getDeploymentInfo(modelId);
    if (deployment) {
      return deployment.inferenceType === 'INFERENCE_PROFILE';
    }

    // 4. Default: não requer
    return false;
  }

  /**
   * Detecta vendor a partir do modelId
   * 
   * @param modelId - ID do modelo
   * @returns Vendor detectado ou null
   */
  private detectVendorFromModelId(modelId: string): string | null {
    // Inference Profile format: {region}.{vendor}.{model}
    const inferenceProfileMatch = modelId.match(/^(us|eu|apac)\.([a-z]+)\./i);
    if (inferenceProfileMatch) {
      return inferenceProfileMatch[2].toLowerCase();
    }

    // Standard format: {vendor}.{model}
    const prefix = modelId.split('.')[0].toLowerCase();
    const knownVendors = ['anthropic', 'cohere', 'amazon', 'ai21', 'meta', 'mistral'];
    
    if (knownVendors.includes(prefix)) {
      return prefix;
    }

    // Direct API format
    if (modelId.startsWith('claude-')) {
      return 'anthropic';
    }
    
    if (modelId.startsWith('command-')) {
      return 'cohere';
    }

    return null;
  }
}

/**
 * Instância singleton do serviço
 */
export const adapterParamsService = new AdapterParamsService();
