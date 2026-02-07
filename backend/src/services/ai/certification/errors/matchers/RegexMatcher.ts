// backend/src/services/ai/certification/errors/matchers/RegexMatcher.ts
// Standards: docs/STANDARDS.md

import { IMatcher } from '../types';

/**
 * Matcher baseado em expressões regulares
 * Suporta múltiplos padrões e matching case-insensitive
 */
export class RegexMatcher implements IMatcher {
  private patterns: RegExp[];
  private caseSensitive: boolean;

  /**
   * Cria um novo RegexMatcher
   * @param patterns - Array de expressões regulares para matching
   * @param caseSensitive - Se true, faz matching case-sensitive (padrão: false)
   */
  constructor(patterns: RegExp[], caseSensitive: boolean = false) {
    this.patterns = patterns;
    this.caseSensitive = caseSensitive;
  }

  /**
   * Verifica se o erro corresponde a algum dos padrões
   * @param error - Mensagem de erro a ser verificada
   * @returns true se algum padrão corresponder
   */
  matches(error: string): boolean {
    const text = this.caseSensitive ? error : error.toLowerCase();
    return this.patterns.some(pattern => pattern.test(text));
  }
}
