// backend/src/services/ai/providers/bedrock/retry/BackoffCalculator.ts

/**
 * Configuração para cálculo de backoff exponencial
 */
export interface BackoffConfig {
  /** Delay inicial em milissegundos */
  initialDelayMs: number;
  /** Delay máximo em milissegundos */
  maxDelayMs: number;
  /** Multiplicador para backoff exponencial */
  backoffMultiplier: number;
  /** Percentual de jitter (0-1) para evitar thundering herd */
  jitterPercent?: number;
}

/**
 * Calcula delays para retry com backoff exponencial e jitter
 * 
 * **REUTILIZÁVEL** - Pode ser usado em qualquer provider que precise de retry logic
 * 
 * @example
 * ```typescript
 * const calculator = new BackoffCalculator({
 *   initialDelayMs: 1000,
 *   maxDelayMs: 10000,
 *   backoffMultiplier: 2,
 *   jitterPercent: 0.2
 * });
 * 
 * const delay1 = calculator.calculate(0); // ~1000ms ± 20%
 * const delay2 = calculator.calculate(1); // ~2000ms ± 20%
 * const delay3 = calculator.calculate(2); // ~4000ms ± 20%
 * ```
 */
export class BackoffCalculator {
  private readonly config: Required<BackoffConfig>;

  constructor(config: BackoffConfig) {
    this.config = {
      ...config,
      jitterPercent: config.jitterPercent ?? 0.2, // Default: 20% jitter
    };
  }

  /**
   * Calcula o delay para uma tentativa específica
   * 
   * Fórmula: min(initialDelay × multiplier^attempt, maxDelay) ± jitter
   * 
   * @param attemptNumber Número da tentativa (0-indexed)
   * @returns Delay em milissegundos com jitter aplicado
   */
  calculate(attemptNumber: number): number {
    // Backoff exponencial: initialDelay × multiplier^attempt
    const exponentialDelay = 
      this.config.initialDelayMs * 
      Math.pow(this.config.backoffMultiplier, attemptNumber);
    
    // Aplicar limite máximo
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);
    
    // Adicionar jitter (variação aleatória) para evitar thundering herd
    // Jitter = delay × jitterPercent × (random - 0.5)
    // Exemplo: 20% jitter = ±10% de variação
    const jitter = cappedDelay * this.config.jitterPercent * (Math.random() - 0.5);
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Calcula o delay total acumulado até uma tentativa
   * 
   * @param maxAttempts Número máximo de tentativas
   * @returns Delay total acumulado em milissegundos
   */
  calculateTotalDelay(maxAttempts: number): number {
    let total = 0;
    for (let i = 0; i < maxAttempts; i++) {
      total += this.calculate(i);
    }
    return total;
  }

  /**
   * Retorna a configuração atual
   */
  getConfig(): Readonly<Required<BackoffConfig>> {
    return { ...this.config };
  }
}
