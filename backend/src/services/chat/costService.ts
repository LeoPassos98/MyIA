// backend/src/services/chat/costService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * ⚠️ AVISO IMPORTANTE - NÃO USE PARA AUDITORIA
 * 
 * Este serviço fornece ESTIMATIVAS aproximadas de custo.
 * 
 * ❌ NÃO PERSISTIR esses valores como `costInUSD` no banco de dados.
 * ✅ Para custo REAL (auditável), use: `getProviderInfo()` de `config/providerMap.ts`
 * 
 * Uso legítimo: telemetria, logs, debug, preview UI (dados não auditáveis).
 */

const ESTIMATED_COSTS: Record<string, { in: number, out: number }> = {
  'default': { in: 0.50, out: 1.50 },
  'gpt-4': { in: 30.00, out: 60.00 },
  'groq': { in: 0.05, out: 0.05 }
};

export const costService = {
  /**
   * Retorna uma ESTIMATIVA de custo (não use para auditoria).
   * Para custo real, use getProviderInfo() de providerMap.ts
   */
  estimate(model: string, tokensIn: number, tokensOut: number): number {
    const costs = ESTIMATED_COSTS[model] || ESTIMATED_COSTS['default'];
    return ((tokensIn / 1_000_000) * costs.in) + ((tokensOut / 1_000_000) * costs.out);
  }
};
