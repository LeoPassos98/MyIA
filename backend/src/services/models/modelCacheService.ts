// backend/src/services/models/modelCacheService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';
import { baseModelService } from './baseModelService';
import { deploymentService } from './deploymentService';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Configuração do cache
 */
export interface CacheConfig {
  /** TTL em milissegundos (padrão: 5 minutos) */
  ttlMs: number;
  /** Limite máximo de itens no cache (padrão: 1000) */
  maxItems: number;
}

/**
 * Entrada do cache com metadados
 */
interface CacheEntry<T> {
  /** Dados armazenados */
  data: T;
  /** Timestamp de criação */
  createdAt: number;
  /** Timestamp do último acesso (para LRU) */
  lastAccessedAt: number;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  /** Total de hits (acertos) */
  hits: number;
  /** Total de misses (falhas) */
  misses: number;
  /** Taxa de acerto (0-1) */
  hitRate: number;
  /** Tamanho atual do cache de BaseModels */
  baseModelCacheSize: number;
  /** Tamanho atual do cache de Deployments */
  deploymentCacheSize: number;
  /** Tamanho total do cache */
  totalSize: number;
  /** Configuração atual */
  config: CacheConfig;
}

/**
 * Tipo para BaseModel do Prisma com deployments opcionais
 */
type BaseModelWithDeployments = Prisma.BaseModelGetPayload<{
  include: { deployments: boolean };
}>;

/**
 * Tipo para ModelDeployment do Prisma com relacionamentos opcionais
 */
type DeploymentWithRelations = Prisma.ModelDeploymentGetPayload<{
  include: { baseModel: boolean; provider: boolean; certifications: boolean };
}>;

// ============================================================================
// CONSTANTES
// ============================================================================

/** TTL padrão: 5 minutos */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/** Limite padrão de itens */
const DEFAULT_MAX_ITEMS = 1000;

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service para cache em memória de modelos e deployments
 * 
 * Responsabilidade única: Gerenciar cache em memória para evitar consultas
 * repetidas ao banco de dados para BaseModel e ModelDeployment.
 * 
 * Estratégia de cache:
 * - Cache-aside pattern (lazy loading)
 * - TTL configurável para invalidação automática
 * - LRU (Least Recently Used) para eviction quando limite é atingido
 * - Invalidação manual quando dados são alterados
 * 
 * @example
 * ```typescript
 * // Buscar modelo do cache ou banco
 * const model = await modelCacheService.getBaseModel('uuid-here');
 * 
 * // Invalidar cache após atualização
 * await baseModelService.update(id, data);
 * modelCacheService.invalidateBaseModel(id);
 * ```
 */
class ModelCacheService {
  // Cache de BaseModels por ID
  private baseModelById: Map<string, CacheEntry<BaseModelWithDeployments>> = new Map();
  
  // Cache de BaseModels por name (índice secundário)
  private baseModelByName: Map<string, string> = new Map(); // name -> id
  
  // Cache de Deployments por ID
  private deploymentById: Map<string, CacheEntry<DeploymentWithRelations>> = new Map();
  
  // Cache de Deployments por chave composta (índice secundário)
  private deploymentByKey: Map<string, string> = new Map(); // providerId:deploymentId -> id
  
  // Cache de deployments ativos (lista completa)
  private activeDeploymentsCache: CacheEntry<DeploymentWithRelations[]> | null = null;
  
  // Estatísticas
  private hits = 0;
  private misses = 0;
  
  // Configuração
  private config: CacheConfig = {
    ttlMs: DEFAULT_TTL_MS,
    maxItems: DEFAULT_MAX_ITEMS
  };

  /**
   * Configura o cache
   * 
   * @param config - Configuração parcial do cache
   * 
   * @example
   * ```typescript
   * modelCacheService.configure({ ttlMs: 10 * 60 * 1000 }); // 10 minutos
   * ```
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('ModelCacheService.configure', { config: this.config });
  }

  // ============================================================================
  // MÉTODOS DE CACHE PARA BASEMODEL
  // ============================================================================

  /**
   * Busca um BaseModel por ID do cache ou banco
   * 
   * @param id - UUID do modelo
   * @param includeDeployments - Se deve incluir deployments relacionados
   * @returns Modelo encontrado ou null
   * 
   * @example
   * ```typescript
   * const model = await modelCacheService.getBaseModel('uuid-here', true);
   * ```
   */
  async getBaseModel(
    id: string,
    includeDeployments: boolean = false
  ): Promise<BaseModelWithDeployments | null> {
    logger.debug('ModelCacheService.getBaseModel', { id, includeDeployments });

    // Verificar cache
    const cached = this.baseModelById.get(id);
    if (cached && this.isValid(cached)) {
      // Atualizar lastAccessedAt para LRU
      cached.lastAccessedAt = Date.now();
      this.hits++;
      logger.debug('ModelCacheService.getBaseModel: Cache hit', { id });
      return cached.data;
    }

    // Cache miss - buscar do banco
    this.misses++;
    logger.debug('ModelCacheService.getBaseModel: Cache miss', { id });

    const model = await baseModelService.findById(id, includeDeployments);
    if (model) {
      this.setBaseModel(model);
    }

    return model;
  }

  /**
   * Busca um BaseModel por nome do cache ou banco
   * 
   * @param name - Nome único do modelo
   * @param includeDeployments - Se deve incluir deployments relacionados
   * @returns Modelo encontrado ou null
   * 
   * @example
   * ```typescript
   * const model = await modelCacheService.getBaseModelByName('Claude 3.5 Sonnet');
   * ```
   */
  async getBaseModelByName(
    name: string,
    includeDeployments: boolean = false
  ): Promise<BaseModelWithDeployments | null> {
    logger.debug('ModelCacheService.getBaseModelByName', { name, includeDeployments });

    // Verificar índice secundário
    const id = this.baseModelByName.get(name);
    if (id) {
      const cached = this.baseModelById.get(id);
      if (cached && this.isValid(cached)) {
        cached.lastAccessedAt = Date.now();
        this.hits++;
        logger.debug('ModelCacheService.getBaseModelByName: Cache hit', { name });
        return cached.data;
      }
    }

    // Cache miss - buscar do banco
    this.misses++;
    logger.debug('ModelCacheService.getBaseModelByName: Cache miss', { name });

    const model = await baseModelService.findByName(name, includeDeployments);
    if (model) {
      this.setBaseModel(model);
    }

    return model;
  }

  /**
   * Armazena um BaseModel no cache
   * 
   * @param model - Modelo a ser armazenado
   */
  private setBaseModel(model: BaseModelWithDeployments): void {
    // Verificar limite e fazer eviction se necessário
    this.evictIfNeeded(this.baseModelById);

    const now = Date.now();
    const entry: CacheEntry<BaseModelWithDeployments> = {
      data: model,
      createdAt: now,
      lastAccessedAt: now
    };

    this.baseModelById.set(model.id, entry);
    this.baseModelByName.set(model.name, model.id);

    logger.debug('ModelCacheService.setBaseModel', { id: model.id, name: model.name });
  }

  /**
   * Invalida o cache de um BaseModel específico
   * 
   * @param id - UUID do modelo a invalidar
   * 
   * @example
   * ```typescript
   * await baseModelService.update(id, data);
   * modelCacheService.invalidateBaseModel(id);
   * ```
   */
  invalidateBaseModel(id: string): void {
    const cached = this.baseModelById.get(id);
    if (cached) {
      this.baseModelByName.delete(cached.data.name);
      this.baseModelById.delete(id);
      logger.info('ModelCacheService.invalidateBaseModel', { id });
    }
  }

  // ============================================================================
  // MÉTODOS DE CACHE PARA DEPLOYMENT
  // ============================================================================

  /**
   * Busca um Deployment por ID do cache ou banco
   * 
   * @param id - UUID do deployment
   * @param includeBaseModel - Se deve incluir o modelo base relacionado
   * @param includeProvider - Se deve incluir o provider relacionado
   * @param includeCertifications - Se deve incluir certificações relacionadas
   * @returns Deployment encontrado ou null
   * 
   * @example
   * ```typescript
   * const deployment = await modelCacheService.getDeployment('uuid-here', true, true);
   * ```
   */
  async getDeployment(
    id: string,
    includeBaseModel: boolean = false,
    includeProvider: boolean = false,
    includeCertifications: boolean = false
  ): Promise<DeploymentWithRelations | null> {
    logger.debug('ModelCacheService.getDeployment', { id, includeBaseModel, includeProvider, includeCertifications });

    // Verificar cache
    const cached = this.deploymentById.get(id);
    if (cached && this.isValid(cached)) {
      cached.lastAccessedAt = Date.now();
      this.hits++;
      logger.debug('ModelCacheService.getDeployment: Cache hit', { id });
      return cached.data;
    }

    // Cache miss - buscar do banco
    this.misses++;
    logger.debug('ModelCacheService.getDeployment: Cache miss', { id });

    const deployment = await deploymentService.findById(
      id,
      includeBaseModel,
      includeProvider,
      includeCertifications
    );
    if (deployment) {
      this.setDeployment(deployment);
    }

    return deployment;
  }

  /**
   * Busca um Deployment por chave composta (providerId + deploymentId)
   * 
   * @param providerId - UUID do provider
   * @param deploymentId - ID do deployment no provider
   * @param includeBaseModel - Se deve incluir o modelo base relacionado
   * @param includeProvider - Se deve incluir o provider relacionado
   * @param includeCertifications - Se deve incluir certificações relacionadas
   * @returns Deployment encontrado ou null
   * 
   * @example
   * ```typescript
   * const deployment = await modelCacheService.getDeploymentByDeploymentId(
   *   'provider-uuid',
   *   'anthropic.claude-3-5-sonnet-20241022-v2:0'
   * );
   * ```
   */
  async getDeploymentByDeploymentId(
    providerId: string,
    deploymentId: string,
    includeBaseModel: boolean = false,
    includeProvider: boolean = false,
    includeCertifications: boolean = false
  ): Promise<DeploymentWithRelations | null> {
    logger.debug('ModelCacheService.getDeploymentByDeploymentId', { providerId, deploymentId });

    // Verificar índice secundário
    const cacheKey = `${providerId}:${deploymentId}`;
    const id = this.deploymentByKey.get(cacheKey);
    if (id) {
      const cached = this.deploymentById.get(id);
      if (cached && this.isValid(cached)) {
        cached.lastAccessedAt = Date.now();
        this.hits++;
        logger.debug('ModelCacheService.getDeploymentByDeploymentId: Cache hit', { providerId, deploymentId });
        return cached.data;
      }
    }

    // Cache miss - buscar do banco
    this.misses++;
    logger.debug('ModelCacheService.getDeploymentByDeploymentId: Cache miss', { providerId, deploymentId });

    const deployment = await deploymentService.findByDeploymentId(
      providerId,
      deploymentId,
      includeBaseModel,
      includeProvider,
      includeCertifications
    );
    if (deployment) {
      this.setDeployment(deployment);
    }

    return deployment;
  }

  /**
   * Busca todos os deployments ativos do cache ou banco
   * 
   * @param includeBaseModel - Se deve incluir o modelo base relacionado
   * @param includeProvider - Se deve incluir o provider relacionado
   * @returns Lista de deployments ativos
   * 
   * @example
   * ```typescript
   * const deployments = await modelCacheService.getAllActiveDeployments(true, true);
   * ```
   */
  async getAllActiveDeployments(
    includeBaseModel: boolean = true,
    includeProvider: boolean = true
  ): Promise<DeploymentWithRelations[]> {
    logger.debug('ModelCacheService.getAllActiveDeployments', { includeBaseModel, includeProvider });

    // Verificar cache de lista
    if (this.activeDeploymentsCache && this.isValid(this.activeDeploymentsCache)) {
      this.activeDeploymentsCache.lastAccessedAt = Date.now();
      this.hits++;
      logger.debug('ModelCacheService.getAllActiveDeployments: Cache hit');
      return this.activeDeploymentsCache.data;
    }

    // Cache miss - buscar do banco
    this.misses++;
    logger.debug('ModelCacheService.getAllActiveDeployments: Cache miss');

    const result = await deploymentService.findAll(
      { isActive: true },
      { 
        limit: 1000, 
        includeBaseModel, 
        includeProvider,
        includeCertifications: false
      }
    );

    const deployments = result.deployments;

    // Armazenar no cache de lista
    const now = Date.now();
    this.activeDeploymentsCache = {
      data: deployments,
      createdAt: now,
      lastAccessedAt: now
    };

    // Também armazenar individualmente para consultas futuras
    for (const deployment of deployments) {
      this.setDeployment(deployment);
    }

    logger.info('ModelCacheService.getAllActiveDeployments: Cached', { count: deployments.length });

    return deployments;
  }

  /**
   * Armazena um Deployment no cache
   * 
   * @param deployment - Deployment a ser armazenado
   */
  private setDeployment(deployment: DeploymentWithRelations): void {
    // Verificar limite e fazer eviction se necessário
    this.evictIfNeeded(this.deploymentById);

    const now = Date.now();
    const entry: CacheEntry<DeploymentWithRelations> = {
      data: deployment,
      createdAt: now,
      lastAccessedAt: now
    };

    this.deploymentById.set(deployment.id, entry);
    this.deploymentByKey.set(`${deployment.providerId}:${deployment.deploymentId}`, deployment.id);

    logger.debug('ModelCacheService.setDeployment', { 
      id: deployment.id, 
      deploymentId: deployment.deploymentId 
    });
  }

  /**
   * Invalida o cache de um Deployment específico
   * 
   * @param id - UUID do deployment a invalidar
   * 
   * @example
   * ```typescript
   * await deploymentService.update(id, data);
   * modelCacheService.invalidateDeployment(id);
   * ```
   */
  invalidateDeployment(id: string): void {
    const cached = this.deploymentById.get(id);
    if (cached) {
      this.deploymentByKey.delete(`${cached.data.providerId}:${cached.data.deploymentId}`);
      this.deploymentById.delete(id);
      // Também invalidar cache de lista
      this.activeDeploymentsCache = null;
      logger.info('ModelCacheService.invalidateDeployment', { id });
    }
  }

  // ============================================================================
  // MÉTODOS DE INVALIDAÇÃO E ESTATÍSTICAS
  // ============================================================================

  /**
   * Invalida todo o cache
   * 
   * @example
   * ```typescript
   * modelCacheService.invalidateAll();
   * ```
   */
  invalidateAll(): void {
    const baseModelCount = this.baseModelById.size;
    const deploymentCount = this.deploymentById.size;

    this.baseModelById.clear();
    this.baseModelByName.clear();
    this.deploymentById.clear();
    this.deploymentByKey.clear();
    this.activeDeploymentsCache = null;

    logger.info('ModelCacheService.invalidateAll', {
      baseModelsCleared: baseModelCount,
      deploymentsCleared: deploymentCount
    });
  }

  /**
   * Retorna estatísticas do cache
   * 
   * @returns Estatísticas detalhadas do cache
   * 
   * @example
   * ```typescript
   * const stats = modelCacheService.getStats();
   * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
   * ```
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      baseModelCacheSize: this.baseModelById.size,
      deploymentCacheSize: this.deploymentById.size,
      totalSize: this.baseModelById.size + this.deploymentById.size,
      config: { ...this.config }
    };
  }

  /**
   * Reseta as estatísticas do cache
   * 
   * @example
   * ```typescript
   * modelCacheService.resetStats();
   * ```
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    logger.info('ModelCacheService.resetStats');
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Verifica se uma entrada do cache é válida (não expirada)
   * 
   * @param entry - Entrada do cache
   * @returns true se válida, false se expirada
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.createdAt;
    return age < this.config.ttlMs;
  }

  /**
   * Faz eviction de entradas LRU se o limite for atingido
   *
   * @param cache - Map do cache a verificar
   */
  private evictIfNeeded<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size < this.config.maxItems) {
      return;
    }

    // Encontrar entrada menos recentemente usada
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    const entries = Array.from(cache.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
      logger.debug('ModelCacheService.evictIfNeeded: Evicted LRU entry', { key: oldestKey });
    }
  }

  /**
   * Remove entradas expiradas do cache (limpeza periódica)
   *
   * @returns Número de entradas removidas
   *
   * @example
   * ```typescript
   * const removed = modelCacheService.cleanup();
   * console.log(`Removed ${removed} expired entries`);
   * ```
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    // Limpar BaseModels expirados
    const baseModelEntries = Array.from(this.baseModelById.entries());
    for (let i = 0; i < baseModelEntries.length; i++) {
      const [id, entry] = baseModelEntries[i];
      if (now - entry.createdAt >= this.config.ttlMs) {
        this.baseModelByName.delete(entry.data.name);
        this.baseModelById.delete(id);
        removed++;
      }
    }

    // Limpar Deployments expirados
    const deploymentEntries = Array.from(this.deploymentById.entries());
    for (let i = 0; i < deploymentEntries.length; i++) {
      const [id, entry] = deploymentEntries[i];
      if (now - entry.createdAt >= this.config.ttlMs) {
        this.deploymentByKey.delete(`${entry.data.providerId}:${entry.data.deploymentId}`);
        this.deploymentById.delete(id);
        removed++;
      }
    }

    // Limpar cache de lista se expirado
    if (this.activeDeploymentsCache && now - this.activeDeploymentsCache.createdAt >= this.config.ttlMs) {
      this.activeDeploymentsCache = null;
      removed++;
    }

    if (removed > 0) {
      logger.info('ModelCacheService.cleanup', { removed });
    }

    return removed;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Instância singleton do ModelCacheService
 * 
 * @example
 * ```typescript
 * import { modelCacheService } from './modelCacheService';
 * 
 * const model = await modelCacheService.getBaseModel('uuid');
 * const stats = modelCacheService.getStats();
 * ```
 */
export const modelCacheService = new ModelCacheService();
