// backend/src/services/models/deploymentService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma, InferenceType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Re-export do enum InferenceType do Prisma para uso externo
 */
export { InferenceType } from '@prisma/client';

/**
 * Configuração específica do provider
 * Estrutura esperada conforme schema-v2.prisma
 */
export interface ProviderConfig {
  arn?: string;
  profileFormat?: string;
  region?: string;
  [key: string]: unknown;
}

/**
 * Parâmetros customizados do deployment
 */
export interface CustomParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

/**
 * Dados para criação de um ModelDeployment
 */
export interface CreateDeploymentData {
  baseModelId: string;
  providerId: string;
  deploymentId: string;
  inferenceType?: InferenceType;
  providerConfig?: ProviderConfig;
  costPer1MInput: number;
  costPer1MOutput: number;
  costPerHour?: number;
  customParams?: CustomParams;
  isActive?: boolean;
}

/**
 * Dados para atualização de um ModelDeployment
 */
export interface UpdateDeploymentData {
  baseModelId?: string;
  providerId?: string;
  deploymentId?: string;
  inferenceType?: InferenceType;
  providerConfig?: ProviderConfig | null;
  costPer1MInput?: number;
  costPer1MOutput?: number;
  costPerHour?: number | null;
  customParams?: CustomParams | null;
  capabilitiesVerifiedAt?: Date | null;
  capabilitiesSource?: string | null;
  isActive?: boolean;
}

/**
 * Filtros para busca de ModelDeployments
 */
export interface DeploymentFilters {
  baseModelId?: string;
  providerId?: string;
  inferenceType?: InferenceType;
  isActive?: boolean;
  search?: string;
}

/**
 * Opções de paginação e ordenação
 */
export interface DeploymentQueryOptions {
  page?: number;
  limit?: number;
  orderBy?: 'deploymentId' | 'inferenceType' | 'createdAt' | 'updatedAt' | 'costPer1MInput' | 'costPer1MOutput';
  order?: 'asc' | 'desc';
  includeBaseModel?: boolean;
  includeProvider?: boolean;
  includeCertifications?: boolean;
}

/**
 * Resultado paginado de ModelDeployments
 */
export interface PaginatedDeployments {
  deployments: Prisma.ModelDeploymentGetPayload<{
    include: { baseModel: boolean; provider: boolean; certifications: boolean };
  }>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Resultado de estimativa de custo
 */
export interface CostEstimate {
  deploymentId: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service para operações CRUD no modelo ModelDeployment
 * 
 * Responsabilidade única: Gerenciar deployments de modelos AI em diferentes
 * providers e tipos de inferência (ON_DEMAND, INFERENCE_PROFILE, PROVISIONED).
 */
export const deploymentService = {
  /**
   * Lista todos os deployments com filtros opcionais e paginação
   * 
   * @param filters - Filtros de busca (baseModelId, providerId, inferenceType, isActive, search)
   * @param options - Opções de paginação e ordenação
   * @returns Deployments paginados com metadata
   * 
   * @example
   * ```typescript
   * const result = await deploymentService.findAll(
   *   { providerId: 'uuid-provider', isActive: true },
   *   { page: 1, limit: 10, includeBaseModel: true }
   * );
   * ```
   */
  async findAll(
    filters: DeploymentFilters = {},
    options: DeploymentQueryOptions = {}
  ): Promise<PaginatedDeployments> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;
    const orderBy = options.orderBy || 'deploymentId';
    const order = options.order || 'asc';

    // Construir where clause
    const where: Prisma.ModelDeploymentWhereInput = {};

    if (filters.baseModelId) {
      where.baseModelId = filters.baseModelId;
    }

    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters.inferenceType) {
      where.inferenceType = filters.inferenceType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { deploymentId: { contains: filters.search, mode: 'insensitive' } },
        { baseModel: { name: { contains: filters.search, mode: 'insensitive' } } },
        { provider: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    logger.debug('DeploymentService.findAll', {
      filters,
      options: { page, limit, orderBy, order }
    });

    const [deployments, total] = await Promise.all([
      prisma.modelDeployment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          baseModel: options.includeBaseModel || false,
          provider: options.includeProvider || false,
          certifications: options.includeCertifications || false
        }
      }),
      prisma.modelDeployment.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info('DeploymentService.findAll completed', {
      total,
      page,
      totalPages
    });

    return {
      deployments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  },

  /**
   * Busca um deployment por ID (UUID interno)
   * 
   * @param id - UUID do deployment
   * @param includeBaseModel - Se deve incluir o modelo base relacionado
   * @param includeProvider - Se deve incluir o provider relacionado
   * @param includeCertifications - Se deve incluir certificações relacionadas
   * @returns Deployment encontrado ou null
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.findById('uuid-here', true, true, true);
   * ```
   */
  async findById(
    id: string,
    includeBaseModel: boolean = false,
    includeProvider: boolean = false,
    includeCertifications: boolean = false
  ) {
    logger.debug('DeploymentService.findById', { id, includeBaseModel, includeProvider, includeCertifications });

    const deployment = await prisma.modelDeployment.findUnique({
      where: { id },
      include: {
        baseModel: includeBaseModel,
        provider: includeProvider,
        certifications: includeCertifications
      }
    });

    if (!deployment) {
      logger.warn('DeploymentService.findById: Deployment not found', { id });
    }

    return deployment;
  },

  /**
   * Busca um deployment pelo deploymentId e providerId (chave única composta)
   * 
   * @param providerId - UUID do provider
   * @param deploymentId - ID único do deployment no provider (ex: "anthropic.claude-3-5-sonnet-20241022-v2:0")
   * @param includeBaseModel - Se deve incluir o modelo base relacionado
   * @param includeProvider - Se deve incluir o provider relacionado
   * @param includeCertifications - Se deve incluir certificações relacionadas
   * @returns Deployment encontrado ou null
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.findByDeploymentId(
   *   'provider-uuid',
   *   'anthropic.claude-3-5-sonnet-20241022-v2:0'
   * );
   * ```
   */
  async findByDeploymentId(
    providerId: string,
    deploymentId: string,
    includeBaseModel: boolean = false,
    includeProvider: boolean = false,
    includeCertifications: boolean = false
  ) {
    logger.debug('DeploymentService.findByDeploymentId', { providerId, deploymentId, includeBaseModel, includeProvider, includeCertifications });

    const deployment = await prisma.modelDeployment.findUnique({
      where: {
        providerId_deploymentId: {
          providerId,
          deploymentId
        }
      },
      include: {
        baseModel: includeBaseModel,
        provider: includeProvider,
        certifications: includeCertifications
      }
    });

    if (!deployment) {
      logger.warn('DeploymentService.findByDeploymentId: Deployment not found', { providerId, deploymentId });
    }

    return deployment;
  },

  /**
   * Lista deployments de um modelo base específico
   * 
   * @param baseModelId - UUID do modelo base
   * @param options - Opções de paginação
   * @returns Deployments paginados do modelo base
   * 
   * @example
   * ```typescript
   * const result = await deploymentService.findByBaseModel('uuid-here');
   * ```
   */
  async findByBaseModel(baseModelId: string, options: DeploymentQueryOptions = {}) {
    logger.debug('DeploymentService.findByBaseModel', { baseModelId });
    return this.findAll({ baseModelId }, options);
  },

  /**
   * Lista deployments de um provider específico
   * 
   * @param providerId - UUID do provider
   * @param options - Opções de paginação
   * @returns Deployments paginados do provider
   * 
   * @example
   * ```typescript
   * const result = await deploymentService.findByProvider('uuid-here');
   * ```
   */
  async findByProvider(providerId: string, options: DeploymentQueryOptions = {}) {
    logger.debug('DeploymentService.findByProvider', { providerId });
    return this.findAll({ providerId }, options);
  },

  /**
   * Lista deployments por tipo de inferência
   * 
   * @param inferenceType - Tipo de inferência (ON_DEMAND, INFERENCE_PROFILE, PROVISIONED)
   * @param options - Opções de paginação
   * @returns Deployments paginados do tipo de inferência
   * 
   * @example
   * ```typescript
   * const result = await deploymentService.findByInferenceType('ON_DEMAND');
   * ```
   */
  async findByInferenceType(inferenceType: InferenceType, options: DeploymentQueryOptions = {}) {
    logger.debug('DeploymentService.findByInferenceType', { inferenceType });
    return this.findAll({ inferenceType }, options);
  },

  /**
   * Lista deployments ativos de um provider específico
   * 
   * @param providerId - UUID do provider
   * @param options - Opções de paginação
   * @returns Deployments ativos paginados do provider
   * 
   * @example
   * ```typescript
   * const result = await deploymentService.findActiveByProvider('uuid-here');
   * ```
   */
  async findActiveByProvider(providerId: string, options: DeploymentQueryOptions = {}) {
    logger.debug('DeploymentService.findActiveByProvider', { providerId });
    return this.findAll({ providerId, isActive: true }, options);
  },

  /**
   * Cria um novo deployment
   * 
   * @param data - Dados do deployment a ser criado
   * @returns Deployment criado
   * @throws Error se a combinação providerId+deploymentId já existir
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.create({
   *   baseModelId: 'uuid-do-modelo-base',
   *   providerId: 'uuid-do-provider',
   *   deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
   *   inferenceType: 'ON_DEMAND',
   *   costPer1MInput: 3.0,
   *   costPer1MOutput: 15.0
   * });
   * ```
   */
  async create(data: CreateDeploymentData) {
    logger.info('DeploymentService.create', {
      deploymentId: data.deploymentId,
      baseModelId: data.baseModelId,
      providerId: data.providerId
    });

    try {
      const deployment = await prisma.modelDeployment.create({
        data: {
          baseModelId: data.baseModelId,
          providerId: data.providerId,
          deploymentId: data.deploymentId,
          inferenceType: data.inferenceType ?? 'ON_DEMAND',
          providerConfig: data.providerConfig as Prisma.InputJsonValue ?? Prisma.JsonNull,
          costPer1MInput: data.costPer1MInput,
          costPer1MOutput: data.costPer1MOutput,
          costPerHour: data.costPerHour ?? null,
          customParams: data.customParams as Prisma.InputJsonValue ?? Prisma.JsonNull,
          isActive: data.isActive ?? true
        },
        include: {
          baseModel: true,
          provider: true,
          certifications: true
        }
      });

      logger.info('DeploymentService.create completed', {
        id: deployment.id,
        deploymentId: deployment.deploymentId
      });

      return deployment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.error('DeploymentService.create: Unique constraint violation', {
            deploymentId: data.deploymentId,
            providerId: data.providerId,
            error: error.message
          });
          throw new Error(
            `Deployment with providerId "${data.providerId}" and deploymentId "${data.deploymentId}" already exists`
          );
        }
        if (error.code === 'P2003') {
          logger.error('DeploymentService.create: Foreign key constraint failed', {
            baseModelId: data.baseModelId,
            providerId: data.providerId,
            error: error.message
          });
          throw new Error(`BaseModel or Provider does not exist`);
        }
      }
      logger.error('DeploymentService.create failed', {
        deploymentId: data.deploymentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Atualiza um deployment existente
   * 
   * @param id - UUID do deployment
   * @param data - Dados a serem atualizados
   * @returns Deployment atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.update('uuid-here', {
   *   isActive: false,
   *   costPer1MInput: 3.5
   * });
   * ```
   */
  async update(id: string, data: UpdateDeploymentData) {
    logger.info('DeploymentService.update', { id, data });

    try {
      // Verificar se existe
      const existing = await prisma.modelDeployment.findUnique({ where: { id } });
      if (!existing) {
        logger.warn('DeploymentService.update: Deployment not found', { id });
        return null;
      }

      const updateData: Prisma.ModelDeploymentUpdateInput = {};

      if (data.deploymentId !== undefined) updateData.deploymentId = data.deploymentId;
      if (data.baseModelId !== undefined) updateData.baseModel = { connect: { id: data.baseModelId } };
      if (data.providerId !== undefined) updateData.provider = { connect: { id: data.providerId } };
      if (data.inferenceType !== undefined) updateData.inferenceType = data.inferenceType;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.costPer1MInput !== undefined) updateData.costPer1MInput = data.costPer1MInput;
      if (data.costPer1MOutput !== undefined) updateData.costPer1MOutput = data.costPer1MOutput;
      if (data.costPerHour !== undefined) updateData.costPerHour = data.costPerHour;
      if (data.capabilitiesVerifiedAt !== undefined) updateData.capabilitiesVerifiedAt = data.capabilitiesVerifiedAt;
      if (data.capabilitiesSource !== undefined) updateData.capabilitiesSource = data.capabilitiesSource;
      
      // Tratamento especial para campos JSON que podem ser null
      if (data.providerConfig !== undefined) {
        updateData.providerConfig = data.providerConfig !== null 
          ? data.providerConfig as Prisma.InputJsonValue 
          : Prisma.JsonNull;
      }
      if (data.customParams !== undefined) {
        updateData.customParams = data.customParams !== null 
          ? data.customParams as Prisma.InputJsonValue 
          : Prisma.JsonNull;
      }

      const deployment = await prisma.modelDeployment.update({
        where: { id },
        data: updateData,
        include: {
          baseModel: true,
          provider: true,
          certifications: true
        }
      });

      logger.info('DeploymentService.update completed', {
        id: deployment.id,
        deploymentId: deployment.deploymentId
      });

      return deployment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.error('DeploymentService.update: Unique constraint violation', {
            id,
            data,
            error: error.message
          });
          throw new Error('Update would violate unique constraint');
        }
        if (error.code === 'P2003') {
          logger.error('DeploymentService.update: Foreign key constraint failed', {
            id,
            baseModelId: data.baseModelId,
            providerId: data.providerId,
            error: error.message
          });
          throw new Error(`BaseModel or Provider does not exist`);
        }
      }
      logger.error('DeploymentService.update failed', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Deleta um deployment (soft delete via isActive=false)
   * 
   * NOTA: Por segurança, não fazemos hard delete. Marcamos como inativo.
   * Para hard delete, use deleteHard() com cautela.
   * 
   * @param id - UUID do deployment
   * @returns Deployment marcado como inativo ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.delete('uuid-here');
   * ```
   */
  async delete(id: string) {
    logger.info('DeploymentService.delete (soft)', { id });

    const existing = await prisma.modelDeployment.findUnique({ where: { id } });
    if (!existing) {
      logger.warn('DeploymentService.delete: Deployment not found', { id });
      return null;
    }

    const deployment = await prisma.modelDeployment.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    logger.info('DeploymentService.delete completed (soft)', {
      id: deployment.id,
      deploymentId: deployment.deploymentId
    });

    return deployment;
  },

  /**
   * Deleta permanentemente um deployment
   * 
   * ⚠️ CUIDADO: Esta operação é irreversível e pode falhar se houver
   * certificações associadas (cascade delete).
   * 
   * @param id - UUID do deployment
   * @returns true se deletado, false se não encontrado
   * 
   * @example
   * ```typescript
   * const deleted = await deploymentService.deleteHard('uuid-here');
   * ```
   */
  async deleteHard(id: string): Promise<boolean> {
    logger.warn('DeploymentService.deleteHard', { id });

    try {
      const existing = await prisma.modelDeployment.findUnique({ where: { id } });
      if (!existing) {
        logger.warn('DeploymentService.deleteHard: Deployment not found', { id });
        return false;
      }

      await prisma.modelDeployment.delete({ where: { id } });

      logger.info('DeploymentService.deleteHard completed', {
        id,
        deploymentId: existing.deploymentId
      });

      return true;
    } catch (error) {
      logger.error('DeploymentService.deleteHard failed', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  // ============================================================================
  // MÉTODOS DE CUSTO
  // ============================================================================

  /**
   * Atualiza os custos de um deployment
   * 
   * @param id - UUID do deployment
   * @param costPer1MInput - Custo por 1M tokens de input (USD)
   * @param costPer1MOutput - Custo por 1M tokens de output (USD)
   * @returns Deployment atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.updateCosts('uuid-here', 3.0, 15.0);
   * ```
   */
  async updateCosts(
    id: string,
    costPer1MInput: number,
    costPer1MOutput: number
  ) {
    logger.info('DeploymentService.updateCosts', { id, costPer1MInput, costPer1MOutput });

    const existing = await prisma.modelDeployment.findUnique({ where: { id } });
    if (!existing) {
      logger.warn('DeploymentService.updateCosts: Deployment not found', { id });
      return null;
    }

    const deployment = await prisma.modelDeployment.update({
      where: { id },
      data: {
        costPer1MInput,
        costPer1MOutput
      },
      include: {
        baseModel: true,
        provider: true
      }
    });

    logger.info('DeploymentService.updateCosts completed', {
      id: deployment.id,
      deploymentId: deployment.deploymentId,
      costPer1MInput: deployment.costPer1MInput,
      costPer1MOutput: deployment.costPer1MOutput
    });

    return deployment;
  },

  /**
   * Calcula estimativa de custo para uma quantidade de tokens
   * 
   * @param id - UUID do deployment
   * @param inputTokens - Quantidade de tokens de input
   * @param outputTokens - Quantidade de tokens de output
   * @returns Estimativa de custo detalhada ou null se deployment não encontrado
   * 
   * @example
   * ```typescript
   * const estimate = await deploymentService.getCostEstimate('uuid-here', 1000, 500);
   * // {
   * //   deploymentId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
   * //   inputTokens: 1000,
   * //   outputTokens: 500,
   * //   inputCost: 0.003,
   * //   outputCost: 0.0075,
   * //   totalCost: 0.0105,
   * //   currency: 'USD'
   * // }
   * ```
   */
  async getCostEstimate(
    id: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<CostEstimate | null> {
    logger.debug('DeploymentService.getCostEstimate', { id, inputTokens, outputTokens });

    const deployment = await prisma.modelDeployment.findUnique({
      where: { id },
      select: {
        deploymentId: true,
        costPer1MInput: true,
        costPer1MOutput: true
      }
    });

    if (!deployment) {
      logger.warn('DeploymentService.getCostEstimate: Deployment not found', { id });
      return null;
    }

    // Calcular custos (custo por 1M tokens / 1.000.000 * quantidade de tokens)
    const inputCostPerToken = deployment.costPer1MInput / 1_000_000;
    const outputCostPerToken = deployment.costPer1MOutput / 1_000_000;

    const inputCost = inputCostPerToken * inputTokens;
    const outputCost = outputCostPerToken * outputTokens;
    const totalCost = inputCost + outputCost;

    const estimate: CostEstimate = {
      deploymentId: deployment.deploymentId,
      inputTokens,
      outputTokens,
      inputCost: Number(inputCost.toFixed(6)),
      outputCost: Number(outputCost.toFixed(6)),
      totalCost: Number(totalCost.toFixed(6)),
      currency: 'USD'
    };

    logger.debug('DeploymentService.getCostEstimate completed', estimate);

    return estimate;
  },

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Conta o total de deployments
   * 
   * @param filters - Filtros opcionais
   * @returns Contagem total
   * 
   * @example
   * ```typescript
   * const total = await deploymentService.count({ providerId: 'uuid', isActive: true });
   * ```
   */
  async count(filters: DeploymentFilters = {}): Promise<number> {
    const where: Prisma.ModelDeploymentWhereInput = {};

    if (filters.baseModelId) where.baseModelId = filters.baseModelId;
    if (filters.providerId) where.providerId = filters.providerId;
    if (filters.inferenceType) where.inferenceType = filters.inferenceType;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.modelDeployment.count({ where });
  },

  /**
   * Lista todos os tipos de inferência em uso
   * 
   * @returns Array de tipos de inferência únicos
   * 
   * @example
   * ```typescript
   * const types = await deploymentService.getInferenceTypes();
   * // ['ON_DEMAND', 'INFERENCE_PROFILE', 'PROVISIONED']
   * ```
   */
  async getInferenceTypes(): Promise<InferenceType[]> {
    const result = await prisma.modelDeployment.findMany({
      select: { inferenceType: true },
      distinct: ['inferenceType'],
      orderBy: { inferenceType: 'asc' }
    });

    return result.map(r => r.inferenceType);
  },

  /**
   * Lista todos os providers com deployments
   * 
   * @returns Array de providers únicos com seus IDs
   * 
   * @example
   * ```typescript
   * const providers = await deploymentService.getProviders();
   * // [{ id: 'uuid', name: 'AWS Bedrock', slug: 'bedrock' }, ...]
   * ```
   */
  async getProviders(): Promise<{ id: string; name: string; slug: string }[]> {
    const result = await prisma.modelDeployment.findMany({
      select: {
        provider: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      distinct: ['providerId']
    });

    return result.map(r => r.provider);
  },

  /**
   * Verifica capabilities de um deployment
   * 
   * @param id - UUID do deployment
   * @param source - Fonte da verificação ('manual' ou 'auto_test')
   * @returns Deployment atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const deployment = await deploymentService.verifyCapabilities('uuid-here', 'auto_test');
   * ```
   */
  async verifyCapabilities(id: string, source: 'manual' | 'auto_test') {
    logger.info('DeploymentService.verifyCapabilities', { id, source });

    const existing = await prisma.modelDeployment.findUnique({ where: { id } });
    if (!existing) {
      logger.warn('DeploymentService.verifyCapabilities: Deployment not found', { id });
      return null;
    }

    const deployment = await prisma.modelDeployment.update({
      where: { id },
      data: {
        capabilitiesVerifiedAt: new Date(),
        capabilitiesSource: source
      },
      include: {
        baseModel: true,
        provider: true
      }
    });

    logger.info('DeploymentService.verifyCapabilities completed', {
      id: deployment.id,
      deploymentId: deployment.deploymentId,
      capabilitiesVerifiedAt: deployment.capabilitiesVerifiedAt,
      capabilitiesSource: deployment.capabilitiesSource
    });

    return deployment;
  }
};
