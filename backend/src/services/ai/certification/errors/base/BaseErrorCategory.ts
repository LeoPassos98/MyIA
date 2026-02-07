// backend/src/services/ai/certification/errors/base/BaseErrorCategory.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../../types';
import { IErrorCategory, IMatcher, RetryConfig } from '../types';

/**
 * Classe abstrata base para todas as categorias de erro
 * Implementa lógica comum de matching e fornece defaults para métodos opcionais
 * 
 * Cada categoria concreta deve:
 * 1. Definir name, severity e priority
 * 2. Fornecer matchers no construtor
 * 3. Implementar getSuggestedActions()
 * 4. Implementar getUserFriendlyMessage()
 * 5. Opcionalmente sobrescrever isTemporary() e getRetryConfig()
 */
export abstract class BaseErrorCategory implements IErrorCategory {
  abstract readonly name: ErrorCategory;
  abstract readonly severity: ErrorSeverity;
  abstract readonly priority: number;
  
  protected matchers: IMatcher[] = [];
  
  /**
   * Cria uma nova categoria de erro
   * @param matchers - Array de matchers para identificar esta categoria
   */
  constructor(matchers: IMatcher[]) {
    this.matchers = matchers;
  }
  
  /**
   * Verifica se o erro corresponde a esta categoria
   * Usa os matchers fornecidos no construtor
   * @param error - Mensagem de erro a ser verificada
   * @returns true se algum matcher corresponder
   */
  matches(error: string): boolean {
    return this.matchers.some(matcher => matcher.matches(error));
  }
  
  /**
   * Retorna ações sugeridas para resolver o erro
   * Deve ser implementado por cada categoria concreta
   */
  abstract getSuggestedActions(): string[];
  
  /**
   * Cria mensagem amigável para o usuário
   * Deve ser implementado por cada categoria concreta
   */
  abstract getUserFriendlyMessage(originalError: string): string;
  
  /**
   * Verifica se o erro é temporário
   * Default: false (não temporário)
   * Override em categorias temporárias (RATE_LIMIT, TIMEOUT, NETWORK)
   */
  isTemporary(): boolean {
    return false;
  }
  
  /**
   * Retorna configuração de retry para esta categoria
   * Default: sem retry (maxRetries = 0)
   * Override em categorias que suportam retry
   */
  getRetryConfig(): RetryConfig {
    return { maxRetries: 0, baseDelayMs: 0 };
  }
}
