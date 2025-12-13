// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

const ESTIMATED_COSTS: Record<string, { in: number, out: number }> = {
  'default': { in: 0.50, out: 1.50 },
  'gpt-4': { in: 30.00, out: 60.00 },
  'groq': { in: 0.05, out: 0.05 }
};

export const costService = {
  estimate(model: string, tokensIn: number, tokensOut: number): number {
    const costs = ESTIMATED_COSTS[model] || ESTIMATED_COSTS['default'];
    return ((tokensIn / 1_000_000) * costs.in) + ((tokensOut / 1_000_000) * costs.out);
  }
};
