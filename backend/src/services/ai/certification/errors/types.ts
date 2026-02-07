// backend/src/services/ai/certification/errors/types.ts
// Standards: docs/STANDARDS.md

import { ErrorCategory, ErrorSeverity } from '../types';

/**
 * Configuração de retry para categorias de erro
 */
export interface RetryConfig {
  /** Número máximo de tentativas */
  maxRetries: number;
  /** Delay base em milissegundos (usado para backoff exponencial) */
  baseDelayMs: number;
}

/**
 * Interface principal do Strategy Pattern para categorização de erros
 * Cada categoria de erro deve implementar esta interface
 */
export interface IErrorCategory {
  /** Nome da categoria */
  readonly name: ErrorCategory;
  /** Severidade do erro */
  readonly severity: ErrorSeverity;
  /** Prioridade de matching (menor = maior prioridade) */
  readonly priority: number;
  
  /**
   * Verifica se o erro corresponde a esta categoria
   * @param error - Mensagem de erro a ser verificada
   * @returns true se o erro corresponde a esta categoria
   */
  matches(error: string): boolean;
  
  /**
   * Retorna ações sugeridas para resolver o erro
   * @returns Array de strings com ações sugeridas
   */
  getSuggestedActions(): string[];
  
  /**
   * Cria mensagem amigável para o usuário
   * @param originalError - Mensagem de erro original
   * @returns Mensagem amigável
   */
  getUserFriendlyMessage(originalError: string): string;
  
  /**
   * Verifica se o erro é temporário
   * @returns true se o erro é temporário e pode ser resolvido com retry
   */
  isTemporary(): boolean;
  
  /**
   * Retorna configuração de retry para esta categoria
   * @returns Configuração de retry
   */
  getRetryConfig(): RetryConfig;
}

/**
 * Interface para estratégias de matching de erros
 */
export interface IMatcher {
  /**
   * Verifica se o erro corresponde ao padrão
   * @param error - Mensagem de erro a ser verificada
   * @returns true se o erro corresponde ao padrão
   */
  matches(error: string): boolean;
}

/**
 * Resultado de uma tentativa de matching
 */
export interface MatchResult {
  /** Indica se houve match */
  matched: boolean;
  /** Categoria encontrada (se matched = true) */
  category?: IErrorCategory;
  /** Confiança do match (0-1, para futuras melhorias) */
  confidence?: number;
}
