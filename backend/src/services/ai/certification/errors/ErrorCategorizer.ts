// backend/src/services/ai/certification/errors/ErrorCategorizer.ts
// Standards: docs/STANDARDS.md

import { CategorizedError, ErrorCategory } from '../types';
import { IErrorCategory } from './types';
import { CategoryRegistry } from './registry/CategoryRegistry';
import {
  UnavailableCategory,
  PermissionCategory,
  AuthenticationCategory,
  ConfigurationCategory,
  ProvisioningCategory,
  RateLimitCategory,
  TimeoutCategory,
  QualityCategory,
  NetworkCategory,
  UnknownCategory
} from './categories';
import { logger } from '../../../../utils/logger';

/**
 * Orquestrador de categorização de erros usando Strategy Pattern
 * 
 * Responsabilidades:
 * - Inicializar e registrar todas as categorias
 * - Orquestrar processo de categorização
 * - Manter compatibilidade com API existente
 * - Logging e performance monitoring
 * 
 * Uso:
 * ```typescript
 * const categorizer = new ErrorCategorizer();
 * const result = categorizer.categorize(error);
 * console.log(result.category, result.severity);
 * ```
 */
export class ErrorCategorizer {
  private registry: CategoryRegistry;
  private unknownCategory: IErrorCategory;
  
  constructor() {
    this.registry = new CategoryRegistry();
    this.unknownCategory = new UnknownCategory();
    this.initializeCategories();
  }
  
  /**
   * Inicializa e registra todas as categorias em ordem de prioridade
   * Ordem é automática baseada no campo priority de cada categoria
   */
  private initializeCategories(): void {
    // Registrar categorias (ordem automática por priority)
    this.registry.register(new UnavailableCategory());        // priority: 10
    this.registry.register(new PermissionCategory());         // priority: 20
    this.registry.register(new AuthenticationCategory());     // priority: 25
    this.registry.register(new ConfigurationCategory());      // priority: 30
    this.registry.register(new ProvisioningCategory());       // priority: 35
    this.registry.register(new RateLimitCategory());          // priority: 40
    this.registry.register(new TimeoutCategory());            // priority: 45
    this.registry.register(new QualityCategory());            // priority: 50
    this.registry.register(new NetworkCategory());            // priority: 60
    // UnknownCategory não é registrada - usada como fallback
    
    logger.debug('ErrorCategorizer initialized', {
      categoriesCount: this.registry.getCount()
    });
  }
  
  /**
   * Categoriza um erro baseado na mensagem
   * @param error - Erro ou string a ser categorizado
   * @returns Erro categorizado com severidade, mensagem e ações sugeridas
   */
  categorize(error: Error | string): CategorizedError {
    const startTime = Date.now();
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Buscar categoria correspondente
    const matchResult = this.registry.findMatch(errorMessage);
    const category = matchResult.category || this.unknownCategory;
    
    // Construir resultado
    const result: CategorizedError = {
      category: category.name,
      severity: category.severity,
      message: category.getUserFriendlyMessage(errorMessage),
      originalError: errorMessage,
      suggestedActions: category.getSuggestedActions(),
      isTemporary: category.isTemporary()
    };
    
    const elapsedMs = Date.now() - startTime;
    
    // Log para debug (deve ser < 1ms)
    if (elapsedMs > 1) {
      logger.warn(`Error categorization took ${elapsedMs}ms (expected < 1ms)`, {
        category: category.name,
        errorMessage: errorMessage.substring(0, 100)
      });
    }
    
    logger.debug('Error categorized', {
      category: category.name,
      severity: category.severity,
      isTemporary: category.isTemporary(),
      elapsedMs
    });
    
    return result;
  }
  
  /**
   * Verifica se modelo está disponível baseado na categoria
   * @param category - Categoria do erro
   * @returns true se modelo está disponível (apenas QUALITY_ISSUE)
   */
  isModelAvailable(category: ErrorCategory): boolean {
    return category === ErrorCategory.QUALITY_ISSUE;
  }
  
  /**
   * Determina se deve fazer retry baseado na categoria e número de tentativas
   * @param category - Categoria do erro
   * @param attemptNumber - Número da tentativa atual
   * @returns true se deve fazer retry
   */
  shouldRetry(category: ErrorCategory, attemptNumber: number): boolean {
    // Buscar categoria correspondente
    const categories = this.registry.getAllCategories();
    const categoryObj = categories.find(c => c.name === category);
    
    if (!categoryObj) {
      return false;
    }
    
    const retryConfig = categoryObj.getRetryConfig();
    return attemptNumber < retryConfig.maxRetries;
  }
  
  /**
   * Calcula delay para retry com backoff exponencial
   * @param category - Categoria do erro
   * @param attemptNumber - Número da tentativa atual
   * @returns Delay em milissegundos
   */
  getRetryDelay(category: ErrorCategory, attemptNumber: number): number {
    // Buscar categoria correspondente
    const categories = this.registry.getAllCategories();
    const categoryObj = categories.find(c => c.name === category);
    
    if (!categoryObj) {
      return 0;
    }
    
    const retryConfig = categoryObj.getRetryConfig();
    const baseDelay = retryConfig.baseDelayMs;
    
    // Backoff exponencial: delay * 2^attemptNumber
    return baseDelay * Math.pow(2, attemptNumber);
  }
}

// ============================================================================
// API PÚBLICA (mantém compatibilidade com código existente)
// ============================================================================

/**
 * Instância singleton do categorizador
 */
const categorizer = new ErrorCategorizer();

/**
 * Categoriza um erro com base na mensagem
 * @param error - Erro ou string a ser categorizado
 * @returns Erro categorizado
 */
export function categorizeError(error: Error | string): CategorizedError {
  return categorizer.categorize(error);
}

/**
 * Verifica se modelo está disponível baseado na categoria
 * @param category - Categoria do erro
 * @returns true se modelo está disponível
 */
export function isModelAvailable(category: ErrorCategory): boolean {
  return categorizer.isModelAvailable(category);
}

/**
 * Determina se deve fazer retry baseado na categoria e número de tentativas
 * @param category - Categoria do erro
 * @param attemptNumber - Número da tentativa atual
 * @returns true se deve fazer retry
 */
export function shouldRetry(category: ErrorCategory, attemptNumber: number): boolean {
  return categorizer.shouldRetry(category, attemptNumber);
}

/**
 * Calcula delay para retry com backoff exponencial
 * @param category - Categoria do erro
 * @param attemptNumber - Número da tentativa atual
 * @returns Delay em milissegundos
 */
export function getRetryDelay(category: ErrorCategory, attemptNumber: number): number {
  return categorizer.getRetryDelay(category, attemptNumber);
}
