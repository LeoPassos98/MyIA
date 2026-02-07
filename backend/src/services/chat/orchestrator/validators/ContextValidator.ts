// backend/src/services/chat/orchestrator/validators/ContextValidator.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Configuração do pipeline de contexto
 */
export interface ContextPipelineConfig {
  systemPrompt?: string;
  pinnedEnabled?: boolean;
  recentEnabled?: boolean;
  recentCount?: number;
  ragEnabled?: boolean;
  ragTopK?: number;
  maxContextTokens?: number;
}

/**
 * Configuração validada de contexto
 */
export interface ValidatedContextConfig {
  systemPrompt: string;
  pinnedEnabled: boolean;
  recentEnabled: boolean;
  recentCount: number;
  ragEnabled: boolean;
  ragTopK: number;
  maxContextTokens: number;
}

/**
 * Validador de configuração de contexto
 * 
 * Responsabilidades:
 * - Validar configuração de contexto
 * - Aplicar valores padrão
 * - Validar limites e ranges
 * - Normalizar configuração
 */
export class ContextValidator {
  // Valores padrão
  private static readonly DEFAULTS = {
    systemPrompt: 'Você é uma IA útil e direta.',
    pinnedEnabled: true,
    recentEnabled: true,
    recentCount: 10,
    ragEnabled: false,
    ragTopK: 5,
    maxContextTokens: 4000
  };

  // Limites
  private static readonly LIMITS = {
    recentCount: { min: 1, max: 50 },
    ragTopK: { min: 1, max: 20 },
    maxContextTokens: { min: 100, max: 100000 }
  };

  /**
   * Valida e normaliza configuração de contexto
   * 
   * @param config - Configuração fornecida (pode ser parcial)
   * @returns Configuração validada com valores padrão aplicados
   */
  validate(config?: ContextPipelineConfig): ValidatedContextConfig {
    if (!config) {
      return { ...ContextValidator.DEFAULTS };
    }

    return {
      systemPrompt: this.validateSystemPrompt(config.systemPrompt),
      pinnedEnabled: this.validateBoolean(config.pinnedEnabled, ContextValidator.DEFAULTS.pinnedEnabled),
      recentEnabled: this.validateBoolean(config.recentEnabled, ContextValidator.DEFAULTS.recentEnabled),
      recentCount: this.validateNumber(
        config.recentCount,
        ContextValidator.DEFAULTS.recentCount,
        ContextValidator.LIMITS.recentCount
      ),
      ragEnabled: this.validateBoolean(config.ragEnabled, ContextValidator.DEFAULTS.ragEnabled),
      ragTopK: this.validateNumber(
        config.ragTopK,
        ContextValidator.DEFAULTS.ragTopK,
        ContextValidator.LIMITS.ragTopK
      ),
      maxContextTokens: this.validateNumber(
        config.maxContextTokens,
        ContextValidator.DEFAULTS.maxContextTokens,
        ContextValidator.LIMITS.maxContextTokens
      )
    };
  }

  /**
   * Valida system prompt
   */
  private validateSystemPrompt(value?: string): string {
    if (!value || typeof value !== 'string') {
      return ContextValidator.DEFAULTS.systemPrompt;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return ContextValidator.DEFAULTS.systemPrompt;
    }

    return trimmed;
  }

  /**
   * Valida valor booleano
   */
  private validateBoolean(value: any, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return defaultValue;
  }

  /**
   * Valida número com limites
   */
  private validateNumber(
    value: any,
    defaultValue: number,
    limits: { min: number; max: number }
  ): number {
    // Se não fornecido ou inválido, usa padrão
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }

    // Aplica limites
    if (value < limits.min) {
      return limits.min;
    }
    if (value > limits.max) {
      return limits.max;
    }

    return value;
  }
}
