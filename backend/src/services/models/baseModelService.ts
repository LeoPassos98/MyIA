// backend/src/services/models/baseModelService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Capabilities do modelo base
 * Estrutura esperada conforme schema-v2.prisma
 */
export interface BaseModelCapabilities {
  streaming?: boolean;
  vision?: boolean;
  functionCalling?: boolean;
  maxContextWindow?: number;
  maxOutputTokens?: number;
}

/**
 * Parâmetros padrão do modelo
 */
export interface BaseModelDefaultParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Dados para criação de um BaseModel
 */
export interface CreateBaseModelData {
  name: string;
  vendor: string;
  family?: string;
  version?: string;
  capabilities: BaseModelCapabilities;
  defaultParams?: BaseModelDefaultParams;
  description?: string;
  releaseDate?: Date;
  deprecated?: boolean;
  replacedBy?: string;
}

/**
 * Dados para atualização de um BaseModel
 */
export interface UpdateBaseModelData {
  name?: string;
  vendor?: string;
  family?: string;
  version?: string;
  capabilities?: BaseModelCapabilities;
  defaultParams?: BaseModelDefaultParams;
  description?: string;
  releaseDate?: Date;
  deprecated?: boolean;
  replacedBy?: string;
}

/**
 * Filtros para busca de BaseModels
 */
export interface BaseModelFilters {
  vendor?: string;
  family?: string;
  deprecated?: boolean;
  search?: string;
}

/**
 * Opções de paginação e ordenação
 */
export interface BaseModelQueryOptions {
  page?: number;
  limit?: number;
  orderBy?: 'name' | 'vendor' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  includeDeployments?: boolean;
}

/**
 * Resultado paginado de BaseModels
 */
export interface PaginatedBaseModels {
  models: Prisma.BaseModelGetPayload<{
    include: { deployments: boolean };
  }>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service para operações CRUD no modelo BaseModel
 * 
 * Responsabilidade única: Gerenciar modelos base de AI (Claude, GPT, Llama, etc.)
 * independente de provider.
 */
export const baseModelService = {
  /**
   * Lista todos os modelos base com filtros opcionais e paginação
   * 
   * @param filters - Filtros de busca (vendor, family, deprecated, search)
   * @param options - Opções de paginação e ordenação
   * @returns Modelos paginados com metadata
   * 
   * @example
   * ```typescript
   * const result = await baseModelService.findAll(
   *   { vendor: 'Anthropic' },
   *   { page: 1, limit: 10, includeDeployments: true }
   * );
   * ```
   */
  async findAll(
    filters: BaseModelFilters = {},
    options: BaseModelQueryOptions = {}
  ): Promise<PaginatedBaseModels> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;
    const orderBy = options.orderBy || 'name';
    const order = options.order || 'asc';

    // Construir where clause
    const where: Prisma.BaseModelWhereInput = {};

    if (filters.vendor) {
      where.vendor = filters.vendor;
    }

    if (filters.family) {
      where.family = filters.family;
    }

    if (filters.deprecated !== undefined) {
      where.deprecated = filters.deprecated;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { vendor: { contains: filters.search, mode: 'insensitive' } },
        { family: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    logger.debug('BaseModelService.findAll', {
      filters,
      options: { page, limit, orderBy, order }
    });

    const [models, total] = await Promise.all([
      prisma.baseModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        include: {
          deployments: options.includeDeployments || false
        }
      }),
      prisma.baseModel.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info('BaseModelService.findAll completed', {
      total,
      page,
      totalPages
    });

    return {
      models,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  },

  /**
   * Busca um modelo base por ID
   * 
   * @param id - UUID do modelo
   * @param includeDeployments - Se deve incluir deployments relacionados
   * @returns Modelo encontrado ou null
   * 
   * @example
   * ```typescript
   * const model = await baseModelService.findById('uuid-here', true);
   * ```
   */
  async findById(id: string, includeDeployments: boolean = false) {
    logger.debug('BaseModelService.findById', { id, includeDeployments });

    const model = await prisma.baseModel.findUnique({
      where: { id },
      include: {
        deployments: includeDeployments
      }
    });

    if (!model) {
      logger.warn('BaseModelService.findById: Model not found', { id });
    }

    return model;
  },

  /**
   * Busca um modelo base pelo nome único
   * 
   * @param name - Nome único do modelo (ex: "Claude 3.5 Sonnet")
   * @param includeDeployments - Se deve incluir deployments relacionados
   * @returns Modelo encontrado ou null
   * 
   * @example
   * ```typescript
   * const model = await baseModelService.findByName('Claude 3.5 Sonnet');
   * ```
   */
  async findByName(name: string, includeDeployments: boolean = false) {
    logger.debug('BaseModelService.findByName', { name, includeDeployments });

    const model = await prisma.baseModel.findUnique({
      where: { name },
      include: {
        deployments: includeDeployments
      }
    });

    if (!model) {
      logger.warn('BaseModelService.findByName: Model not found', { name });
    }

    return model;
  },

  /**
   * Lista modelos base de um vendor específico
   * 
   * @param vendor - Nome do vendor (ex: "Anthropic", "OpenAI", "Meta")
   * @param options - Opções de paginação
   * @returns Modelos paginados do vendor
   * 
   * @example
   * ```typescript
   * const result = await baseModelService.findByVendor('Anthropic');
   * ```
   */
  async findByVendor(vendor: string, options: BaseModelQueryOptions = {}) {
    logger.debug('BaseModelService.findByVendor', { vendor });
    return this.findAll({ vendor }, options);
  },

  /**
   * Lista modelos base de uma família específica
   * 
   * @param family - Nome da família (ex: "Claude", "GPT", "Llama")
   * @param options - Opções de paginação
   * @returns Modelos paginados da família
   * 
   * @example
   * ```typescript
   * const result = await baseModelService.findByFamily('Claude');
   * ```
   */
  async findByFamily(family: string, options: BaseModelQueryOptions = {}) {
    logger.debug('BaseModelService.findByFamily', { family });
    return this.findAll({ family }, options);
  },

  /**
   * Lista apenas modelos ativos (não deprecated)
   * 
   * @param options - Opções de paginação
   * @returns Modelos ativos paginados
   * 
   * @example
   * ```typescript
   * const result = await baseModelService.findActive();
   * ```
   */
  async findActive(options: BaseModelQueryOptions = {}) {
    logger.debug('BaseModelService.findActive');
    return this.findAll({ deprecated: false }, options);
  },

  /**
   * Cria um novo modelo base
   * 
   * @param data - Dados do modelo a ser criado
   * @returns Modelo criado
   * @throws Error se o nome já existir
   * 
   * @example
   * ```typescript
   * const model = await baseModelService.create({
   *   name: 'Claude 4',
   *   vendor: 'Anthropic',
   *   family: 'Claude',
   *   version: '4',
   *   capabilities: { streaming: true, vision: true }
   * });
   * ```
   */
  async create(data: CreateBaseModelData) {
    logger.info('BaseModelService.create', {
      name: data.name,
      vendor: data.vendor
    });

    try {
      const model = await prisma.baseModel.create({
        data: {
          name: data.name,
          vendor: data.vendor,
          family: data.family,
          version: data.version,
          capabilities: data.capabilities as Prisma.InputJsonValue,
          defaultParams: data.defaultParams as Prisma.InputJsonValue,
          description: data.description,
          releaseDate: data.releaseDate,
          deprecated: data.deprecated ?? false,
          replacedBy: data.replacedBy
        },
        include: {
          deployments: true
        }
      });

      logger.info('BaseModelService.create completed', {
        id: model.id,
        name: model.name
      });

      return model;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.error('BaseModelService.create: Duplicate name', {
            name: data.name,
            error: error.message
          });
          throw new Error(`BaseModel with name "${data.name}" already exists`);
        }
      }
      logger.error('BaseModelService.create failed', {
        name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Atualiza um modelo base existente
   * 
   * @param id - UUID do modelo
   * @param data - Dados a serem atualizados
   * @returns Modelo atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const model = await baseModelService.update('uuid-here', {
   *   deprecated: true,
   *   replacedBy: 'Claude 4'
   * });
   * ```
   */
  async update(id: string, data: UpdateBaseModelData) {
    logger.info('BaseModelService.update', { id, data });

    try {
      // Verificar se existe
      const existing = await prisma.baseModel.findUnique({ where: { id } });
      if (!existing) {
        logger.warn('BaseModelService.update: Model not found', { id });
        return null;
      }

      const model = await prisma.baseModel.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.vendor && { vendor: data.vendor }),
          ...(data.family !== undefined && { family: data.family }),
          ...(data.version !== undefined && { version: data.version }),
          ...(data.capabilities && { capabilities: data.capabilities as Prisma.InputJsonValue }),
          ...(data.defaultParams !== undefined && { defaultParams: data.defaultParams as Prisma.InputJsonValue }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.releaseDate !== undefined && { releaseDate: data.releaseDate }),
          ...(data.deprecated !== undefined && { deprecated: data.deprecated }),
          ...(data.replacedBy !== undefined && { replacedBy: data.replacedBy })
        },
        include: {
          deployments: true
        }
      });

      logger.info('BaseModelService.update completed', {
        id: model.id,
        name: model.name
      });

      return model;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          logger.error('BaseModelService.update: Duplicate name', {
            id,
            name: data.name,
            error: error.message
          });
          throw new Error(`BaseModel with name "${data.name}" already exists`);
        }
      }
      logger.error('BaseModelService.update failed', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Deleta um modelo base (soft delete via deprecated=true)
   * 
   * NOTA: Por segurança, não fazemos hard delete. Marcamos como deprecated.
   * Para hard delete, use deleteHard() com cautela.
   * 
   * @param id - UUID do modelo
   * @param replacedBy - Nome do modelo substituto (opcional)
   * @returns Modelo marcado como deprecated ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const model = await baseModelService.delete('uuid-here', 'Claude 4');
   * ```
   */
  async delete(id: string, replacedBy?: string) {
    logger.info('BaseModelService.delete (soft)', { id, replacedBy });

    const existing = await prisma.baseModel.findUnique({ where: { id } });
    if (!existing) {
      logger.warn('BaseModelService.delete: Model not found', { id });
      return null;
    }

    const model = await prisma.baseModel.update({
      where: { id },
      data: {
        deprecated: true,
        replacedBy: replacedBy || null
      }
    });

    logger.info('BaseModelService.delete completed (soft)', {
      id: model.id,
      name: model.name
    });

    return model;
  },

  /**
   * Deleta permanentemente um modelo base
   * 
   * ⚠️ CUIDADO: Esta operação é irreversível e pode falhar se houver
   * deployments associados (cascade delete).
   * 
   * @param id - UUID do modelo
   * @returns true se deletado, false se não encontrado
   * 
   * @example
   * ```typescript
   * const deleted = await baseModelService.deleteHard('uuid-here');
   * ```
   */
  async deleteHard(id: string): Promise<boolean> {
    logger.warn('BaseModelService.deleteHard', { id });

    try {
      const existing = await prisma.baseModel.findUnique({ where: { id } });
      if (!existing) {
        logger.warn('BaseModelService.deleteHard: Model not found', { id });
        return false;
      }

      await prisma.baseModel.delete({ where: { id } });

      logger.info('BaseModelService.deleteHard completed', {
        id,
        name: existing.name
      });

      return true;
    } catch (error) {
      logger.error('BaseModelService.deleteHard failed', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  /**
   * Conta o total de modelos base
   * 
   * @param filters - Filtros opcionais
   * @returns Contagem total
   * 
   * @example
   * ```typescript
   * const total = await baseModelService.count({ vendor: 'Anthropic' });
   * ```
   */
  async count(filters: BaseModelFilters = {}): Promise<number> {
    const where: Prisma.BaseModelWhereInput = {};

    if (filters.vendor) where.vendor = filters.vendor;
    if (filters.family) where.family = filters.family;
    if (filters.deprecated !== undefined) where.deprecated = filters.deprecated;

    return prisma.baseModel.count({ where });
  },

  /**
   * Lista todos os vendors únicos
   * 
   * @returns Array de vendors únicos
   * 
   * @example
   * ```typescript
   * const vendors = await baseModelService.getVendors();
   * // ['Anthropic', 'OpenAI', 'Meta', ...]
   * ```
   */
  async getVendors(): Promise<string[]> {
    const result = await prisma.baseModel.findMany({
      select: { vendor: true },
      distinct: ['vendor'],
      orderBy: { vendor: 'asc' }
    });

    return result.map(r => r.vendor);
  },

  /**
   * Lista todas as famílias únicas
   * 
   * @returns Array de famílias únicas (excluindo nulls)
   * 
   * @example
   * ```typescript
   * const families = await baseModelService.getFamilies();
   * // ['Claude', 'GPT', 'Llama', ...]
   * ```
   */
  async getFamilies(): Promise<string[]> {
    const result = await prisma.baseModel.findMany({
      select: { family: true },
      distinct: ['family'],
      where: { family: { not: null } },
      orderBy: { family: 'asc' }
    });

    return result.map(r => r.family).filter((f): f is string => f !== null);
  }
};
