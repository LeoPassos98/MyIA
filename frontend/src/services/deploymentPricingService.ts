// frontend/src/services/deploymentPricingService.ts
// LEIA ESSE ARQUIVO -> Standards: docs/STANDARDS.md <- NÃO EDITE O CODIGO SEM CONHECIMENTO DESSE ARQUIVO (MUITO IMPORTANTE)

/**
 * Deployment Pricing Service
 *
 * Serviço para buscar preços de modelos da API v2.
 * Substitui dados hardcoded de modelPricing.ts.
 *
 * @module services/deploymentPricingService
 */

import { api } from './api';

/**
 * Estrutura de preços de um deployment
 * Custos são por 1M tokens (padrão da indústria)
 */
export interface DeploymentPricing {
  /** Custo por 1M tokens de entrada (USD) */
  costPer1MInput: number;
  /** Custo por 1M tokens de saída (USD) */
  costPer1MOutput: number;
}

/**
 * Deployment retornado pela API v2
 */
export interface Deployment {
  id: string;
  baseModelId: string;
  providerId: string;
  deploymentId: string;
  inferenceType: 'ON_DEMAND' | 'INFERENCE_PROFILE' | 'PROVISIONED';
  costPer1MInput: number;
  costPer1MOutput: number;
  isActive: boolean;
  baseModel?: {
    id: string;
    name: string;
    vendor: string;
    family?: string;
  };
  provider?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Cache de deployments para evitar requests repetidos
 */
let deploymentsCache: Deployment[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todos os deployments ativos da API v2
 * 
 * @returns Promise com lista de deployments
 */
async function fetchDeployments(): Promise<Deployment[]> {
  const now = Date.now();
  
  // Retornar cache se válido
  if (deploymentsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return deploymentsCache;
  }
  
  try {
    const response = await api.get<{ deployments: Deployment[] }>(
      '/v2/deployments/active?includeBaseModel=true&includeProvider=true'
    );
    
    deploymentsCache = response.data.deployments;
    cacheTimestamp = now;
    
    return deploymentsCache;
  } catch (error) {
    console.error('[DeploymentPricingService] Erro ao buscar deployments:', error);
    // Retornar cache expirado se disponível
    if (deploymentsCache) {
      return deploymentsCache;
    }
    return [];
  }
}

/**
 * Busca preços de um modelo específico
 * 
 * @param provider - Provider do modelo (ex: 'bedrock', 'anthropic')
 * @param modelId - ID do modelo (ex: 'anthropic.claude-3-5-sonnet-20241022-v2:0')
 * @returns Preços do modelo ou null se não encontrado
 * 
 * @example
 * ```typescript
 * const pricing = await getDeploymentPricing('bedrock', 'anthropic.claude-3-5-sonnet-20241022-v2:0');
 * if (pricing) {
 *   console.log(`Input: $${pricing.costPer1MInput}/1M tokens`);
 * }
 * ```
 */
export async function getDeploymentPricing(
  provider: string | null,
  modelId: string | null
): Promise<DeploymentPricing | null> {
  if (!provider || !modelId) {
    return null;
  }
  
  const deployments = await fetchDeployments();
  
  // Buscar deployment pelo deploymentId (modelId no provider)
  // O modelId pode ser o deploymentId completo ou parte dele
  const deployment = deployments.find(d => {
    // Match exato pelo deploymentId
    if (d.deploymentId === modelId) {
      return true;
    }
    
    // Match pelo provider slug + deploymentId contém modelId
    if (d.provider?.slug === provider && d.deploymentId.includes(modelId)) {
      return true;
    }
    
    // Match pelo nome do modelo base
    if (d.baseModel?.name.toLowerCase().includes(modelId.toLowerCase())) {
      return true;
    }
    
    return false;
  });
  
  if (!deployment) {
    return null;
  }
  
  return {
    costPer1MInput: deployment.costPer1MInput,
    costPer1MOutput: deployment.costPer1MOutput
  };
}

/**
 * Busca preços de forma síncrona usando cache
 * 
 * @param provider - Provider do modelo
 * @param modelId - ID do modelo
 * @returns Preços do modelo ou null se não encontrado no cache
 */
export function getDeploymentPricingSync(
  provider: string | null,
  modelId: string | null
): DeploymentPricing | null {
  if (!provider || !modelId || !deploymentsCache) {
    return null;
  }
  
  const deployment = deploymentsCache.find(d => {
    if (d.deploymentId === modelId) {
      return true;
    }
    if (d.provider?.slug === provider && d.deploymentId.includes(modelId)) {
      return true;
    }
    if (d.baseModel?.name.toLowerCase().includes(modelId.toLowerCase())) {
      return true;
    }
    return false;
  });
  
  if (!deployment) {
    return null;
  }
  
  return {
    costPer1MInput: deployment.costPer1MInput,
    costPer1MOutput: deployment.costPer1MOutput
  };
}

/**
 * Verifica se um modelo tem preços disponíveis
 * 
 * @param provider - Provider do modelo
 * @param modelId - ID do modelo
 * @returns true se o modelo tem preços cadastrados
 */
export async function hasDeploymentPricing(
  provider: string | null,
  modelId: string | null
): Promise<boolean> {
  const pricing = await getDeploymentPricing(provider, modelId);
  return pricing !== null;
}

/**
 * Retorna lista de todos os deployments ativos
 * 
 * @returns Promise com lista de deployments
 */
export async function getActiveDeployments(): Promise<Deployment[]> {
  return fetchDeployments();
}

/**
 * Invalida o cache de deployments
 * Útil após operações de escrita
 */
export function invalidateDeploymentsCache(): void {
  deploymentsCache = null;
  cacheTimestamp = 0;
}

/**
 * Pré-carrega o cache de deployments
 * Útil para inicialização da aplicação
 */
export async function preloadDeploymentsCache(): Promise<void> {
  await fetchDeployments();
}

/**
 * Serviço singleton para acesso aos preços de deployments
 */
export const deploymentPricingService = {
  getPricing: getDeploymentPricing,
  getPricingSync: getDeploymentPricingSync,
  hasPricing: hasDeploymentPricing,
  getActiveDeployments,
  invalidateCache: invalidateDeploymentsCache,
  preloadCache: preloadDeploymentsCache
};
