// frontend/src/constants/contextDefaults.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO

/**
 * Configurações padrão do pipeline de contexto
 */
export const DEFAULT_CONTEXT_CONFIG = {
  systemPrompt: 'Você é uma IA útil e direta.',
  useCustomSystemPrompt: false,
  pinnedEnabled: true,
  recentEnabled: true,
  recentCount: 10,
  ragEnabled: true,
  ragTopK: 5,
  maxContextTokens: 6000,
} as const;

/**
 * Limites e valores default para configuração de contexto
 */
export const CONTEXT_LIMITS = {
  recentCount: {
    min: 1,
    max: 50,
    default: 10,
    marks: [
      { value: 1, label: '1' },
      { value: 10, label: '10' },
      { value: 25, label: '25' },
      { value: 50, label: '50' },
    ] as { value: number; label: string }[],
  },
  ragTopK: {
    min: 1,
    max: 20,
    default: 5,
    marks: [
      { value: 1, label: '1' },
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 20, label: '20' },
    ] as { value: number; label: string }[],
  },
  maxContextTokens: {
    min: 1000,
    max: 8000, // Default fallback se capabilities não carregar
    default: 6000,
    step: 1000,
  },
};
