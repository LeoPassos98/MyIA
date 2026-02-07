// backend/src/services/ai/certification/errors/registry/CategoryRegistry.ts
// Standards: docs/STANDARDS.md

import { IErrorCategory, MatchResult } from '../types';

/**
 * Registro de categorias de erro com priorização automática
 * 
 * Responsabilidades:
 * - Gerenciar lista de categorias disponíveis
 * - Ordenar por prioridade automaticamente
 * - Fornecer API para matching
 * 
 * Uso:
 * ```typescript
 * const registry = new CategoryRegistry();
 * registry.register(new UnavailableCategory());
 * registry.register(new PermissionCategory());
 * 
 * const result = registry.findMatch(errorMessage);
 * if (result.matched) {
 *   console.log(result.category.name);
 * }
 * ```
 */
export class CategoryRegistry {
  private categories: IErrorCategory[] = [];
  
  /**
   * Registra uma nova categoria
   * Automaticamente ordena por prioridade (menor = maior prioridade)
   * @param category - Categoria a ser registrada
   */
  register(category: IErrorCategory): void {
    this.categories.push(category);
    // Ordenar por prioridade (menor = maior prioridade)
    this.categories.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Busca a primeira categoria que corresponde ao erro
   * Retorna no primeiro match encontrado (ordem de prioridade)
   * @param error - Mensagem de erro a ser categorizada
   * @returns Resultado do matching
   */
  findMatch(error: string): MatchResult {
    for (const category of this.categories) {
      if (category.matches(error)) {
        return { 
          matched: true, 
          category,
          confidence: 1.0  // Futuro: implementar cálculo de confiança
        };
      }
    }
    return { matched: false };
  }
  
  /**
   * Retorna todas as categorias registradas
   * @returns Array de categorias (cópia para evitar mutação)
   */
  getAllCategories(): IErrorCategory[] {
    return [...this.categories];
  }
  
  /**
   * Retorna o número de categorias registradas
   * @returns Número de categorias
   */
  getCount(): number {
    return this.categories.length;
  }
  
  /**
   * Limpa todas as categorias registradas
   * Útil para testes
   */
  clear(): void {
    this.categories = [];
  }
}
