// frontend/src/hooks/cost/formatters/CostFormatter.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Cost Formatter Module
 *
 * Utilitários para formatação de custos para exibição.
 * Centraliza lógica de apresentação de valores monetários.
 *
 * @module hooks/cost/formatters/CostFormatter
 */

import { CostCalculationResult } from '../calculators/CostCalculator';

/**
 * Opções de formatação
 */
export interface FormatOptions {
  /** Mostrar símbolo de moeda (default: true) */
  showCurrency?: boolean;
  /** Locale para formatação (default: 'en-US') */
  locale?: string;
  /** Número mínimo de casas decimais (default: auto) */
  minDecimals?: number;
  /** Número máximo de casas decimais (default: auto) */
  maxDecimals?: number;
}

/**
 * Formatador de custos
 * 
 * Classe estática para formatação de valores monetários.
 * Aplica regras de formatação baseadas em faixas de valor.
 */
export class CostFormatter {
  /**
   * Formata custo para exibição amigável
   * 
   * Regras de formatação:
   * - $0.00 → "Gratuito"
   * - < $0.0001 → "< $0.0001"
   * - < $0.01 → 4 casas decimais
   * - < $1.00 → 3 casas decimais
   * - >= $1.00 → 2 casas decimais
   * 
   * @param cost - Custo em USD
   * @param options - Opções de formatação
   * @returns String formatada
   * 
   * @example
   * ```typescript
   * CostFormatter.format(0);           // "Gratuito"
   * CostFormatter.format(0.00005);     // "< $0.0001"
   * CostFormatter.format(0.0015);      // "$0.0015"
   * CostFormatter.format(0.15);        // "$0.150"
   * CostFormatter.format(1.5);         // "$1.50"
   * CostFormatter.format(150.5);       // "$150.50"
   * ```
   */
  static format(cost: number, options: FormatOptions = {}): string {
    const { showCurrency = true } = options;
    
    // Custo zero
    if (cost === 0) {
      return 'Gratuito';
    }
    
    // Custo muito pequeno
    if (cost < 0.0001) {
      return showCurrency ? '< $0.0001' : '< 0.0001';
    }
    
    // Determinar casas decimais baseado no valor
    let decimals: number;
    if (cost < 0.01) {
      decimals = 4;
    } else if (cost < 1) {
      decimals = 3;
    } else {
      decimals = 2;
    }
    
    // Aplicar overrides de opções
    if (options.minDecimals !== undefined) {
      decimals = Math.max(decimals, options.minDecimals);
    }
    if (options.maxDecimals !== undefined) {
      decimals = Math.min(decimals, options.maxDecimals);
    }
    
    const formatted = cost.toFixed(decimals);
    return showCurrency ? `$${formatted}` : formatted;
  }
  
  /**
   * Formata range de custos
   * 
   * @param min - Custo mínimo
   * @param max - Custo máximo
   * @param options - Opções de formatação
   * @returns String formatada (ex: "$0.001 - $0.005")
   * 
   * @example
   * ```typescript
   * CostFormatter.formatRange(0.001, 0.005);
   * // "$0.0010 - $0.0050"
   * ```
   */
  static formatRange(
    min: number,
    max: number,
    options: FormatOptions = {}
  ): string {
    const minFormatted = this.format(min, options);
    const maxFormatted = this.format(max, options);
    
    if (minFormatted === maxFormatted) {
      return minFormatted;
    }
    
    return `${minFormatted} - ${maxFormatted}`;
  }
  
  /**
   * Formata breakdown detalhado de custos
   * 
   * @param result - Resultado do cálculo de custo
   * @param options - Opções de formatação
   * @returns String formatada com breakdown
   * 
   * @example
   * ```typescript
   * const result = {
   *   inputCost: 0.003,
   *   outputCost: 0.030,
   *   totalCost: 0.033
   * };
   * 
   * CostFormatter.formatBreakdown(result);
   * // "Input: $0.0030 | Output: $0.0300 | Total: $0.033"
   * ```
   */
  static formatBreakdown(
    result: CostCalculationResult,
    options: FormatOptions = {}
  ): string {
    const input = this.format(result.inputCost, options);
    const output = this.format(result.outputCost, options);
    const total = this.format(result.totalCost, options);
    
    return `Input: ${input} | Output: ${output} | Total: ${total}`;
  }
  
  /**
   * Formata custo com locale específico
   * 
   * @param cost - Custo em USD
   * @param locale - Locale (ex: 'pt-BR', 'en-US')
   * @returns String formatada com locale
   * 
   * @example
   * ```typescript
   * CostFormatter.formatWithLocale(1.5, 'pt-BR');
   * // "US$ 1,50" (dependendo do locale)
   * ```
   */
  static formatWithLocale(cost: number, locale: string = 'en-US'): string {
    if (cost === 0) {
      return locale === 'pt-BR' ? 'Gratuito' : 'Free';
    }
    
    if (cost < 0.0001) {
      return locale === 'pt-BR' ? '< US$ 0,0001' : '< $0.0001';
    }
    
    // Determinar casas decimais
    let decimals: number;
    if (cost < 0.01) {
      decimals = 4;
    } else if (cost < 1) {
      decimals = 3;
    } else {
      decimals = 2;
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(cost);
  }
  
  /**
   * Formata custo por unidade
   * 
   * @param totalCost - Custo total
   * @param units - Número de unidades
   * @param unitName - Nome da unidade (ex: 'token', 'request')
   * @returns String formatada
   * 
   * @example
   * ```typescript
   * CostFormatter.formatPerUnit(0.033, 3000, 'tokens');
   * // "$0.0000110 per token"
   * ```
   */
  static formatPerUnit(
    totalCost: number,
    units: number,
    unitName: string = 'unit'
  ): string {
    if (units === 0) {
      return 'N/A';
    }
    
    const costPerUnit = totalCost / units;
    const formatted = this.format(costPerUnit);
    
    return `${formatted} per ${unitName}`;
  }
  
  /**
   * Formata percentual de economia
   * 
   * @param originalCost - Custo original
   * @param newCost - Novo custo
   * @returns String formatada (ex: "33% cheaper")
   * 
   * @example
   * ```typescript
   * CostFormatter.formatSavings(0.10, 0.07);
   * // "30% cheaper"
   * 
   * CostFormatter.formatSavings(0.07, 0.10);
   * // "43% more expensive"
   * ```
   */
  static formatSavings(originalCost: number, newCost: number): string {
    if (originalCost === 0) {
      return 'N/A';
    }
    
    const diff = originalCost - newCost;
    const percentDiff = Math.abs((diff / originalCost) * 100);
    const rounded = Math.round(percentDiff);
    
    if (diff > 0) {
      return `${rounded}% cheaper`;
    } else if (diff < 0) {
      return `${rounded}% more expensive`;
    } else {
      return 'Same cost';
    }
  }
}
