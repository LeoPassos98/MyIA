// backend/src/services/models/capabilityValidationService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CÓDIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { modelCacheService } from './modelCacheService';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Capabilities de um modelo de IA
 * 
 * Estrutura completa das capacidades que um modelo pode ter.
 * Armazenado como JSON no campo `capabilities` de BaseModel.
 */
export interface ModelCapabilities {
  // Capabilities booleanas
  /** Suporta chat/conversação */
  chat?: boolean;
  /** Suporta streaming de respostas */
  streaming?: boolean;
  /** Suporta processamento de imagens */
  vision?: boolean;
  /** Suporta function calling / tool use */
  functionCalling?: boolean;
  /** Suporta geração de embeddings */
  embeddings?: boolean;
  /** Especializado em geração de código */
  codeGeneration?: boolean;
  /** Suporta raciocínio avançado (chain-of-thought) */
  reasoning?: boolean;
  /** Suporta múltiplas modalidades (texto, imagem, áudio) */
  multimodal?: boolean;
  /** Suporta JSON mode / structured output */
  jsonMode?: boolean;
  /** Suporta system prompts */
  systemPrompt?: boolean;

  // Capabilities numéricas
  /** Tamanho máximo da janela de contexto em tokens */
  maxContextWindow?: number;
  /** Número máximo de tokens de saída */
  maxOutputTokens?: number;
  /** Número máximo de imagens por requisição */
  maxImagesPerRequest?: number;

  // Capabilities de lista
  /** Idiomas suportados (códigos ISO 639-1) */
  languages?: string[];
  /** Formatos de entrada suportados */
  supportedInputFormats?: string[];
  /** Formatos de saída suportados */
  supportedOutputFormats?: string[];
}

/**
 * Resultado da comparação de capabilities entre dois modelos
 */
export interface CapabilityComparison {
  /** ID do primeiro modelo */
  model1Id: string;
  /** ID do segundo modelo */
  model2Id: string;
  /** Capabilities presentes em ambos */
  common: string[];
  /** Capabilities apenas no modelo 1 */
  onlyInModel1: string[];
  /** Capabilities apenas no modelo 2 */
  onlyInModel2: string[];
  /** Comparação de valores numéricos */
  numericComparison: {
    capability: string;
    model1Value: number | undefined;
    model2Value: number | undefined;
    winner: 'model1' | 'model2' | 'tie';
  }[];
}

/**
 * Resultado da validação de capabilities
 */
export interface ValidationResult {
  /** Se a validação passou */
  valid: boolean;
  /** Erros encontrados */
  errors: string[];
  /** Avisos (não bloqueantes) */
  warnings: string[];
}

/**
 * Resultado da busca do melhor modelo para uma tarefa
 */
export interface BestModelResult {
  /** ID do modelo recomendado */
  modelId: string;
  /** Nome do modelo */
  modelName: string;
  /** Score de adequação (0-100) */
  score: number;
  /** Capabilities atendidas */
  matchedCapabilities: string[];
  /** Capabilities não atendidas */
  missingCapabilities: string[];
}

/**
 * Tipo para BaseModel do Prisma
 */
type BaseModelWithDeployments = Prisma.BaseModelGetPayload<{
  include: { deployments: boolean };
}>;

// ============================================================================
// CONSTANTES
// ============================================================================

/** Lista de capabilities booleanas válidas */
const BOOLEAN_CAPABILITIES = [
  'chat',
  'streaming',
  'vision',
  'functionCalling',
  'embeddings',
  'codeGeneration',
  'reasoning',
  'multimodal',
  'jsonMode',
  'systemPrompt'
] as const;

/** Lista de capabilities numéricas válidas */
const NUMERIC_CAPABILITIES = [
  'maxContextWindow',
  'maxOutputTokens',
  'maxImagesPerRequest'
] as const;

/** Lista de capabilities de lista válidas */
const LIST_CAPABILITIES = [
  'languages',
  'supportedInputFormats',
  'supportedOutputFormats'
] as const;

/** Todas as capabilities válidas */
const ALL_CAPABILITIES = [
  ...BOOLEAN_CAPABILITIES,
  ...NUMERIC_CAPABILITIES,
  ...LIST_CAPABILITIES
] as const;

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Service para validação e verificação de capabilities de modelos de IA
 * 
 * Responsabilidade única: Validar, verificar e comparar capabilities de modelos.
 * Usa modelCacheService para evitar consultas repetidas ao banco.
 * 
 * @example
 * ```typescript
 * // Verificar se modelo tem capability
 * const hasVision = await capabilityValidationService.hasCapability('model-id', 'vision');
 * 
 * // Encontrar melhor modelo para tarefa
 * const best = await capabilityValidationService.findBestModelForTask(
 *   ['chat', 'streaming'],
 *   ['vision', 'functionCalling']
 * );
 * ```
 */
class CapabilityValidationService {
  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ============================================================================

  /**
   * Valida se um objeto é um capabilities válido
   * 
   * @param capabilities - Objeto a ser validado
   * @returns Resultado da validação com erros e avisos
   * 
   * @example
   * ```typescript
   * const result = capabilityValidationService.validateCapabilities({
   *   chat: true,
   *   streaming: true,
   *   maxContextWindow: 200000
   * });
   * if (!result.valid) {
   *   console.error(result.errors);
   * }
   * ```
   */
  validateCapabilities(capabilities: unknown): ValidationResult {
    logger.debug('CapabilityValidationService.validateCapabilities', { capabilities });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar se é um objeto
    if (capabilities === null || typeof capabilities !== 'object') {
      errors.push('Capabilities deve ser um objeto');
      return { valid: false, errors, warnings };
    }

    const caps = capabilities as Record<string, unknown>;

    // Validar cada campo
    for (const [key, value] of Object.entries(caps)) {
      // Verificar se é uma capability conhecida
      if (!ALL_CAPABILITIES.includes(key as typeof ALL_CAPABILITIES[number])) {
        warnings.push(`Capability desconhecida: "${key}"`);
        continue;
      }

      // Validar tipo baseado na categoria
      if (BOOLEAN_CAPABILITIES.includes(key as typeof BOOLEAN_CAPABILITIES[number])) {
        if (typeof value !== 'boolean') {
          errors.push(`Capability "${key}" deve ser boolean, recebido: ${typeof value}`);
        }
      } else if (NUMERIC_CAPABILITIES.includes(key as typeof NUMERIC_CAPABILITIES[number])) {
        if (typeof value !== 'number' || value < 0) {
          errors.push(`Capability "${key}" deve ser número positivo, recebido: ${typeof value}`);
        }
      } else if (LIST_CAPABILITIES.includes(key as typeof LIST_CAPABILITIES[number])) {
        if (!Array.isArray(value)) {
          errors.push(`Capability "${key}" deve ser array, recebido: ${typeof value}`);
        } else if (!value.every(item => typeof item === 'string')) {
          errors.push(`Capability "${key}" deve ser array de strings`);
        }
      }
    }

    const valid = errors.length === 0;
    
    logger.debug('CapabilityValidationService.validateCapabilities result', { 
      valid, 
      errorCount: errors.length, 
      warningCount: warnings.length 
    });

    return { valid, errors, warnings };
  }

  /**
   * Verifica se um modelo tem uma capability específica
   * 
   * @param modelId - UUID do modelo base
   * @param capability - Nome da capability a verificar
   * @returns true se o modelo tem a capability ativa
   * 
   * @example
   * ```typescript
   * const hasVision = await capabilityValidationService.hasCapability('model-id', 'vision');
   * ```
   */
  async hasCapability(modelId: string, capability: string): Promise<boolean> {
    logger.debug('CapabilityValidationService.hasCapability', { modelId, capability });

    const capabilities = await this.getCapabilities(modelId);
    if (!capabilities) {
      return false;
    }

    const value = capabilities[capability as keyof ModelCapabilities];
    
    // Para capabilities booleanas, verificar se é true
    if (BOOLEAN_CAPABILITIES.includes(capability as typeof BOOLEAN_CAPABILITIES[number])) {
      return value === true;
    }
    
    // Para capabilities numéricas, verificar se existe e é > 0
    if (NUMERIC_CAPABILITIES.includes(capability as typeof NUMERIC_CAPABILITIES[number])) {
      return typeof value === 'number' && value > 0;
    }
    
    // Para capabilities de lista, verificar se existe e não está vazia
    if (LIST_CAPABILITIES.includes(capability as typeof LIST_CAPABILITIES[number])) {
      return Array.isArray(value) && value.length > 0;
    }

    return false;
  }

  /**
   * Verifica se um modelo tem todas as capabilities especificadas
   * 
   * @param modelId - UUID do modelo base
   * @param capabilities - Lista de capabilities a verificar
   * @returns true se o modelo tem TODAS as capabilities
   * 
   * @example
   * ```typescript
   * const hasAll = await capabilityValidationService.hasAllCapabilities(
   *   'model-id',
   *   ['chat', 'streaming', 'vision']
   * );
   * ```
   */
  async hasAllCapabilities(modelId: string, capabilities: string[]): Promise<boolean> {
    logger.debug('CapabilityValidationService.hasAllCapabilities', { modelId, capabilities });

    if (capabilities.length === 0) {
      return true;
    }

    for (const capability of capabilities) {
      const has = await this.hasCapability(modelId, capability);
      if (!has) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica se um modelo tem pelo menos uma das capabilities especificadas
   * 
   * @param modelId - UUID do modelo base
   * @param capabilities - Lista de capabilities a verificar
   * @returns true se o modelo tem PELO MENOS UMA das capabilities
   * 
   * @example
   * ```typescript
   * const hasAny = await capabilityValidationService.hasAnyCapability(
   *   'model-id',
   *   ['vision', 'multimodal']
   * );
   * ```
   */
  async hasAnyCapability(modelId: string, capabilities: string[]): Promise<boolean> {
    logger.debug('CapabilityValidationService.hasAnyCapability', { modelId, capabilities });

    if (capabilities.length === 0) {
      return false;
    }

    for (const capability of capabilities) {
      const has = await this.hasCapability(modelId, capability);
      if (has) {
        return true;
      }
    }

    return false;
  }

  /**
   * Retorna as capabilities de um modelo
   * 
   * @param modelId - UUID do modelo base
   * @returns Capabilities do modelo ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const caps = await capabilityValidationService.getCapabilities('model-id');
   * if (caps?.vision) {
   *   console.log('Modelo suporta visão');
   * }
   * ```
   */
  async getCapabilities(modelId: string): Promise<ModelCapabilities | null> {
    logger.debug('CapabilityValidationService.getCapabilities', { modelId });

    const model = await modelCacheService.getBaseModel(modelId, false);
    if (!model) {
      logger.warn('CapabilityValidationService.getCapabilities: Model not found', { modelId });
      return null;
    }

    return model.capabilities as ModelCapabilities;
  }

  /**
   * Compara capabilities de dois modelos
   * 
   * @param modelId1 - UUID do primeiro modelo
   * @param modelId2 - UUID do segundo modelo
   * @returns Comparação detalhada das capabilities
   * 
   * @example
   * ```typescript
   * const comparison = await capabilityValidationService.compareCapabilities(
   *   'model-1-id',
   *   'model-2-id'
   * );
   * console.log('Capabilities em comum:', comparison.common);
   * ```
   */
  async compareCapabilities(modelId1: string, modelId2: string): Promise<CapabilityComparison | null> {
    logger.debug('CapabilityValidationService.compareCapabilities', { modelId1, modelId2 });

    const [caps1, caps2] = await Promise.all([
      this.getCapabilities(modelId1),
      this.getCapabilities(modelId2)
    ]);

    if (!caps1 || !caps2) {
      logger.warn('CapabilityValidationService.compareCapabilities: One or both models not found', {
        modelId1,
        modelId2,
        caps1Found: !!caps1,
        caps2Found: !!caps2
      });
      return null;
    }

    const common: string[] = [];
    const onlyInModel1: string[] = [];
    const onlyInModel2: string[] = [];
    const numericComparison: CapabilityComparison['numericComparison'] = [];

    // Comparar capabilities booleanas
    for (const cap of BOOLEAN_CAPABILITIES) {
      const has1 = caps1[cap] === true;
      const has2 = caps2[cap] === true;

      if (has1 && has2) {
        common.push(cap);
      } else if (has1) {
        onlyInModel1.push(cap);
      } else if (has2) {
        onlyInModel2.push(cap);
      }
    }

    // Comparar capabilities numéricas
    for (const cap of NUMERIC_CAPABILITIES) {
      const val1 = caps1[cap];
      const val2 = caps2[cap];

      if (val1 !== undefined || val2 !== undefined) {
        let winner: 'model1' | 'model2' | 'tie' = 'tie';
        if (val1 !== undefined && val2 !== undefined) {
          if (val1 > val2) winner = 'model1';
          else if (val2 > val1) winner = 'model2';
        } else if (val1 !== undefined) {
          winner = 'model1';
        } else {
          winner = 'model2';
        }

        numericComparison.push({
          capability: cap,
          model1Value: val1,
          model2Value: val2,
          winner
        });
      }
    }

    // Comparar capabilities de lista
    for (const cap of LIST_CAPABILITIES) {
      const list1 = caps1[cap] as string[] | undefined;
      const list2 = caps2[cap] as string[] | undefined;
      const has1 = Array.isArray(list1) && list1.length > 0;
      const has2 = Array.isArray(list2) && list2.length > 0;

      if (has1 && has2) {
        common.push(cap);
      } else if (has1) {
        onlyInModel1.push(cap);
      } else if (has2) {
        onlyInModel2.push(cap);
      }
    }

    logger.info('CapabilityValidationService.compareCapabilities completed', {
      modelId1,
      modelId2,
      commonCount: common.length,
      onlyInModel1Count: onlyInModel1.length,
      onlyInModel2Count: onlyInModel2.length
    });

    return {
      model1Id: modelId1,
      model2Id: modelId2,
      common,
      onlyInModel1,
      onlyInModel2,
      numericComparison
    };
  }

  // ============================================================================
  // MÉTODOS DE BUSCA POR CAPABILITY
  // ============================================================================

  /**
   * Lista modelos que possuem uma capability específica
   * 
   * @param capability - Nome da capability
   * @returns Lista de modelos com a capability
   * 
   * @example
   * ```typescript
   * const visionModels = await capabilityValidationService.findModelsWithCapability('vision');
   * ```
   */
  async findModelsWithCapability(capability: string): Promise<BaseModelWithDeployments[]> {
    logger.debug('CapabilityValidationService.findModelsWithCapability', { capability });

    // Buscar todos os modelos ativos
    const models = await prisma.baseModel.findMany({
      where: { deprecated: false },
      include: { deployments: true }
    });

    // Filtrar por capability
    const filtered = models.filter(model => {
      const caps = model.capabilities as ModelCapabilities;
      
      if (BOOLEAN_CAPABILITIES.includes(capability as typeof BOOLEAN_CAPABILITIES[number])) {
        return caps[capability as keyof ModelCapabilities] === true;
      }
      
      if (NUMERIC_CAPABILITIES.includes(capability as typeof NUMERIC_CAPABILITIES[number])) {
        const value = caps[capability as keyof ModelCapabilities];
        return typeof value === 'number' && value > 0;
      }
      
      if (LIST_CAPABILITIES.includes(capability as typeof LIST_CAPABILITIES[number])) {
        const value = caps[capability as keyof ModelCapabilities];
        return Array.isArray(value) && value.length > 0;
      }

      return false;
    });

    logger.info('CapabilityValidationService.findModelsWithCapability completed', {
      capability,
      totalModels: models.length,
      matchingModels: filtered.length
    });

    return filtered;
  }

  /**
   * Lista modelos que possuem TODAS as capabilities especificadas
   * 
   * @param capabilities - Lista de capabilities requeridas
   * @returns Lista de modelos com todas as capabilities
   * 
   * @example
   * ```typescript
   * const models = await capabilityValidationService.findModelsWithAllCapabilities([
   *   'chat', 'streaming', 'vision'
   * ]);
   * ```
   */
  async findModelsWithAllCapabilities(capabilities: string[]): Promise<BaseModelWithDeployments[]> {
    logger.debug('CapabilityValidationService.findModelsWithAllCapabilities', { capabilities });

    if (capabilities.length === 0) {
      return prisma.baseModel.findMany({
        where: { deprecated: false },
        include: { deployments: true }
      });
    }

    // Buscar todos os modelos ativos
    const models = await prisma.baseModel.findMany({
      where: { deprecated: false },
      include: { deployments: true }
    });

    // Filtrar por todas as capabilities
    const filtered = models.filter(model => {
      const caps = model.capabilities as ModelCapabilities;
      
      return capabilities.every(capability => {
        if (BOOLEAN_CAPABILITIES.includes(capability as typeof BOOLEAN_CAPABILITIES[number])) {
          return caps[capability as keyof ModelCapabilities] === true;
        }
        
        if (NUMERIC_CAPABILITIES.includes(capability as typeof NUMERIC_CAPABILITIES[number])) {
          const value = caps[capability as keyof ModelCapabilities];
          return typeof value === 'number' && value > 0;
        }
        
        if (LIST_CAPABILITIES.includes(capability as typeof LIST_CAPABILITIES[number])) {
          const value = caps[capability as keyof ModelCapabilities];
          return Array.isArray(value) && value.length > 0;
        }

        return false;
      });
    });

    logger.info('CapabilityValidationService.findModelsWithAllCapabilities completed', {
      capabilities,
      totalModels: models.length,
      matchingModels: filtered.length
    });

    return filtered;
  }

  /**
   * Encontra o melhor modelo para uma tarefa baseado em capabilities
   * 
   * @param requiredCapabilities - Capabilities obrigatórias
   * @param preferredCapabilities - Capabilities desejáveis (aumentam o score)
   * @returns Melhor modelo encontrado ou null se nenhum atender os requisitos
   * 
   * @example
   * ```typescript
   * const best = await capabilityValidationService.findBestModelForTask(
   *   ['chat', 'streaming'],           // Obrigatórias
   *   ['vision', 'functionCalling']    // Desejáveis
   * );
   * if (best) {
   *   console.log(`Melhor modelo: ${best.modelName} (score: ${best.score})`);
   * }
   * ```
   */
  async findBestModelForTask(
    requiredCapabilities: string[],
    preferredCapabilities: string[] = []
  ): Promise<BestModelResult | null> {
    logger.debug('CapabilityValidationService.findBestModelForTask', {
      requiredCapabilities,
      preferredCapabilities
    });

    // Buscar modelos com todas as capabilities obrigatórias
    const candidates = await this.findModelsWithAllCapabilities(requiredCapabilities);

    if (candidates.length === 0) {
      logger.warn('CapabilityValidationService.findBestModelForTask: No models match required capabilities', {
        requiredCapabilities
      });
      return null;
    }

    // Calcular score para cada candidato
    const scored = candidates.map(model => {
      const caps = model.capabilities as ModelCapabilities;
      let score = 50; // Score base por atender requisitos obrigatórios
      const matchedCapabilities = [...requiredCapabilities];
      const missingCapabilities: string[] = [];

      // Adicionar pontos por capabilities preferenciais
      for (const pref of preferredCapabilities) {
        let hasCapability = false;

        if (BOOLEAN_CAPABILITIES.includes(pref as typeof BOOLEAN_CAPABILITIES[number])) {
          hasCapability = caps[pref as keyof ModelCapabilities] === true;
        } else if (NUMERIC_CAPABILITIES.includes(pref as typeof NUMERIC_CAPABILITIES[number])) {
          const value = caps[pref as keyof ModelCapabilities];
          hasCapability = typeof value === 'number' && value > 0;
        } else if (LIST_CAPABILITIES.includes(pref as typeof LIST_CAPABILITIES[number])) {
          const value = caps[pref as keyof ModelCapabilities];
          hasCapability = Array.isArray(value) && value.length > 0;
        }

        if (hasCapability) {
          score += 10;
          matchedCapabilities.push(pref);
        } else {
          missingCapabilities.push(pref);
        }
      }

      // Bonus por capabilities numéricas maiores
      if (caps.maxContextWindow && caps.maxContextWindow >= 100000) {
        score += 5;
      }
      if (caps.maxOutputTokens && caps.maxOutputTokens >= 4096) {
        score += 5;
      }

      // Limitar score a 100
      score = Math.min(score, 100);

      return {
        modelId: model.id,
        modelName: model.name,
        score,
        matchedCapabilities,
        missingCapabilities
      };
    });

    // Ordenar por score (maior primeiro)
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    logger.info('CapabilityValidationService.findBestModelForTask completed', {
      requiredCapabilities,
      preferredCapabilities,
      candidatesCount: candidates.length,
      bestModel: best.modelName,
      bestScore: best.score
    });

    return best;
  }

  // ============================================================================
  // MÉTODOS DE ATUALIZAÇÃO
  // ============================================================================

  /**
   * Atualiza capabilities de um modelo (substitui completamente)
   * 
   * @param modelId - UUID do modelo base
   * @param capabilities - Novas capabilities (substitui as existentes)
   * @returns Modelo atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const updated = await capabilityValidationService.updateCapabilities('model-id', {
   *   chat: true,
   *   streaming: true,
   *   vision: true,
   *   maxContextWindow: 200000
   * });
   * ```
   */
  async updateCapabilities(
    modelId: string,
    capabilities: Partial<ModelCapabilities>
  ): Promise<BaseModelWithDeployments | null> {
    logger.info('CapabilityValidationService.updateCapabilities', { modelId, capabilities });

    // Validar capabilities
    const validation = this.validateCapabilities(capabilities);
    if (!validation.valid) {
      logger.error('CapabilityValidationService.updateCapabilities: Invalid capabilities', {
        modelId,
        errors: validation.errors
      });
      throw new Error(`Invalid capabilities: ${validation.errors.join(', ')}`);
    }

    // Verificar se modelo existe
    const existing = await prisma.baseModel.findUnique({ where: { id: modelId } });
    if (!existing) {
      logger.warn('CapabilityValidationService.updateCapabilities: Model not found', { modelId });
      return null;
    }

    // Atualizar
    const updated = await prisma.baseModel.update({
      where: { id: modelId },
      data: {
        capabilities: capabilities as Prisma.InputJsonValue
      },
      include: { deployments: true }
    });

    // Invalidar cache
    modelCacheService.invalidateBaseModel(modelId);

    logger.info('CapabilityValidationService.updateCapabilities completed', {
      modelId,
      modelName: updated.name
    });

    return updated;
  }

  /**
   * Faz merge de capabilities com as existentes
   * 
   * @param modelId - UUID do modelo base
   * @param newCapabilities - Capabilities a serem mescladas
   * @returns Modelo atualizado ou null se não encontrado
   * 
   * @example
   * ```typescript
   * // Adicionar vision sem perder outras capabilities
   * const updated = await capabilityValidationService.mergeCapabilities('model-id', {
   *   vision: true,
   *   maxImagesPerRequest: 10
   * });
   * ```
   */
  async mergeCapabilities(
    modelId: string,
    newCapabilities: Partial<ModelCapabilities>
  ): Promise<BaseModelWithDeployments | null> {
    logger.info('CapabilityValidationService.mergeCapabilities', { modelId, newCapabilities });

    // Validar novas capabilities
    const validation = this.validateCapabilities(newCapabilities);
    if (!validation.valid) {
      logger.error('CapabilityValidationService.mergeCapabilities: Invalid capabilities', {
        modelId,
        errors: validation.errors
      });
      throw new Error(`Invalid capabilities: ${validation.errors.join(', ')}`);
    }

    // Buscar capabilities existentes
    const existing = await prisma.baseModel.findUnique({ where: { id: modelId } });
    if (!existing) {
      logger.warn('CapabilityValidationService.mergeCapabilities: Model not found', { modelId });
      return null;
    }

    const existingCaps = existing.capabilities as ModelCapabilities;
    const mergedCaps = { ...existingCaps, ...newCapabilities };

    // Atualizar
    const updated = await prisma.baseModel.update({
      where: { id: modelId },
      data: {
        capabilities: mergedCaps as Prisma.InputJsonValue
      },
      include: { deployments: true }
    });

    // Invalidar cache
    modelCacheService.invalidateBaseModel(modelId);

    logger.info('CapabilityValidationService.mergeCapabilities completed', {
      modelId,
      modelName: updated.name,
      mergedKeys: Object.keys(newCapabilities)
    });

    return updated;
  }

  // ============================================================================
  // VALIDAÇÃO DE CONTEXTO
  // ============================================================================

  /**
   * Verifica se um número de tokens cabe na janela de contexto do modelo
   * 
   * @param modelId - UUID do modelo base
   * @param tokenCount - Número de tokens a verificar
   * @returns true se cabe, false se excede ou modelo não encontrado
   * 
   * @example
   * ```typescript
   * const fits = await capabilityValidationService.validateContextWindow('model-id', 50000);
   * if (!fits) {
   *   console.warn('Contexto muito grande para este modelo');
   * }
   * ```
   */
  async validateContextWindow(modelId: string, tokenCount: number): Promise<boolean> {
    logger.debug('CapabilityValidationService.validateContextWindow', { modelId, tokenCount });

    const capabilities = await this.getCapabilities(modelId);
    if (!capabilities) {
      return false;
    }

    const maxContext = capabilities.maxContextWindow;
    if (typeof maxContext !== 'number') {
      logger.warn('CapabilityValidationService.validateContextWindow: maxContextWindow not defined', {
        modelId
      });
      return false;
    }

    const valid = tokenCount <= maxContext;

    logger.debug('CapabilityValidationService.validateContextWindow result', {
      modelId,
      tokenCount,
      maxContext,
      valid
    });

    return valid;
  }

  /**
   * Verifica se um número de tokens de saída está dentro do limite do modelo
   * 
   * @param modelId - UUID do modelo base
   * @param requestedTokens - Número de tokens de saída solicitados
   * @returns true se está dentro do limite, false se excede ou modelo não encontrado
   * 
   * @example
   * ```typescript
   * const valid = await capabilityValidationService.validateOutputTokens('model-id', 4096);
   * if (!valid) {
   *   console.warn('Número de tokens de saída excede o limite do modelo');
   * }
   * ```
   */
  async validateOutputTokens(modelId: string, requestedTokens: number): Promise<boolean> {
    logger.debug('CapabilityValidationService.validateOutputTokens', { modelId, requestedTokens });

    const capabilities = await this.getCapabilities(modelId);
    if (!capabilities) {
      return false;
    }

    const maxOutput = capabilities.maxOutputTokens;
    if (typeof maxOutput !== 'number') {
      logger.warn('CapabilityValidationService.validateOutputTokens: maxOutputTokens not defined', {
        modelId
      });
      return false;
    }

    const valid = requestedTokens <= maxOutput;

    logger.debug('CapabilityValidationService.validateOutputTokens result', {
      modelId,
      requestedTokens,
      maxOutput,
      valid
    });

    return valid;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Retorna a lista de todas as capabilities válidas
   *
   * @returns Lista de nomes de capabilities
   *
   * @example
   * ```typescript
   * const allCaps = capabilityValidationService.getAllCapabilityNames();
   * // ['chat', 'streaming', 'vision', ...]
   * ```
   */
  getAllCapabilityNames(): string[] {
    return [...ALL_CAPABILITIES];
  }

  /**
   * Retorna a lista de capabilities booleanas
   *
   * @returns Lista de nomes de capabilities booleanas
   */
  getBooleanCapabilityNames(): string[] {
    return [...BOOLEAN_CAPABILITIES];
  }

  /**
   * Retorna a lista de capabilities numéricas
   *
   * @returns Lista de nomes de capabilities numéricas
   */
  getNumericCapabilityNames(): string[] {
    return [...NUMERIC_CAPABILITIES];
  }

  /**
   * Retorna a lista de capabilities de lista
   *
   * @returns Lista de nomes de capabilities de lista
   */
  getListCapabilityNames(): string[] {
    return [...LIST_CAPABILITIES];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Instância singleton do CapabilityValidationService
 *
 * @example
 * ```typescript
 * import { capabilityValidationService } from './capabilityValidationService';
 *
 * const hasVision = await capabilityValidationService.hasCapability('model-id', 'vision');
 * const best = await capabilityValidationService.findBestModelForTask(['chat'], ['vision']);
 * ```
 */
export const capabilityValidationService = new CapabilityValidationService();
