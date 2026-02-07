// frontend/src/hooks/cost/data/modelPricing.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Model Pricing Data Module
 *
 * Centraliza dados de preços de modelos de IA.
 * Fonte: Documentação oficial dos providers (atualizado em Jan 2026)
 *
 * @module hooks/cost/data/modelPricing
 */

/**
 * Estrutura de preços de um modelo
 */
export interface ModelPricing {
  /** Preço por 1M tokens de entrada (USD) */
  input: number;
  /** Preço por 1M tokens de saída (USD) */
  output: number;
}

/**
 * Identificador único do modelo no formato "provider:modelId"
 * @example "anthropic:claude-3-5-sonnet-20241022"
 * @example "openai:gpt-4-turbo"
 */
export type ModelId = string;

/**
 * Tabela de preços por modelo (USD por 1M tokens)
 * 
 * Formato da chave: "provider:modelId"
 * 
 * Para adicionar novo modelo:
 * 1. Consulte documentação oficial do provider
 * 2. Adicione entrada no formato: 'provider:modelId': { input: X, output: Y }
 * 3. Atualize testes se necessário
 */
export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  // OpenAI
  'openai:gpt-4-turbo': { input: 10.0, output: 30.0 },
  'openai:gpt-4': { input: 30.0, output: 60.0 },
  'openai:gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  
  // Anthropic
  'anthropic:claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'anthropic:claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'anthropic:claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'anthropic:claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  
  // Amazon Bedrock - Anthropic
  'amazon:anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 3.0, output: 15.0 },
  'amazon:anthropic.claude-3-opus-20240229-v1:0': { input: 15.0, output: 75.0 },
  'amazon:anthropic.claude-3-sonnet-20240229-v1:0': { input: 3.0, output: 15.0 },
  'amazon:anthropic.claude-3-haiku-20240307-v1:0': { input: 0.25, output: 1.25 },
  
  // Amazon Bedrock - Amazon
  'amazon:amazon.titan-text-express-v1': { input: 0.2, output: 0.6 },
  'amazon:amazon.titan-text-lite-v1': { input: 0.15, output: 0.2 },
  
  // Cohere
  'cohere:command-r-plus': { input: 3.0, output: 15.0 },
  'cohere:command-r': { input: 0.5, output: 1.5 },
  
  // Groq (gratuito com limites)
  'groq:llama-3.1-70b-versatile': { input: 0.0, output: 0.0 },
  'groq:llama-3.1-8b-instant': { input: 0.0, output: 0.0 },
  'groq:mixtral-8x7b-32768': { input: 0.0, output: 0.0 },
};

/**
 * Busca preços de um modelo específico
 * 
 * @param provider - Provider do modelo (ex: 'anthropic', 'openai')
 * @param modelId - ID do modelo (ex: 'claude-3-5-sonnet-20241022')
 * @returns Preços do modelo ou null se não encontrado
 * 
 * @example
 * ```typescript
 * const pricing = getModelPricing('anthropic', 'claude-3-5-sonnet-20241022');
 * if (pricing) {
 *   console.log(`Input: $${pricing.input}/1M tokens`);
 * }
 * ```
 */
export function getModelPricing(
  provider: string | null,
  modelId: string | null
): ModelPricing | null {
  if (!provider || !modelId) {
    return null;
  }
  
  const fullModelId: ModelId = `${provider}:${modelId}`;
  return MODEL_PRICING[fullModelId] || null;
}

/**
 * Verifica se um modelo tem preços disponíveis
 * 
 * @param provider - Provider do modelo
 * @param modelId - ID do modelo
 * @returns true se o modelo tem preços cadastrados
 * 
 * @example
 * ```typescript
 * if (hasModelPricing('anthropic', 'claude-3-5-sonnet-20241022')) {
 *   // Calcular custo
 * } else {
 *   // Mostrar "Preço não disponível"
 * }
 * ```
 */
export function hasModelPricing(
  provider: string | null,
  modelId: string | null
): boolean {
  return getModelPricing(provider, modelId) !== null;
}

/**
 * Retorna lista de todos os modelos com preços cadastrados
 * 
 * @returns Array de ModelIds
 * 
 * @example
 * ```typescript
 * const availableModels = getAvailableModels();
 * console.log(`${availableModels.length} modelos com preços`);
 * ```
 */
export function getAvailableModels(): ModelId[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * Retorna estatísticas sobre os preços cadastrados
 * 
 * @returns Estatísticas de preços
 * 
 * @example
 * ```typescript
 * const stats = getPricingStats();
 * console.log(`Modelo mais barato: ${stats.cheapest.modelId}`);
 * ```
 */
export function getPricingStats() {
  const models = Object.entries(MODEL_PRICING);
  
  if (models.length === 0) {
    return null;
  }
  
  let cheapest = models[0];
  let mostExpensive = models[0];
  let totalInput = 0;
  let totalOutput = 0;
  
  models.forEach(([modelId, pricing]) => {
    const avgCost = (pricing.input + pricing.output) / 2;
    const cheapestAvg = (cheapest[1].input + cheapest[1].output) / 2;
    const expensiveAvg = (mostExpensive[1].input + mostExpensive[1].output) / 2;
    
    if (avgCost < cheapestAvg) {
      cheapest = [modelId, pricing];
    }
    if (avgCost > expensiveAvg) {
      mostExpensive = [modelId, pricing];
    }
    
    totalInput += pricing.input;
    totalOutput += pricing.output;
  });
  
  return {
    totalModels: models.length,
    cheapest: {
      modelId: cheapest[0],
      pricing: cheapest[1]
    },
    mostExpensive: {
      modelId: mostExpensive[0],
      pricing: mostExpensive[1]
    },
    averages: {
      input: totalInput / models.length,
      output: totalOutput / models.length
    }
  };
}
