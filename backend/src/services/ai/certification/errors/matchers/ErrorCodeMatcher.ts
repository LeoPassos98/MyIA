// backend/src/services/ai/certification/errors/matchers/ErrorCodeMatcher.ts
// Standards: docs/STANDARDS.md

import { IMatcher } from '../types';

/**
 * Matcher baseado em códigos de erro HTTP ou AWS
 * Verifica se a mensagem de erro contém algum dos códigos especificados
 */
export class ErrorCodeMatcher implements IMatcher {
  private codes: string[];

  /**
   * Cria um novo ErrorCodeMatcher
   * @param codes - Array de códigos de erro (ex: ['429', '403', 'ThrottlingException'])
   */
  constructor(codes: string[]) {
    this.codes = codes;
  }

  /**
   * Verifica se o erro contém algum dos códigos
   * @param error - Mensagem de erro a ser verificada
   * @returns true se algum código for encontrado
   */
  matches(error: string): boolean {
    return this.codes.some(code => error.includes(code));
  }
}
